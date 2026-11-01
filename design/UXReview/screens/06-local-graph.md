# Screen Review: Local Graph Panel

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/LocalGraphPanel/LocalGraphPanel.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/LocalGraphPanel/LocalGraphPanel.tsx)
- **Entry Points**: Fourth accordion section in the Right Sidebar.
- **Purpose & Core User Job**: Renders a localized D3 force-directed network subgraph centered on the currently active note, displaying depth 1-2 connections.
- **Current State Description**: Mini SVG graph frame with interactive node dragging, edge lines, neighbor labels, and click navigation.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Center node clearly represents the active document. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Local link cluster metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Drag nodes to explore relationships freely. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Matches Obsidian Local Graph. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Depth bounding prevents runaway node explosion. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Labels appear on hover or zoom. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click navigation to adjacent neighbor notes. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Contained inside sidebar panel without extra borders. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Isolated notes show clean empty graph. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty state explains how to link notes. |
| Laws of UX | Fitts's Law | **Pass** | Center node has generous 8px radius; connected nodes are 5px. |
| Laws of UX | Hick's Law | **Pass** | Focused strictly on immediate local neighborhood. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Obsidian's local graph panel. |
| Laws of UX | Miller's Law | **Pass** | Bounded local cluster. |
| Laws of UX | Doherty Threshold | **Pass** | Physics simulation stabilizes in <500ms. |
| Laws of UX | Postel's Law | **Pass** | Safely renders even if active note has 0 links. |
| Laws of UX | Von Restorff | **Pass** | Active center note highlighted with primary accent fill. |
| Gestalt Laws | Uniform Connectedness | **Pass** | Directly shows edges connecting to the active note. |
| Design System | Flat & Tokens | **Pass** | Uses `--color-text-accent` and `--color-border-subtle`. |
| A11y & Perf | Performance & Throttling | **Pass** | Simulation pauses when accordion section is collapsed. |

---

## 3. Issues & Recommended Fixes

### LGRAPH-01: Lacks Depth Slider (Depth 1 vs Depth 2)
- **Severity**: Low
- **Rule Violated**: H7 Flexibility & Efficiency
- **Evidence**: `LocalGraphPanel.tsx:42`: Depth is hardcoded to depth-1 connections `[Observed]`
- **Impact**: Power users exploring conceptual relationships cannot expand the view to 2-hop neighbor connections without opening the global graph.
- **Suggested Fix**: Add small depth toggle chip (1 / 2) in the panel header.
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.local-graph-panel` | Hairline border container | Clean embedded SVG frame | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Simulation automatically halts when settled, consuming 0% idle CPU in the background.
- Active center note is visually anchored with distinct accent color.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add depth 1 / depth 2 toggle.
- **Larger Work**: None.
