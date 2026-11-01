# Screen Review: JSON Canvas Board

## 1. Overview
- **Component Path**: [`packages/canvas/CanvasView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/packages/canvas/CanvasView.tsx), `CanvasFlowArea.tsx`, `CanvasNavToolbar.tsx`, `CanvasBottomDock.tsx`
- **Entry Points**: Opening any `.canvas` file from the file tree or clicking IconRail "New canvas".
- **Purpose & Core User Job**: Infinite 2D spatial ideation and visual mapping. Supports text cards, note embeds, images, videos, PDF documents, webpage links, color groups, and directed edges.
- **Current State Description**: Full-window infinite canvas backed by `@xyflow/react` and strict JSON Canvas 1.0 schema serialization. Bottom dock contains node insertion triggers and zoom/pan controls.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Zoom level percentage displayed in bottom toolbar; 750ms debounced save indicator. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar whiteboarding / infinite spatial canvas metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Full history stack with undo/redo (`useCanvasHistory.ts`); multi-selection and drag. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Implements the official JSON Canvas 1.0 open spec (`ADR-0041`). |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Prevents nested canvas cycle loops (depth cap of 3 per `ADR-0055`). |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Visual node color palette and edge direction handles on hover. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Dragging files from file tree directly drops them as canvas file cards (`ADR-0049`). |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean spatial grid dots without heavy UI chrome. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Broken file links render explicit fallback badges without corrupting canvas. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty canvas displays keyboard shortcuts helper. |
| Laws of UX | Fitts's Law | **Partial** | Edge connection handles on card corners are 10px circular targets. |
| Laws of UX | Hick's Law | **Pass** | Clean bottom dock grouping 4 card types (Text, File, Media, Link). |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Obsidian Canvas interactions (Space+drag to pan, scroll to zoom). |
| Laws of UX | Miller's Law | **Pass** | Color groups visually cluster related thoughts into discrete boundaries. |
| Laws of UX | Doherty Threshold | **Pass** | Virtualized viewport culling (`onlyRenderVisibleElements`) maintains 60fps on 500+ nodes. |
| Laws of UX | Postel's Law | **Pass** | Permissive parsing of JSON canvas files created by Obsidian or third-party tools. |
| Laws of UX | Von Restorff | **Pass** | Selected node highlighted with distinct accent border and resize handles. |
| Gestalt Laws | Common Region & Grouping | **Pass** | Group containers (`GroupCardNode.tsx`) establish clear visual regions for member nodes. |
| Design System | Flat & Tokens | **Pass** | Colors adhere to token palette; borders indicate selection without drop shadows. |
| A11y & Perf | Performance & Memory | **Pass** | Double-gated lazy loading of heavy PDF cards (`pdfjs-dist`) per ADR-0053. |

---

## 3. Issues & Recommended Fixes

### CNV-01: Tiny Edge Connection Handle Hitbox (10px)
- **Severity**: Medium
- **Rule Violated**: Fitts's Law
- **Evidence**: `packages/canvas/CanvasEdgeComponent.module.scss:18`: Circular edge handles are 10×10px `[Observed]`
- **Impact**: Users attempting to connect two cards with an arrow frequently miss the handle, resulting in dragging the card instead of creating an edge.
- **Suggested Fix**: Expand the transparent `::before` hit target of the handle to 24×24px while keeping the 10px visual circle centered.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.canvas-text-card` | Thin border + bg-primary | Structural card | Necessary spatial box; keep as-is |

---

## 5. What Works Well
- Viewport culling (`onlyRenderVisibleElements`) prevents DOM overload even when hundreds of notes are embedded.
- Full drag-and-drop integration from the left file tree directly onto the canvas.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Enlarge edge connector handle touch area to 24px.
- **Larger Work**: None.
