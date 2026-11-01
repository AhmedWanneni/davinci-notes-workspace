# Screen Review: Global Graph View

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/GlobalGraphLeaf/GlobalGraphLeaf.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/GlobalGraphLeaf/GlobalGraphLeaf.tsx), [`GraphView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/GraphView/GraphView.tsx)
- **Entry Points**: Clicking IconRail "Graph view" icon or via Command Palette.
- **Purpose & Core User Job**: Visualizes connections, clusters, and backlink networks across all notes in the vault using a physics-driven force graph.
- **Current State Description**: Full-screen D3-force SVG graph with node repulsion, edge lines, hover labels that scale with zoom (ADR-0032), node capping to 200 nodes (ADR-0031), and header with Close button.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Physics simulation settles smoothly; nodes draggable with instant rebound. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Neural / knowledge graph network visualization. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Close button (`X`) returns to previous document view; Escape closes leaf. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Consistent with Obsidian's iconic Graph View. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | 200-node capping prevents WebGL/SVG freeze on giant vaults (`ADR-0031`). |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Node titles appear dynamically as user zooms into clusters. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Clicking any node navigates directly to that note. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean dark background; nodes and lines use token contrast. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Empty graph handled with graceful empty state. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Hover tooltips describe connected neighbor count. |
| Laws of UX | Fitts's Law | **Partial** | Highly connected nodes are larger, but small peripheral nodes have tiny 4px radius. |
| Laws of UX | Hick's Law | **Pass** | Visual spatial exploration without menu clutter. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Obsidian's global graph navigation. |
| Laws of UX | Miller's Law | **Pass** | Clusters form natural thematic chunks. |
| Laws of UX | Doherty Threshold | **Pass** | 60fps force simulation tick via D3; stops simulation when stable. |
| Laws of UX | Postel's Law | **Pass** | Handles disconnected orphan notes gracefully. |
| Laws of UX | Von Restorff | **Pass** | Central hub nodes stand out with larger radius and brighter fill. |
| Gestalt Laws | Uniform Connectedness | **Pass** | Edge lines express relationships between notes directly. |
| Design System | Flat & Tokens | **Pass** | Uses `--color-text-accent` and `--color-border-subtle` for graph nodes/edges. |
| A11y & Perf | Performance Capping | **Pass** | Strict 200-node cap enforces sub-500ms startup per PERFORMANCE.md. |

---

## 3. Issues & Recommended Fixes

### GRAPH-01: Peripheral Node Hitbox Too Small on High-DPI Displays
- **Severity**: Low
- **Rule Violated**: Fitts's Law
- **Evidence**: `GraphView.tsx:112`: Leaf nodes with 1 backlink render with `r={3.5}` SVG circle `[Observed]`
- **Impact**: Difficult to target with mouse pointer without zooming in deeply.
- **Suggested Fix**: Add an invisible `pointer-events="all"` hover circle with `r={12}` around all nodes.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.global-graph-leaf` | Full-window SVG canvas | Borderless view leaf | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Zoom-scaling labels (ADR-0032) prevent label overlapping and unreadable text blobs.
- Top-200 node capping (ADR-0031) completely protects frame rate on large vaults.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Expand peripheral node click hitbox to 12px radius.
- **Larger Work**: None.
