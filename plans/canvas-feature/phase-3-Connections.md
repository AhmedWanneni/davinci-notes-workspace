# Canvas Feature Phase 3: Connections (Edges)

Build Phase 3 from `canvas-feature-plan.md`: connections between cards using React Flow's built-in edge system, extended for JSON Canvas 1.0 spec edge attributes (handles/sides, directional endpoints, labels, and token-constrained colors).

## User Review Required

> [!NOTE]
> **Edge Colors**: Per the architectural mandate in `PERFORMANCE.md` and `canvas-feature-plan.md`, edge colors use a fixed palette mapped to the JSON Canvas 1.0 preset colors ("1" to "6") styled via design system color tokens (`--color-text-error`, `--color-text-warning`, `--color-text-success`, `--color-interactive-accent`, etc.) rather than an unconstrained arbitrary color picker.

## Proposed Changes

### Data Model & Translation Layer

#### [MODIFY] [canvasTranslation.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasTranslation.ts)
- Verify and refine `jsonEdgeToReactFlowEdge` and `reactFlowEdgeToJsonEdge` to ensure all JSON Canvas 1.0 edge fields (`fromNode`, `fromSide`, `fromEnd`, `toNode`, `toSide`, `toEnd`, `label`, `color`) are losslessly mapped to and from React Flow's `Edge` data models.
- Set default `toEnd: "arrow"` and `fromEnd: "none"` per spec when creating edges.

---

### Node Connection Handles

#### [MODIFY] [TextCardNode.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/TextCardNode.tsx)
- Add connection `<Handle />` components from `@xyflow/react` on all 4 sides (`top`, `right`, `bottom`, `left`).
- Support connection points for both incoming and outgoing connections.

#### [MODIFY] [TextCardNode.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/TextCardNode.module.scss)
- Style connection handles as subtle dot markers (`--color-border-normal`, `--color-accent`) positioned at the 4 card edges.
- Handles are hidden by default and appear smoothly on card hover or when the card is selected (`opacity: 0` to `opacity: 1`), keeping the canvas clutter-free.

---

### Custom Edge Component & Types

#### [NEW] [CanvasEdgeComponent.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasEdgeComponent.tsx)
- Custom React Flow edge rendering smooth bezier/step curve using `getBezierPath`.
- Support JSON Canvas colors (token-based presets 1–6 and custom hex) with dynamic SVG stroke and marker color.
- Render edge label at midpoint using `<EdgeLabelRenderer />` with design-system typography tokens.
- Double-click edge or label to trigger inline editing mode with Enter/Escape/blur commit handling.

#### [NEW] [CanvasEdgeComponent.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasEdgeComponent.module.scss)
- SCSS styles for edge paths, selection outlines, label tags, and inline label editing inputs.

#### [NEW] [canvasEdgeTypes.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasEdgeTypes.ts)
- Register custom edge type mappings for React Flow (`{ default: CanvasEdgeComponent }`).

#### [NEW] [canvasEdgeConstants.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasEdgeConstants.ts)
- Constants for edge ID generation (`createCanvasEdgeId()`), color palette definitions mapping JSON Canvas presets `"1"` through `"6"` to token CSS variables/values, and default edge dimensions.

---

### Canvas Edge Interactions & Persistence

#### [NEW] [useCanvasEdgeInteractions.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasEdgeInteractions.ts)
- `onConnect`: Create new connection between nodes with generated edge ID and side/handle detection.
- `onReconnect` / `onReconnectStart` / `onReconnectEnd`: Drag edge endpoint to retarget to another card using React Flow's `reconnectEdge`.
- `onEdgeContextMenu`: Open context menu with edge-specific options (Delete edge, Edit label, Change color palette).
- `onEdgeLabelChange` & `onEdgeColorChange`: Update edge data and trigger debounced canvas persistence.
- Edge deletion and node cascade deletion: When a node is deleted, guarantee that all incident edges (`edge.source === nodeId || edge.target === nodeId`) are cleanly removed from both React Flow state and underlying `CanvasData`.

#### [MODIFY] [CanvasContextMenu.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasContextMenu.tsx) & [CanvasContextMenu.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasContextMenu.module.scss)
- Add edge context menu actions: "Delete connection", "Edit label", and color palette swatch selector (Presets 1–6 + Default).

#### [MODIFY] [CanvasView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.tsx)
- Wire `edgeTypes={canvasEdgeTypes}`, `onConnect`, `onReconnect`, `onEdgeContextMenu`, `connectionMode={ConnectionMode.Loose}` into `<ReactFlow />`.

---

### Verification Plan

### Automated Tests
1. Unit tests for translation:
   - `pnpm --filter @app/canvas test` verifying edge translations with fromSide/toSide/fromEnd/toEnd/color/label.
2. Custom edge component & edge interaction tests:
   - Edge creation (`onConnect`), reconnection (`onReconnect`), label editing, color updates.
   - Node deletion cascade test: Confirm deleting a node removes all edges connected to it from `CanvasData`.
3. Monorepo-wide test suite:
   - `pnpm test` verifying all packages and desktop app tests pass.
4. Lint and typecheck:
   - `pnpm --filter @app/canvas lint && pnpm --filter @app/canvas exec tsc --noEmit`.

### Manual & Round-Trip Verification
- Connect multiple text cards across different sides (top, right, bottom, left).
- Edit edge label at midpoint, select color from preset palette.
- Reconnect edge endpoint to a different card.
- Delete connected card and verify incident edges are cascade-deleted.
- Confirm 750ms debounced persistence writes valid spec-compliant JSON Canvas file to disk and reloads with full fidelity.
