# ADR-0170: Save-time external-change guard with append-aware merge (supersedes ADR-0161)

## Status

Accepted (supersedes [0161](0161-external-vault-change-reconciliation.md))

## Context

ADR-0161 established that watcher reconciliation does not overwrite in-memory dirty editor content when external file modifications arrive. However, in the existing implementation:
1. `saveNoteNow(path)` was frontend-driven and assumed the editor buffer was always the canonical state to flush. It called `writeNote(path, content)`, unconditionally truncating and overwriting the file on disk.
2. When external modifications occurred (e.g. Quick Capture writes, sync operations, or external text editors), watcher reconciliation skipped dirty notes and logged a warning banner saying "Your unsaved editor content was kept". But within 750 ms (or on manual Cmd+S or tab switch), autosave fired and silently obliterated the external disk changes without warning.
3. This was an active silent data loss vulnerability, particularly critical before introducing the Phase 4 Quick Capture window which writes to notes from outside the main editor view.

## Decision

1. **In-Memory Disk State Tracking**:
   Maintain an in-memory `diskStateTracker` recording `{ mtime, size, content }` for each open note on open, clean watcher reload, and save.

2. **Save-Time Stat Guard**:
   In `performSaveNote`, query file metadata via a lightweight `stat_note(path)` call before saving.
   - **Fast Path**: If `stat.exists` is true and `stat.mtime == lastKnown.mtime` and `stat.size == lastKnown.size`, the file has not changed externally. Save proceeds directly with zero extra file reads.
   - **Changed Path**: If metadata differs, read the disk file and classify the difference with `classifyDiskChange`.

3. **Classification & Conflict Policy**:
   - `touched_only`: mtime updated but content identical. Save proceeds normally.
   - `pure_append`: The disk version has new content appended at the end (or tail), with identical prefix. The tail is cleanly merged into the in-memory editor buffer (`currentContent + tail`), dispatched to CodeMirror via external transaction annotations (without moving cursor, selection, scroll, or polluting the undo stack), and the merged note is saved.
   - `conflict`: Mid-file edit, deletion, truncation, or incompatible replacement. Autosave is paused for that note path, editor content is preserved, and a 3-action banner is displayed in the editor:
     - "Keep my version": Overwrites disk with user buffer.
     - "Use the disk version": Discards editor buffer and reloads disk content.
     - "Save mine as a copy": Writes user buffer to `<stem> (conflict <timestamp>).md`, re-indexes it, and reloads the original note with disk content.

4. **Queue Serialization**:
   All save and conflict resolution operations per note path are serialized using a lightweight per-path queue (`saveQueue.ts`) to prevent races between debounced autosaves, Cmd+S, tab switching, and quit flushes.

5. **Clean Exit Safety**:
   On app quit, `saveAllDirty()` checks all dirty notes. Any note still in conflict is automatically saved as a conflict copy so neither the external disk modification nor the unsaved user buffer can be lost on exit.

6. **Atomic Disk Writes**:
   `write_note` in Rust writes to a temporary sibling file (`.<stem>.tmp.<pid>`) and executes an atomic rename to prevent partial writes during unexpected termination.

## Consequences

- Completely eliminates silent overwrites of external modifications during auto-save.
- Pure appends (such as Quick Capture logging or external appending) integrate seamlessly without disruptive prompts or cursor jumps.
- High performance: unchanged files incur only a single stat call without redundant file reads.
- SQLite indexing remains strictly serialized via `withDbLock`.
