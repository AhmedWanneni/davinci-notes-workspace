# Phase 10: Graph View Implementation Plan

## Goal

Implement Phase 10: interactive local and global node-link visualization for the desktop app, reusing the `buildGraph` output from `@app/indexer` (Phase 4).

## User Review Required

> [!IMPORTANT]
> **Rendering Approach & Capping Strategy:**
> To satisfy `PERFORMANCE.md` constraints while strictly adhering to the SCSS design system, we will use **SVG rendering** combined with `d3-force` for the physics simulation.
>
> - `d3-force` is extremely lightweight (~5.5KB gzipped) and only handles physics, keeping the bundle small.
> - **Why SVG instead of Canvas?** Canvas requires manually parsing our SCSS token values (`getComputedStyle`), hand-drawing text, borders, and doing manual hit-testing for our `Tooltip` primitive. SVG lets us use our tokens, classes, and primitives natively.
> - **Capping Strategy:** SVG performance degrades above ~500 DOM nodes. However, rendering 500+ nodes in a force graph creates an unusable "hairball". Our capping strategy for the Global Graph will be to sort nodes by their "weight" (number of connections) and **hard-limit to the top 150-200 nodes**, grouping the rest or visually omitting them unless the user explicitly requests more. The Local Graph (current note + direct connections) inherently limits its size and will perform smoothly without caps.

Please confirm if this strategy (d3-force + SVG + Node Capping) aligns with your expectations, particularly the choice of SVG over Canvas given the strict capping.

## Proposed Changes

### `apps/desktop` (Dependencies)

#### [MODIFY] `package.json`

- Add `d3-force` (and its `@types`) for physics simulation.
- Add `d3-zoom` and `d3-drag` (and `@types`) for highly optimized SVG pan, zoom, and node dragging interactions. These are extremely small and tree-shakeable.

---

### `apps/desktop` (Graph View Feature)

#### [NEW] `src/components/GraphView/GraphView.tsx`

- The main container for the graph visualization.
- Maintains state for local vs. global mode.
- Computes the capped node/edge list from the full vault `GraphIndex` (for global) or computes the local subset (for local).
- Subscribes to the `useWorkspaceStore` to track the active note (to highlight it and center the local graph).

#### [NEW] `src/components/GraphView/GraphView.module.scss`

- Uses design-system tokens for styling SVG elements (`var(--color-bg-overlay)`, `var(--color-border)`, etc.).
- Defines hover states and transition effects on nodes/edges.

#### [NEW] `src/components/GraphView/useForceGraph.ts`

- A React hook that wraps `d3-force`.
- Accepts nodes and edges.
- Returns a list of reactive node/edge positions.
- **Performance consideration:** Uses `requestAnimationFrame` and internal throttling so React doesn't re-render 60 times a second unless the nodes actually move significantly.

#### [NEW] `src/components/GraphView/GraphRenderer.tsx`

- The presentational SVG component.
- Renders `<circle>` for nodes, `<line>` for edges.
- Integrates `d3-zoom` attached to a `<g>` wrapper for optimized, CSS-transform-based pan/zoom (does not trigger React renders on pan, only DOM updates).
- Wraps nodes with the design-system `Tooltip` for titles.
- Handles `onClick` to switch the active note via `useWorkspaceStore`.

---

### `apps/desktop` (UI Integration)

#### [MODIFY] `src/App.tsx`

- Add a toggle (e.g., in the sidebar or header) to open the Global Graph View in a `Dialog` or as a main-pane overlay.
- Add the Local Graph to a side panel (potentially replacing or living alongside the Backlinks panel).

## Verification Plan

### Manual Verification

1. **Local Graph**: Open different notes, verify the graph instantly updates to show correct outlinks and backlinks. Confirm tooltip hovers and click-to-navigate work.
2. **Global Graph**: Load the large fixture vault (350 notes). Toggle the global graph. Verify the capping strategy keeps it under 200 nodes and pan/zoom frame rates remain completely smooth (no lag).
3. **Performance**: Check initial load bundle impact to ensure it adheres to `PERFORMANCE.md` constraints (d3 modules should add <15KB gzipped). Monitor memory usage when rapidly switching notes.
