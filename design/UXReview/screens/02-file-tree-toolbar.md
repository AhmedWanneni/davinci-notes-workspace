# Screen Review: File Tree Toolbar

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/FileTree/FileTreeToolbar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/FileTreeToolbar.tsx), [`FileTreeToolbar.module.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/FileTreeToolbar.module.scss)
- **Entry Points**: Positioned directly above the virtualized file tree list in the left sidebar.
- **Purpose & Core User Job**: Provides secondary tree actions: Collapse all folders, change sort order (A-Z, Z-A, Modified time, Created time), and quick filter input.
- **Current State Description**: Thin action row with icon buttons and an inline collapsible search/filter input.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Active sort indicator visible in dropdown. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar file sorting and filter operations. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | "Collapse all" allows instant reset of cluttered tree state. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Uses standard Phosphor icons and tooltips. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Non-destructive view operations. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Tooltips on every button describe action. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Fast inline filter isolates files in large vaults instantly. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Subtle hairline row without heavy button boxes. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Clear button resets active filter input with Escape. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Placeholder "Filter files..." hints behavior. |
| Laws of UX | Fitts's Law | **Partial** | Toolbar buttons are 24×24px, slightly below 32px comfortable target. |
| Laws of UX | Hick's Law | **Pass** | Compact set of 3 actions. |
| Laws of UX | Jakob's Law | **Pass** | Matches VS Code file explorer view actions header. |
| Laws of UX | Miller's Law | **Pass** | 3 actions (Filter, Collapse, Sort). |
| Laws of UX | Doherty Threshold | **Pass** | Instant DOM update on filter input. |
| Laws of UX | Postel's Law | **Pass** | Case-insensitive substring matching in filter. |
| Laws of UX | Von Restorff | **Pass** | Subdued until hovered. |
| Gestalt Laws | Proximity & Alignment | **Pass** | Grouped right-aligned above file tree list. |
| Design System | Flat & Tokens | **Pass** | Uses design tokens; no drop shadows or raw hex codes. |
| A11y & Perf | Hitboxes & Labels | **Pass** | Accessible labels and tooltip wrappers on all buttons. |

---

## 3. Issues & Recommended Fixes

### TBAR-01: Slightly Narrow Toolbar Button Hitbox (24px)
- **Severity**: Low
- **Rule Violated**: Fitts's Law
- **Evidence**: `FileTreeToolbar.module.scss:18`: Buttons styled with `width: 24px; height: 24px;` `[Observed]`
- **Impact**: Requires slightly higher pointer precision when collapsing all folders.
- **Suggested Fix**: Increase button dimensions to `28×28px` with `padding: 4px`.
- **Effort**: S (<10m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.file-tree-toolbar` | Flat flex row, hairline bottom border | Clean separation | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Instant real-time filtering with Escape key reset.
- "Collapse all folders" cleans up deep tree hierarchies with one click.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Enlarge button hit area to 28×28px.
- **Larger Work**: None.
