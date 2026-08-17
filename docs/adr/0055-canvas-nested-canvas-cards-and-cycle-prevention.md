# ADR-0055: Canvas Nested Canvas Cards, Cycle Prevention, & Depth Capping

## Status
Accepted

## Context
Phase 11 of the Canvas Feature Plan implements nested canvas cards — cards that embed the contents of another `.canvas` file.

Because canvases can form complex reference graphs, recursive embedding introduces two major failure modes:
1. **Direct or indirect cycles**: A canvas embedding itself (`A -> A`) or cyclic reference loops (`A -> B -> A` or `A -> B -> C -> A`). Without prevention, recursive rendering results in an infinite component mounting loop and browser stack overflow/crash.
2. **Deep acyclic nesting chains**: Long linear or branching trees (`A -> B -> C -> D -> ... -> Z`) where each nested level mounts additional React Flow canvas instances and DOM nodes, causing memory exhaustion and UI degradation.

## Decision

### 1. Dual Safety Mechanism (Cycle Detection + Hard Depth Cap)
We enforce both mechanisms concurrently:
- **Active Ancestor Chain Tracking (Cycle Detection)**:
  - The runtime canvas hierarchy maintains an active `ancestorCanvasPaths: readonly string[]` list.
  - Before rendering any nested `.canvas` file, the path is normalized (`normalizeCanvasPath`) and checked against `ancestorCanvasPaths`.
  - If a matching path exists in the active ancestor chain, recursive mounting is aborted immediately.
  - The card renders a clear, non-broken user-facing state: **"Circular reference detected"** with the path chain displayed (e.g. `alpha.canvas ➔ beta.canvas ➔ alpha.canvas`).
- **Hard Nesting Depth Cap (`MAX_CANVAS_NESTING_DEPTH = 3`)**:
  - The maximum recursive rendering depth is capped at 3 levels.
  - When `ancestorCanvasPaths.length >= 3`, rendering of further nested canvases is stopped.
  - The card renders a clear user-facing state: **"Nesting limit reached"** (`Maximum nesting depth of 3 exceeded`).
- **Why both are required**:
  - A depth cap alone does not prevent shallow 2-level cycles (`A -> B -> A`), which would still mount redundant loops before hitting the depth ceiling.
  - Cycle detection alone does not prevent deep non-cyclic DAGs from mounting dozens of canvas instances and crashing the webview.

### 2. JSON Canvas 1.0 Data Model
- Nested canvas embeds strictly reuse the JSON Canvas 1.0 `"file"` node type (`type: "file"`, `file: "path/to/board.canvas"`), matching the pattern established for Markdown, Media (image/video), and PDF embeds.
- No new node types or runtime cycle metadata are persisted to disk. Ancestor chain tracking is strictly a runtime rendering concern.

### 3. Read-Only Preview Interaction Scope
- Nested canvases render a scoped, read-only preview (`ReadOnlyCanvasFlow.tsx`) with interactions disabled (`nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `panOnDrag={false}`, `zoomOnScroll={false}`, `fitView={true}`).
- The card header provides an "Open file" button that opens the referenced `.canvas` file as a top-level tab for full editing.

## Consequences
- 100% immune to direct self-reference (`A -> A`), indirect cycles (`A -> B -> A`), and runaway deep tree rendering.
- Spec-compliant with JSON Canvas 1.0.
- Zero bundle weight added to entry chunk.
