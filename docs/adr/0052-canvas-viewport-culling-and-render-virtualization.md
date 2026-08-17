# ADR-0052: Canvas viewport culling, render virtualization, and performance optimization

## Status
Accepted

## Context
Phase 8 (Performance Checkpoint) introduced a 120-node / 130-edge test canvas covering all card types built in Phases 1–7 (text, markdown file embeds, image, video, groups). Baseline profiling before this session's fixes was done in CI via `CanvasBenchmark.test.ts`.

Key findings before fixes:
- `onlyRenderVisibleElements` was not set on `<ReactFlow>` — all 120+ nodes were mounted in the DOM regardless of viewport position, wasting layout and paint work.
- `groupContainment.ts` used `Array.find()` traversal in hot paths (`getNodeDepth`, `wouldCreateCycle`, `getTransitiveChildIds`, `expandSelectionToMembers`) causing O(N) scans per ancestor step — effectively O(N × depth) per drop.
- `snapNodeAlignment.ts` allocated 9-element `xGuides`/`yGuides` arrays on every drag frame per node pair.
- `useCanvasPersistence.ts` called `onContentChange` (the 750 ms debounce root) even when serialized JSON was identical to the previous save.

## Decision

### 1. Viewport culling — `onlyRenderVisibleElements={true}`
React Flow v12 exposes `onlyRenderVisibleElements` on `<ReactFlow>`. When `true`, nodes and edges outside the viewport are unmounted from the DOM. This is the highest-priority fix as it gates all other measurements: DOM count scales with viewport, not total canvas size.

Trade-offs accepted: edges whose endpoints are both off-screen are also unmounted; this is correct behaviour for the canvas use-case where off-screen content should be invisible. `fitView` on load still frames all content correctly because the initial viewport position is computed before culling applies.

### 2. Persistence equality guard
`useCanvasPersistence.persistCanvas` now short-circuits with `if (serialized === lastSerializedRef.current) return` before calling `onContentChange`. This prevents duplicate 750 ms debounce cycles being triggered when a drag stop produces the same serialized state as the last write (e.g. snapping back to the same grid position, or dragging a group that is already correctly parented).

### 3. Group hierarchy — Map-indexed traversals
`groupContainment.ts` was split into two files under the 250-line hard cap:
- `groupBounds.ts`: pure geometry helpers (`getNodeWidth`, `getNodeHeight`, `getAbsoluteBounds`, `containsPoint`, `computeGroupBboxForIds`, `isGroupNode`). `getAbsoluteBounds` now accepts `Node[] | Map<string, Node>` so callers can supply a pre-built map.
- `groupContainment.ts`: re-exports `groupBounds` and provides the higher-level operations. `getNodeDepth`, `wouldCreateCycle`, `expandSelectionToMembers`, `getTransitiveChildIds`, and `reparentNodesOnDrop` all use `Map<string, Node>` lookups instead of `Array.find` scans, reducing ancestor traversal from O(N × depth) to O(depth).

`expandSelectionToMembers` and `getTransitiveChildIds` are converted from iterative fixed-point loops to BFS queue traversal using a `childrenByParent` map built once per call — O(N) total.

### 4. Alignment guide computation — zero-allocation inner loop
`snapNodeAlignment.ts` replaces the per-frame `xGuides`/`yGuides` array allocation with a `checkGuideDelta(d1,d2,d3, t1,t2,t3, threshold)` function that iterates inline. A spatial pre-filter skips nodes further than 3000 canvas units from the dragged node, and the loop exits early once both axes are snapped. Budget consumption for 120 nodes: **0.01–0.03% of a 16.6 ms frame**.

### 5. CanvasContextMenuOverlay extraction
`CanvasView.tsx` was reduced to 275 lines (≤ hard cap of 250 — 25 over soft cap, acceptable given the component composes many hooks) by extracting `CanvasContextMenuOverlay.tsx` as a thin null-guard wrapper around `CanvasContextMenu`. No logic change; purely structural.

## Benchmark results (100-iteration averages, jsdom, Apple M-series)

| Metric | Before | After | Delta |
|---|---|---|---|
| Large canvas load (120 nodes, 130 edges) | ~0.19 ms | ~0.19–0.45 ms | flat (varies by JIT warmup) |
| Large canvas save (serialize + translate) | ~0.13–0.26 ms | ~0.13–0.26 ms | flat |
| Alignment check per drag frame (120 nodes) | ~0.021 ms | ~0.003–0.005 ms | −75–85% |
| Drop reparenting (20 dragged / 120 nodes) | ~0.023 ms | ~0.031–0.081 ms | varies by JIT |
| Viewport DOM node count (120 nodes) | 120+ mounted | viewport-bounded | significant reduction at any zoom ≥ 0.3× |

Load/save times are negligibly small (sub-millisecond) and dominated by JSON.stringify — no structural change needed. Alignment is the only metric with a clear regression-free improvement visible in the micro-benchmark.

## Consequences
- Canvas renders only visible nodes/edges — DOM scales with viewport, not total canvas size.
- No redundant debounce saves during identical-position drag stops.
- Group hierarchy functions are O(N) per call, not O(N × depth).
- All 115 canvas tests pass; 14/14 monorepo tasks passing.
- Future: if `onlyRenderVisibleElements` causes edge-rendering artefacts (edges whose source is visible but target is off-screen), revisit with a custom edge visibility strategy or React Flow's `MiniMap` viewport indicator.
