# ADR-0045: Canvas selection & arrangement semantics

## Status
Accepted

## Context
Multi-card selection/arrangement needs modifier keys, duplicate behavior, and alignment/distribution semantics that match established design-tool and Obsidian conventions without conflicting with existing canvas bindings.

## Decision
- **Shift = axis lock during drag**: holding Shift while dragging one or more nodes constrains movement to the dominant axis after a 5 px threshold (Figma/Sketch/Obsidian convention). Space is reserved for pan, Ctrl/Cmd for zoom/multi-select; no other modifier keys used for canvas drag.
- **Duplicate edges: internal-only**: when duplicating a selection, an edge is copied **iff both endpoints are inside the selection**; crossing edges are not duplicated (avoids dangling half-edges or duplicating unselected endpoints).
- **Ctrl/Cmd+D = duplicate selection**: guarded with the same input-field predicate as select-all so it never fires inside textareas/contenteditable.
- **React Flow selection APIs as-is**: single-click select, marquee drag-select, Shift-click add/remove via `selectionOnDrag={true}`, `SelectionMode.Partial`, `multiSelectionKeyCode="Shift"`. Left-drag on empty pane triggers marquee because `panOnDrag` is restricted to buttons 1 and 2. Only Ctrl/Cmd+A needed a custom keydown listener.
- **Count gating**: align buttons enable with ≥ 2 selected nodes; distribute buttons with ≥ 3; disabled buttons show explicit count-gate tooltips (e.g. "Select 2+ cards to align").
- **Distribution anchors first/last**: `distributeNodes` anchors the leftmost/topmost and rightmost/bottommost nodes and spreads intermediates equally — matches design-tool convention and avoids ambiguity about the set's extent.

## Consequences
- Matches Figma/Draw/Obsidian defaults; predictable output, no dangling edges on duplicate.
- 56 canvas tests passing; all source files ≤ 238 lines after refactoring into modular hooks.
