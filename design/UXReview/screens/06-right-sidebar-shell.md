# Screen Review: Right Sidebar Container

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/RightSidebar/RightSidebar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/RightSidebar/RightSidebar.tsx), [`_sidebar.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/layout/_sidebar.scss)
- **Entry Points**: Right vertical column; toggled with keyboard shortcut or status bar affordance. Drag handle resizes width.
- **Purpose & Core User Job**: Contextual inspectors hub: Linked Mentions, Version History, Document Outline (H1-H6), Local Graph, and Suggested Links.
- **Current State Description**: Multi-accordion container with chevron toggles, subsection counters, and context-aware empty states when a Canvas is active.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Accordions remember open/closed state; section counters show items count. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Document metadata and inspection drawers. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Sections collapse independently to customize vertical focus. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard accordion pattern matching Obsidian right sidebar. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Non-applicable panels show explicit empty notes on Canvas files (`ADR-0057`). |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Contextual icons (Link, TreeStructure, Clock, ShareNetwork) identify sections. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Fast jump to document sections without opening separate dialogs. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean dark background; collapsible sections save vertical space. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Graceful handling when no active note is open. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty states explain why content is absent. |
| Laws of UX | Fitts's Law | **Pass** | Accordion header buttons span full sidebar width (32px height). |
| Laws of UX | Hick's Law | **Pass** | 4 primary sections chunked vertically. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Obsidian right sidebar. |
| Laws of UX | Miller's Law | **Pass** | Chunked into discrete inspectors. |
| Laws of UX | Doherty Threshold | **Pass** | Smooth DOM toggle without re-fetching static note metadata. |
| Laws of UX | Postel's Law | **Pass** | Displays "Canvas outline not available" cleanly without crashing on JSON canvas. |
| Laws of UX | Von Restorff | **Pass** | Active section header text highlighted. |
| Gestalt Laws | Common Region | **Pass** | Single container bounded by hairline border-left. |
| Design System | Flat & Tokens | **Pass** | Uses design tokens; no drop shadows. |
| A11y & Perf | Drag Resizer | **Pass** | Resize handle maintains fluid 60fps drag. |

---

## 3. Issues & Recommended Fixes

### RSIDE-01: Lacks Keyboard Tab Cycling Between Accordions
- **Severity**: Low
- **Rule Violated**: Accessibility Standards + H7 Efficiency
- **Evidence**: `RightSidebar.tsx:78`: Accordion headers use standard `<button>` elements, but ArrowUp/ArrowDown does not move between headers `[Observed]`
- **Impact**: Keyboard users must press Tab multiple times to move between accordion headers when child contents are expanded.
- **Suggested Fix**: Wrap sections in Radix `@radix-ui/react-accordion` primitive with built-in arrow key navigation.
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.app-right-sidebar__section` | Hairline bottom border | Clean section divider | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Canvas-aware states (ADR-0057) prevent nonsensical zero-state counts when viewing `.canvas` files.
- DOM preservation on collapse maintains section scroll offsets.

---

## 6. Action Roadmap
- **Quick Wins**:
  - None; sidebar frame is solid.
- **Larger Work**:
  - Adopt Radix Accordion primitive.
