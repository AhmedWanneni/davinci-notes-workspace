# ADR-0049: Native HTML5 Drag and Drop for canvas note embeds

## Status
Accepted

## Context
Phase 6 requires a mechanism to drag notes from the file tree sidebar onto the canvas to instantiate file-embed cards. This is the first drag-and-drop interaction in the application.

## Decision
Use standard browser HTML5 Drag and Drop APIs directly without introducing external drag-and-drop frameworks (e.g. `@dnd-kit`, `react-dnd`):
- `FileTree.tsx`: Sets `draggable={isFile}` on file rows and attaches `onDragStart` setting payload `application/vnd.davinci.note` and `text/plain` to `item.node.path`.
- `CanvasView.tsx`: Handles `onDragOver` (setting `dropEffect = "copy"`) and `onDrop`. On drop, computes viewport flow coordinates via React Flow's `screenToFlowPosition({ x: e.clientX, y: e.clientY })`, snaps coordinates to the 24px grid, and creates a `CanvasFileNode`.

## Consequences
- **Zero bundle cost**: No additional library weight or wrapper overhead.
- **Scoped and predictable**: Solves the specific note-to-canvas embed interaction without unnecessary architectural abstraction across the app.
- **Interoperable**: Custom MIME type `application/vnd.davinci.note` identifies internal notes reliably while `text/plain` provides fallback.
