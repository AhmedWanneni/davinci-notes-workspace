# Implementation Plan — Canvas Phase 11: Nested Canvas Cards

## Problem Description
Phase 11 of the Canvas Feature Plan implements **Nested Canvas Cards** — cards that render the contents of another `.canvas` file within themselves.

Because nested canvases can form recursive reference chains (e.g., Canvas A embedding Canvas A, or Canvas A embedding Canvas B which embeds Canvas A), **strict cycle prevention and nesting depth capping must be designed and enforced before rendering code is executed**.

---

## 1. Cycle Prevention & Depth Capping Design

### Threat & Failure Modes
1. **Direct Self-Reference**: Canvas `A.canvas` contains a file card embedding `A.canvas`.
2. **Indirect Cycle**: Canvas `A.canvas` embeds `B.canvas`, which in turn embeds `A.canvas` (or longer cycles `A -> B -> C -> A`).
3. **Runaway Recursion in Deep Acyclic Graphs**: Long chains `A -> B -> C -> D -> E -> ...` where each level mounts additional React Flow canvases, multiplying DOM nodes and memory consumption.

### Dual Mechanism Architecture
We implement **both** mechanisms in tandem:
1. **Runtime Ancestor Chain Tracking (Cycle Detection)**:
   - The active root canvas initializes `ancestorCanvasPaths: [normalize(path)]`.
   - Each nested canvas card checks if its target file path is already present in `ancestorCanvasPaths`.
   - If `ancestorCanvasPaths.includes(normalize(targetPath))`: **Cycle detected!**
   - Renders a user-facing placeholder: **"Circular reference detected"** with the path cycle chain (e.g., `A.canvas ➔ B.canvas ➔ A.canvas`).
2. **Maximum Nesting Depth Cap**:
   - `MAX_CANVAS_NESTING_DEPTH = 3` (level 0 root canvas, level 1 first nested card, level 2 nested inside that, level 3 max).
   - If `ancestorCanvasPaths.length >= MAX_CANVAS_NESTING_DEPTH`: **Depth cap exceeded!**
   - Renders a user-facing placeholder: **"Nesting limit reached"** (`Maximum nesting depth of 3 reached`).

### Why Both Mechanisms Are Strictly Necessary
- A depth cap alone does not prevent shallow cycles (`A -> B -> A` has depth 2, which would recurse indefinitely if not caught).
- Cycle detection alone does not prevent deep non-cyclic DAGs from exhausting browser memory and DOM nodes.
- Both mechanisms together provide airtight recursion safety.

---

## 2. Data Model & Spec Compliance
- Per JSON Canvas 1.0 specification, nested canvases use the existing `"file"` node type:
  ```json
  {
    "id": "card-subcanvas",
    "type": "file",
    "file": "boards/sub-board.canvas",
    "x": 100,
    "y": 100,
    "width": 600,
    "height": 400
  }
  ```
- `FileCardType` extended with `"canvas"` discriminant.
- Ancestor chain tracking is purely a runtime rendering concern propagated through React Context, keeping `.canvas` JSON files 100% spec-compliant.

---

## 3. Recursive Rendering & Interaction Scope
- **Read-Only Scope**: Nested canvases render a scaled-down, read-only preview of the target canvas.
- Interactions are scoped to read-only (`fitView={true}`, `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `panOnDrag={false}`, `zoomOnScroll={false}`).
- Clicking "Open file" in the card header opens the referenced `.canvas` file in the main application tab for full editing.

---

## Proposed Changes

### `@app/canvas`

#### [NEW] `packages/canvas/nestedCanvasUtils.ts`
- Constants: `MAX_CANVAS_NESTING_DEPTH = 3`.
- Functions: `normalizeCanvasPath`, `detectCanvasCycle`, `checkNestingLimit`, `validateNestedCanvas`.

#### [NEW] `packages/canvas/nestedCanvasUtils.test.ts`
- Unit tests for path normalization, direct cycle detection, indirect cycle detection, depth limit gating, and valid acyclic trees.

#### [NEW] `packages/canvas/ReadOnlyCanvasFlow.tsx`
- Non-interactive, scoped React Flow renderer for nested canvas previews.

#### [NEW] `packages/canvas/NestedCanvasCardView.tsx`
- Component that validates cycle/depth limits, loads canvas content, parses and renders `<ReadOnlyCanvasFlow>`, and provides child `ancestorCanvasPaths`.

#### [NEW] `packages/canvas/NestedCanvasCard.test.tsx`
- Component tests for all 4 required verification cases:
  1. Direct self-reference (`A -> A`).
  2. Indirect cycle (`A -> B -> A`).
  3. Long non-cyclic chain exceeding depth cap (`A -> B -> C -> D`).
  4. Valid moderate-depth nested canvas (2-3 levels, acyclic).

#### [MODIFY] `packages/canvas/mediaCardUtils.ts`
- Extend `FileCardType` with `"canvas"` and add `isCanvasFile`.

#### [MODIFY] `packages/canvas/FileCardHeader.tsx`
- Render `SquaresFour` icon for `fileType === "canvas"`.

#### [MODIFY] `packages/canvas/FileCardNode.tsx` & `FileCardNode.module.scss`
- Wire `fileType === "canvas"` to render `NestedCanvasCardView`. Add SCSS styles for nested canvas container, blocked states, and cycle path badges.

#### [MODIFY] `packages/canvas/CanvasEditorContext.ts`
- Add `ancestorCanvasPaths?: readonly string[]`.

#### [MODIFY] `packages/canvas/CanvasView.tsx`
- Initialize `ancestorCanvasPaths` from current canvas `path`.

#### [MODIFY] `packages/canvas/index.ts`
- Export nested canvas utilities and constants.

---

### Documentation & Architecture

#### [NEW] `docs/adr/0055-canvas-nested-canvas-cards-and-cycle-prevention.md`
- ADR documenting cycle prevention design, depth capping (cap = 3), and read-only preview interaction model.

#### [MODIFY] `DECISIONS.md`
- Add ADR-0055 row in Canvas table.

#### [MODIFY] `PROGRESS.md`
- Update with Phase 11 completion and verification results.

---

## Verification Plan

### Automated Tests
- Run full canvas test suite: `pnpm --filter @app/canvas test`
- Verify 4 required test cases:
  1. **Direct Cycle**: Canvas A embeds Canvas A -> "Circular reference detected".
  2. **Indirect Cycle**: Canvas A embeds B, B embeds A -> "Circular reference detected".
  3. **Depth Limit**: Chain `A -> B -> C -> D` with depth > 3 -> "Nesting limit reached".
  4. **Valid Nested Tree**: 2-3 levels acyclic -> Renders nested cards properly.
- Run workspace build and lint: `pnpm --filter @app/desktop build:web` and check file line lengths (<250 lines).
