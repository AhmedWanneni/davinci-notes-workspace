# ADR-0210: Bookmarks Storage, Identity, and Lifecycle Architecture

## Status
Accepted

## Context
Users need the ability to bookmark notes and access them from a dedicated Bookmarks page in the sidebar icon rail and top tabs. The feature must adhere to DaVinci Notes' local-first principles:
1. Portable and transparent storage that syncs across devices via Google Drive manifest-diff and Syncthing without requiring an owned backend or SQLite migration churn.
2. Stable identity through vault renames, folder moves, H1 ↔ filename sync, and external file changes.
3. Safe multi-device reconciliation that avoids last-write-wins file truncation.
4. Lightweight performance with zero startup footprint and zero new runtime dependencies.

## Decisions

### 1. Storage: Plain JSON file inside the vault
- The source of truth is `<vault>/.davinci/bookmarks.json`, colocated with `.davinci/icons.json` and `.davinci/covers.json`.
- SQLite is NOT the source of truth. Note titles, previews, and metadata are derived on-demand from the existing SQLite index and in-memory cache with zero per-row disk reads.
- Atomic writes: persisted using `writeNote` (Rust `write_note` temp-file + atomic rename) wrapped with `withVaultWatchSuppressed` to prevent self-triggering watcher loops.
- Corrupted or empty files: safe fallback to `{ version: 1, bookmarks: [] }` without destructive overwrite until user action.

### 2. Identity and Lifecycle
- Each bookmark is represented by `{ path: string; addedAt: number; missing?: boolean }`.
- **Rename & Move**:
  - In-app note renames (`renameNoteInVault`) atomically remap `path` while preserving `addedAt`.
  - In-app folder renames (`renameFolderInVault`) recursively remap all bookmarks prefixed with `oldFolderPath + "/"`.
  - H1 ↔ filename sync delegates to canonical `renameNoteInVault`, updating the bookmark path with no feedback loop (since bookmark persistence does not modify markdown note contents).
  - External watcher renames (`batch.renamed`) remap corresponding bookmark paths.
- **Deletions**:
  - In-app deletions (`deleteNoteInVault`) and external removals (`batch.removed`) mark the bookmark as `missing: true` rather than silently discarding it.
  - If a missing note is recreated or restored, it seamlessly clears the missing state.
  - Missing bookmarks display with a warning indicator and an explicit "Remove" action in the UI.

### 3. Merge Safety: Union by Path with Newest `addedAt`
- When external changes modify `.davinci/bookmarks.json` (detected by watcher or sync pass), the file is parsed and merged with in-memory state.
- Merge rule: union by `path`. If both local and remote contain the same path, the record with the higher `addedAt` timestamp wins. Disjoint paths are preserved. Neither device's additions are lost.
- Debounce: disk writes are debounced at 400 ms and flushed immediately on vault switch, tab change, or app quit.

### 4. Tab Integration and Lazy-Loaded UI
- **Icon Rail**: `BookmarkSimple` Phosphor icon. Clicking it opens or focuses the Bookmarks page.
- **Tab Integration**: Bookmarks opens as a dedicated tab (`davinci://bookmarks`), ensuring single-tab uniqueness without duplicates. Closing the tab or switching away preserves standard tab navigation and session restore (`vaultSwitchOrchestrator`).
- **Performance Boundary**: `BookmarksView` is lazy-loaded via dynamic `import()`. List virtualization via `@tanstack/react-virtual` activates above 200 items. Zero new npm packages added.

## Consequences
- Bookmarks sync automatically across desktop and mobile through existing file sync transports.
- No database migrations or schema alterations required.
- Zero startup penalty on initial app load.
- Resilient against external git pulls, syncthing merges, and file reorganizations.
