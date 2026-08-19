# ADR-0064: Canonical note delete and duplicate

## Status
Accepted

## Context
Note creation (ADR-0058) and rename (ADR-0060) already have canonical vault operations that keep filesystem state, SQLite, graph data, and workspace tabs aligned. Deleting or duplicating a note through a direct UI-only mutation would recreate the same consistency risks. The existing file-tree drag payload is consumed by canvas embeds, so it must retain copy semantics rather than become an ambiguous note-move operation.

## Decision
- **`deleteNoteInVault(path)`** is the only note-delete path: Rust `delete_note` IPC, SQLite note and link cleanup, graph cleanup, timer cleanup, and workspace-tab/content cleanup. The file-tree context action asks for native confirmation before this permanent deletion.
- **`duplicateNoteInVault(path)`** is the only note-duplicate path: read source content, create a collision-safe `<stem> copy.md` path, synchronize its first H1 to the new filename, write it, index it, update the graph, and open the copy.
- `resolveUniqueNotePath(existingPaths, preferredPath?)` accepts a preferred vault-relative note path while retaining `Untitled.md` as its default creation behavior.
- Note move remains deferred. File-tree drag-and-drop continues to advertise `copy` for canvas file embeds only; it does not move vault files.

## Consequences
- Delete and duplicate use no new dependency and do no per-keystroke work.
- Duplicate operations immediately have a correct index/graph/tab state instead of waiting for watcher reconciliation.
- Delete is permanent for now; the confirmation prevents accidental context-menu invocation. A future trash/recovery feature must replace the Rust command inside the canonical helper, not add an alternate UI path.
