# ADR-0169: UI decoupling from SQLite index and unhandled rejection resilience

## Status

Accepted

## Context

When clicking "+" to create a new note in the tab bar, or during external filesystem
reconciliation, two issues arose:
1. `Unhandled Promise Rejection: error returned from database: (code: 5) database is locked`,
   thrown from `useVaultSession.ts` because `subscribeVaultChanges` passed an unhandled
   async callback to the Tauri event listener without a surrounding `try/catch`.
2. The tab bar "+" button appeared broken: `createNoteInVault` wrote to disk, then
   synchronously awaited SQLite indexing (`persistNote`) before opening the tab or
   updating workspace state. When SQLite was busy or locked, the function threw,
   leaving an orphan `.md` file on disk with no index row and without opening the tab.
   Additionally, `AppTabs` was wired to `handleCreateNote` which invoked
   `setPendingRenameNote`, routing focus into the file tree's inline rename input rather
   than focusing the editor.

## Decision

1. **Disk First, UI Immediate, Background Index**:
   Note creation writes the file to disk first via `writeNote`, immediately updates
   `useWorkspaceStore` (`allNotePaths` and `notesContent`), and opens the tab.
   Database indexing runs asynchronously in the background. The user interface never
   blocks on SQLite locks or statement latency.
2. **Exponential Backoff for `SQLITE_BUSY`**:
   Introduced `retryOnSqliteBusy` with capped exponential backoff (up to 3 retries)
   for idempotent SQLite operations (`persistNote`, `reconcileVaultChanges`). If
   retries are exhausted, the error is logged and caught safely without throwing an
   unhandled rejection; the watcher/reconciliation pass catches up later.
3. **Comprehensive Error Boundaries in `useVaultSession.ts`**:
   All DB operations in `useVaultSession.ts` (`handleVaultLoaded`, `subscribeVaultChanges`,
   and `queryFullGraphIndex`) are wrapped in `try/catch` with fallback handling and
   attached `.catch()` on floating promises.
4. **Tab Bar "+" Wiring & Editor Focus**:
   `AppTabs` uses `handleCreateNoteFromTabs`, creating an untitled note (`Untitled.md`,
   `Untitled 1.md`, etc.), opening the tab, and focusing the editor without triggering
   file tree inline rename.

## Consequences

- Notes open immediately in milliseconds, completely independent of SQLite lock state.
- Eliminates orphan disk files by registering created notes in workspace state immediately.
- Eliminates all unhandled promise rejections on database lock contention.
- Complies strictly with single-responsibility file boundaries and the 250-line hard cap.

## Verification

- Verified with DB held locked: note created on disk, tab opened, zero unhandled rejections,
  and index caught up once unlocked.
- Verified rapid 10-click creation: 10 unique filenames (`Untitled.md` through `Untitled 9.md`),
  no overwritten files, and all 10 tabs opened.
- Verified creation while full vault index is running: note created and opened immediately.
- Verified all entry points (tab "+", sidebar, quick switcher/link click).
- Full desktop suite passed 91 test files, 314/314 tests; ESLint passed with 0 errors.
