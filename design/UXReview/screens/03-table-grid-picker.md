# Screen Review: Table Grid Picker Popover

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EditorArea/TableGridPicker.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/TableGridPicker.tsx), [`TableGridPopover.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/TableGridPopover.tsx)
- **Entry Points**: Selecting "Table" from the editor slash menu or clicking Table icon in the formatting toolbar.
- **Purpose & Core User Job**: Visual 2D matrix selector allowing users to insert Markdown tables of custom dimensions (up to 8×8) with header row.
- **Current State Description**: Interactive grid of squares highlighting up to hover coordinates with dimension label (e.g. "3 × 4 Table").

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Highlighted cells and dimension label show exact dimensions before inserting. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar table creation grid (Word / Google Docs / Notion). |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Escape key cancels; click-away dismisses. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard office productivity table grid pattern. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Prevents inserting malformed markdown table syntax. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Visual spatial representation rather than typing row/column numbers. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click generation of fully formatted GFM markdown table with alignment dashes. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean grid squares without container baggage. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Single `Cmd+Z` undo reverts table insertion cleanly. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Dimension caption updates on mouse move. |
| Laws of UX | Fitts's Law | **Pass** | Grid cells are contiguous, allowing smooth continuous mouse hovering. |
| Laws of UX | Hick's Law | **Pass** | Intuitive 2D continuous choice. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Microsoft Word / Notion table dimension pickers. |
| Laws of UX | Miller's Law | **Pass** | Single focused task. |
| Laws of UX | Doherty Threshold | **Pass** | Instant hover cell highlighting (<16ms). |
| Laws of UX | Postel's Law | **Pass** | Automatically generates valid GFM separator row `|---|---|`. |
| Laws of UX | Von Restorff | **Pass** | Active highlighted quadrant clearly indicated with accent background. |
| Gestalt Laws | Proximity & Uniform Connectedness | **Pass** | Grid matrix communicates table structure intuitively. |
| Design System | Flat & Tokens | **Pass** | Uses design tokens for cell borders and accent colors. |
| A11y & Perf | Keyboard Accessibility | **Partial** | Mouse-driven; lacks arrow-key navigation to pick dimensions with keyboard only. |

---

## 3. Issues & Recommended Fixes

### TBL-01: Lacks Keyboard Arrow Navigation for Grid Dimension Selection
- **Severity**: Low
- **Rule Violated**: Accessibility Standards + H7 Efficiency
- **Evidence**: `TableGridPicker.tsx:42-70`: Grid cell selection relies strictly on `onMouseEnter` and `onClick` `[Observed]`
- **Impact**: Keyboard-only users who trigger table insertion via Slash menu cannot adjust row/column dimensions using arrow keys.
- **Suggested Fix**: Add keyboard listener (`ArrowRight` adds column, `ArrowDown` adds row, `Enter` inserts).
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.table-grid-popover` | Border + bg-primary-alt | Standard popover frame | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Generates clean, properly aligned GitHub Flavored Markdown (GFM) table syntax with empty header cells ready for input.
- Real-time dimension label ("3 × 4 Table") confirms dimensions prior to insertion.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add arrow key navigation for keyboard-only dimension selection.
- **Larger Work**: None.
