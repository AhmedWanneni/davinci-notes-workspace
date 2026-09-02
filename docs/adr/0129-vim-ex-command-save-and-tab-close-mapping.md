# ADR-0129: Vim Ex command save and tab-close mapping

## Status
Accepted

## Context
Phase 5 of the Vim keybindings integration plan requires defining the scope, semantics, and implementation paths for Vim Ex commands (`:w`, `:q`, `:wq`, `:x`, `:qa`, `:wqa`) within a local-first note-taking app that uses continuous debounced auto-saving.

In traditional Vim, `:w` writes buffer contents to disk and `:q` closes the editor window/buffer. In this app:
- Notes auto-save continuously on every edit via a 750ms debounce timer.
- Multiple notes are open as tabs within a single application window.

## Decision
1. **`:w` / `:write` Mapping**:
   - Mapped to Option (b): `:w` forces an immediate flush of the active note's pending debounced save (`saveNoteNow(activeNotePath)`), writing dirty changes to disk and updating the SQLite index synchronously without waiting for the 750ms timer.
   - Shows an in-editor notification `"\"[Filename]\" written"`.
2. **`:q` / `:quit` Mapping**:
   - Mapped to closing the active note tab via `closeNote(activeNotePath)`.
   - Uses the canonical tab-close routine, which automatically flushes pending H1 renames and debounced saves before removing the tab.
3. **`:wq` / `:x` Mapping**:
   - Flushes the active note save immediately via `saveNoteNow(activeNotePath)` and then invokes `closeNote(activeNotePath)`.
4. **`:qa` / `:qall` & `:wqa` / `:wqall` / `:wall` Multi-Tab Mapping**:
   - Mapped to closing all open tabs via `closeAllNotes()`.
   - `closeAllNotes()` invokes `saveAllDirty()`, which flushes all pending H1 renames and saves every dirty note in `dirtyNotes` across all open tabs to disk and SQLite index before clearing `openNotes`.
   - **No Confirmation Prompt**: Because `saveAllDirty()` guarantees 100% data flush before tab closure, un-saved data loss is impossible, making confirmation dialogs redundant and intrusive.
5. **Unsupported Ex Commands**:
   - Commands outside this scope (e.g. `:sp`, `:vsp`, `:e`) are caught by `@replit/codemirror-vim`'s Ex parser and display a clean status notification (`Not an editor command: <cmd>`), preventing silent failures or uncaught errors.

## Consequences
- Ex commands map directly onto the app's existing canonical save and tab lifecycle.
- Zero data-loss risk during single-tab (`:q`/`:wq`) or multi-tab (`:qa`/`:wqa`) closures under active concurrent edits.
- Existing tab-close and save behavior for non-Vim users remains completely unaffected.
