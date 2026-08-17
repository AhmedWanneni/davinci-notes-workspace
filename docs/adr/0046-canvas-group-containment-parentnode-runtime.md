# ADR-0046: Canvas group containment strategy — runtime parentNode + spec-compliant bbox serialization

## Status
Accepted

## Context
JSON Canvas 1.0 defines `group` nodes as visual containers but does **not** specify any explicit parent/child relationship field (no `parentId` / `children` arrays). Group membership is implicit: a node is "in" a group if its `x`/`y` position falls within the group's bounding box (`x ≤ node.x < x+width`, same for y). This is unambiguous for non-overlapping groups at a single z-order, but it leaves the UI with a gap: dragging a group frame should move its contents together, and this needs to propagate through nested levels.

Two runtime options exist:
1. **Implicit-only**: recompute group contents on every drag frame by bbox intersection. Requires custom drag code that walks nodes, tests containment per level, and moves descendants. Works but reimplements what React Flow already provides.
2. **Explicit parentNode at runtime, bbox on disk**: use React Flow's built-in `Node.parentNode` + `extent: 'parent'` for UI-level containment and automatic nested drag propagation. Serialize back to absolute world coordinates when writing the `.canvas` file so the output is 100% JSON Canvas 1.0 compliant with no custom fields. Restore `parentNode` links on load by recomputing bbox containment.

Option 2 is a strict superset: the runtime reaps React Flow's correctness (no drag-sync bugs, extent clipping, nested propagation for free), while the file format stays interoperable with Obsidian and any JSON Canvas reader.

## Decision
- **Runtime**: assign `parentNode` to the smallest enclosing group after load (smallest area = most specific). For overlapping groups, node array order (higher index = top = wins) breaks ties.
- **UI**: group nodes use `extent: 'parent'` so React Flow clips child position and propagates drags automatically at every nesting level.
- **Persistence**: `reactFlowToJsonCanvas` converts any `parentNode`-relative coordinates back to absolute coordinates by summing ancestor positions, and strips `parentNode` / `extent` fields. `.canvas` files on disk never contain React Flow implementation details.
- **Round-trip**: `jsonCanvasToReactFlow` re-derives `parentNode` links on every load via bbox containment walk (top-level first, then for each node, assign to tightest-fit group that contains its position).

## Consequences
- Drag of outer group ⇒ inner groups + all contents move together with 0 custom drag code.
- 100% JSON Canvas 1.0 interop: no extensions written to disk.
- Cost of containment resolution is O(n × m) per load; for any realistic canvas (< 1000 nodes) this is unmeasurable.
- Caveat: two overlapping groups at the same visual z-order have ambiguous membership; we deterministically pick the "top" one (array order) rather than leaving it undefined.
