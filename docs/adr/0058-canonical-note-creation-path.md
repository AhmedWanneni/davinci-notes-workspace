# ADR-0058: Canonical note creation path — no `window.prompt()` in Tauri

## Status
Accepted

## Context
"New note" entry points (sidebar button, tab bar `+`) called `window.prompt()` for a title. Native `prompt()` is unsupported in the Tauri webview — the handler returned immediately with no dialog and no file was created. Canvas creation hit the same issue and was fixed by creating `Untitled.canvas` with collision suffixes; note creation was left on `prompt()`.

Note creation logic was also duplicated between `useVaultSession.createNewNote` and `EditorArea.handleCreateNote` (canvas text-card → file conversion).

## Decision
- One canonical `createNoteInVault(path, content?)` in `apps/desktop/src/vault/` performs: `write_note` IPC → SQLite `persistNote` → `updateAllPaths`, wrapped in `withVaultWatchSuppressed` to avoid watcher double-index loops. Default body comes from `initialNoteContent(path)` (see ADR-0059).
- Toolbar/sidebar/tab "new note" actions call `createNewNote()` with **no title prompt** — auto-generate `Untitled.md`, `Untitled 1.md`, … via `resolveUniqueNotePath` (same pattern as canvas).
- Wikilink resolution, command-palette create-on-Enter, daily notes, and canvas `onCreateNote` all route through `createNoteInVault` or `createNewNote` (which delegates to it).

## Consequences
- New notes get a sensible default name; users rename via the filename in the tree or by editing the `#` heading.
- No reliance on browser modal APIs in the desktop shell.
- Future creation entry points must call `createNoteInVault` / `createNewNote`, not reimplement write+index.
