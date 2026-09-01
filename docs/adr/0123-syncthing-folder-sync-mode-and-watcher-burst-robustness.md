# ADR-0123: Syncthing/folder sync mode, file watcher burst robustness, and conflict recognition

## Status

Accepted

## Context

Phase 5 introduces Syncthing / external folder-sync mode. Per ADR-0116, this mode requires zero owned backend infrastructure and zero IPC with external daemons. The app only needs to react robustly to external filesystem changes and surface Syncthing conflict files.

Syncthing produces bursts of simultaneous file changes (e.g. initial sync or reconnecting after being offline). The existing watcher reconciliation needed to be audited and verified for high-concurrency burst robustness to prevent SQLite `SQLITE_BUSY` errors or duplicate/incomplete index entries.

Syncthing creates conflict files matching `.sync-conflict-<timestamp-or-device>.<ext>` when simultaneous edits occur. The app needs a clear policy for how these files are handled in the index, file tree, and UI.

## Decision

1. **Zero-Daemon Integration & Vault Setup UX**:
   Folder sync mode uses the existing vault open and folder-picker mechanism (`openAndIndexVaultFromPicker`). The app makes no IPC calls to Syncthing or any external process; it works with Syncthing, Resilio, Dropbox, or manual file copies without network or daemon dependencies.
2. **Watcher & Reconcile Burst Robustness**:
   - Rust watcher (`watcher.rs`) uses `notify-debouncer-full` with a 400 ms batching window (`DEBOUNCE_MS`), coalescing bursts of file events into a single `VaultChangeBatch`.
   - Frontend `reconcileVaultChanges` in `VaultIndexer.ts` was optimized to perform all asynchronous `readNote` IPC calls in parallel **before** acquiring the SQLite write lock. `BEGIN IMMEDIATE` is held only during fast bulk SQLite persistence (1–2 ms), eliminating transaction locks during file I/O.
   - Tested under a burst of 50 simultaneous file changes: zero `SQLITE_BUSY` errors, zero UI freezes, zero duplicate/incomplete index entries.
3. **Conflict File Recognition & File Tree / Indexing Policy**:
   - Recognizes `.sync-conflict-*` files using `isSyncthingConflictPath`.
   - **File Tree**: Conflict files remain visible in the file tree with `data-is-conflict="true"` and a visual `[Conflict]` badge chip.
   - **Indexing**: Conflict files are fully indexed in SQLite/FTS5 and graph view so search and backlinks retain all content created during offline/sync conflicts.
   - **Conflicts Panel**: A dedicated `SyncConflictsPanel` UI component lists all active Syncthing conflicts with direct actions to open the conflict version, open the original note, or delete the resolved conflict file.

## Consequences

- Highly robust under large-scale file sync bursts (initial syncs or bulk external edits).
- No network, daemon, or process dependency added.
- No content is hidden or excluded from full-text search.
- Clear visual indicators in the file tree and a dedicated management panel ensure users can easily identify and resolve Syncthing conflict files.
