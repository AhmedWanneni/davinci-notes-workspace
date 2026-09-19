# 158. File Tree Context Menu Dismissal, Keyboard Navigation, and Folder CRUD Architecture

Date: 2026-09-19

## Context

The file tree context menu and folder actions had several ergonomic and safety gaps:
1. **Unresponsive click-away dismissal**: The hand-built floating menu remained open when clicking outside, clicking window title bar/header regions (`data-tauri-drag-region`), scrolling, switching windows, or pressing `Escape`.
2. **Missing folder actions**: The menu offered only file actions and lacked folder-scoped note creation, folder creation, folder rename, and folder delete.
3. **Folder rename/delete indexing gaps**: Renaming or deleting folders did not transactionally reindex child notes in SQLite (`notes`, `fts_notes`, `links`), did not purge dirty note buffers/save timers, and did not close active tabs for deleted descendants.
4. **Safety and Root Protection**: Renaming or deleting vault root or system/hidden directories (`.git`, `.obsidian`) was unprotected.

## Decisions

1. **Robust Context Menu Dismissal (`useContextMenuDismiss`)**:
   - Register a capture-phase `pointerdown` listener on `document` so outside clicks (even on Tauri drag regions or unclickable areas) immediately dismiss the menu.
   - Register `Escape` keydown, `window.blur`, and scroll listeners to dismiss the menu on any interaction or viewport change.
   - Constrain menu coordinate placement to viewport boundaries so the menu cannot spawn offscreen.

2. **Context Menu Hierarchy and Keyboard Navigation**:
   - Provide tailored menu actions for:
     - **Files**: Open, Rename (`F2`), Duplicate, Delete (`⌫` / `Delete`).
     - **Folders**: New note, New folder, Rename (`F2`), Delete (`⌫` / `Delete`).
     - **Root empty space**: New note, New folder.
   - Arrow keys (`ArrowUp`, `ArrowDown`, `Home`, `End`) navigate through focusable items; `Escape` closes the menu.
   - Suppress context menu opening on hidden/system files and directories.

3. **Folder Creation & Inline Editing UX**:
   - Header button actions create notes/folders inside the currently selected folder (or vault root if none selected).
   - Creating a note or folder automatically selects it, expands parent folders, and triggers inline rename focus for immediate naming.

4. **Batched Folder Rename with SQLite Transaction**:
   - `renameFolderInVault` validates destination names, sanitizes stem inputs, and checks for collisions.
   - Descendant notes are batch reindexed in SQLite within a single `withDbLock` and `withDbTransaction` block.
   - Workspace state (tabs, active path, `allNotePaths`, `allFolderPaths`, dirty buffers, and save timers) is atomically updated.

5. **Safe Folder Deletion with Confirmation**:
   - Rust command `delete_folder` enforces canonical vault root boundaries and path safety via `resolve_in_vault`.
   - File tree UI prompts the user with a confirmation dialog detailing recursive deletion of folder contents.
   - `deleteFolderInVault` purges all descendant notes from SQLite (`notes`, `links`, `fts_notes`), clears cached markdown content, dirty notes, save timers, removes nodes from the graph index, closes open tabs for deleted notes, and advances the active tab if necessary.

## Status

Accepted.
