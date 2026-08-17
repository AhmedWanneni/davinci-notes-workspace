# Canvas Phase 8 — Performance Checkpoint Plan

Performance audit, baseline measurement, and optimization for `packages/canvas` when handling large canvases (100+ cards and 100+ edges across text, markdown file embeds, image embeds, video embeds, and groups).

## User Review Required

> [!IMPORTANT]
> **Key Architectural Optimizations**:
> 1. **Viewport Virtualization / Culling**: Enabling `onlyRenderVisibleElements={true}` on React Flow so off-screen cards, file embeds, and media cards are not mounted in the DOM.
> 2. **Save & Debounce Deduplication**: Ensuring multi-card dragging and drag stops do not trigger redundant serialization cycles or multiple write debounce triggers.
> 3. **Linear Group & Hierarchy Traversal**: Optimizing `groupContainment.ts` and `snapNodeAlignment.ts` from O(N²) / allocation-heavy loops to O(N) map-indexed lookups and zero-allocation guide checking.
> 4. **Lazy Media & Content Loading**: Ensuring off-screen media (images/videos) and markdown documents are only loaded/fetched when their cards enter the visible viewport.

---

## Proposed Changes

### 1. Fixtures & Benchmarking

#### [NEW] [large-canvas.canvas](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/fixtures/large-canvas.canvas)
- Spec-compliant JSON Canvas 1.0 fixture containing 120 cards (50 text cards, 30 markdown notes, 20 image embeds, 10 video embeds, 10 groups) and 130 edges.
- Cards arranged in a structured, sprawling canvas layout for realistic viewport culling and spatial queries.

#### [NEW] [generateLargeCanvas.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/fixtures/generateLargeCanvas.ts)
- Reusable generator function to programmatically generate N-node and M-edge canvases with customizable card type distributions.

#### [NEW] [CanvasBenchmark.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasBenchmark.test.ts)
- Performance benchmark suite measuring:
  - Serialization time (`reactFlowToJsonCanvas` + `serializeCanvas`) for 120 nodes/130 edges vs empty canvas.
  - Parsing / deserialization time (`parseCanvas` + `jsonCanvasToReactFlow`) for 120 nodes/130 edges vs empty canvas.
  - Drag / alignment compute latency per frame across 120 nodes.
  - Viewport DOM culling verification (confirming rendered DOM count with vs without `onlyRenderVisibleElements`).

---

### 2. Viewport Culling & React Flow Optimization

#### [MODIFY] [CanvasView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.tsx)
- Add `onlyRenderVisibleElements={true}` to `<ReactFlow>`.
- Configure `elevateNodesOnSelect={true}` and optimal viewport settings.
- Ensure file length remains under 200 lines (split helper sub-components if needed).

---

### 3. Persistence, Debounce & Drag Optimizations

#### [MODIFY] [useCanvasPersistence.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasPersistence.ts)
- Add equality guard in `persistCanvas` (`if (serialized === lastSerializedRef.current) return;`) to avoid re-triggering parent store updates when state is identical.

#### [MODIFY] [useCanvasNodeChanges.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasNodeChanges.ts)
- Refine `shouldPersistNodeChanges` to avoid duplicate persist calls on mouse drag stop (since `useCanvasDrag.ts:onNodeDragStop` handles snapped drop persistence).

#### [MODIFY] [snapNodeAlignment.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/snapNodeAlignment.ts)
- Optimize `snapNodeToAlignment` to eliminate per-frame object/array allocations (`xGuides`, `yGuides`) and use spatial bounding box pre-filtering.

#### [MODIFY] [groupContainment.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/groupContainment.ts)
- Optimize parent-child traversals (`getAbsoluteBounds`, `reparentNodesOnDrop`, `expandSelectionToMembers`, `getTransitiveChildIds`, `getNodeDepth`, `wouldCreateCycle`) to use indexed `Map` lookups instead of repeated array `.find()` scans.

---

### 4. Verification, Documentation & Decisions

#### [NEW] [0052-canvas-viewport-culling-and-render-virtualization.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/adr/0052-canvas-viewport-culling-and-render-virtualization.md)
- ADR recording decision to enable React Flow `onlyRenderVisibleElements` and lazy media fetching.

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Register ADR-0052 in Canvas table.

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Update Phase 8 status with before/after measurement table and next up pointer to Phase 9 (PDF cards).

#### [MODIFY] [docs/HISTORY.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/HISTORY.md)
- Append detailed session history for Phase 8.

---

## Verification Plan

### Automated Tests
- Run `npm test` across monorepo to ensure all 14 tasks and unit tests pass.
- Run `packages/canvas/CanvasBenchmark.test.ts` to output precise latency metrics (parsing, serializing, round-trip, alignment compute).
- Verify DOM node count in jsdom/React Testing Library with `onlyRenderVisibleElements`.

### Manual / Devtools Profiling
- Measure baseline vs optimized performance numbers.
- Confirm zero ESLint and TypeScript errors.
