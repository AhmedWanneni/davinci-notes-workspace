# 157. File Tree Drag UI, Pure Validation, and Drop Target Feedback

Date: 2026-09-19

## Context

The file tree supports moving notes and dropping external files into vault folders. However, previous iterations suffered from:
1. Stale drag ghost images cached across drag operations due to relying on default WebKit row snapshotting without `setDragImage`.
2. Inconsistent cursor drop effects when hovering invalid targets (e.g. self, descendants, or current parent folder).
3. Missing visual feedback: no source row dimming, no drop target highlight, no root drop boundary, and no hover-to-expand behavior for collapsed folders.

## Decisions

1. **Synchronous Flat Drag Preview**:
   - In `dragstart`, construct a lightweight offscreen preview pill (`fileTreeDragPreview.ts`) containing the Phosphor SVG file/folder icon, truncated item name, and multi-select badge if applicable.
   - Render synchronously and call `event.dataTransfer.setDragImage(previewEl, 12, 16)`.
   - Tear down the preview element on the next animation frame to prevent DOM leakage.

2. **Pure Drop Validation (`getDropEffect`)**:
   - Validate drop candidates against pure constraints:
     - Dragging a node onto itself or into its own subfolder returns `none`.
     - Dragging a node into its current immediate parent folder returns `none`.
     - Dropping into hidden or system folders (e.g. `.git`) returns `none`.
     - Dropping into a valid destination folder or vault root returns `move` for internal items and `copy` for external files.
     - Hovering a file row resolves to its containing parent folder.
   - Attach drop validation to both `dragenter` and `dragover` events.

3. **Deferred Source Dimming & Active Grabbing**:
   - Dim the source dragged row (`opacity: 0.5`, `data-is-dragging="true"`) deferred via `requestAnimationFrame` to ensure the native snapshot is captured before opacity changes.
   - Attach global `dragend` and `keydown` (`Escape`) listeners on `window` to reliably clean up drag state even if the drop target was missed or the drag was cancelled outside the window.
   - Use `:active { cursor: grabbing; }` for pre-drag styling with documentation noting macOS OS cursor management during native drag sessions.

4. **Drop Target Visuals & Hover-to-Expand**:
   - Folder drop targets receive a 1px focus border and background token (`data-drop-target="true"`).
   - The tree root receives an inset focus border when dropping onto the root (`data-drop-root="true"`).
   - Container-level event delegation tracks `dropTargetFolder` without per-row state thrashing.
   - Hovering over a collapsed folder for 600ms automatically expands it, cancelling the timer immediately if the pointer moves to another target or leaves the tree.
   - Respect `prefers-reduced-motion: reduce` by disabling transitions.

## Status

Accepted.
