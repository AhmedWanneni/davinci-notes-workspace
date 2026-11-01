# Screen Review: App Sidebar Container

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/AppSidebar/AppSidebar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AppSidebar/AppSidebar.tsx), [`useSidebarResize.ts`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AppSidebar/useSidebarResize.ts), [`_sidebar.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/layout/_sidebar.scss)
- **Entry Points**: Left vertical column; toggled with `Cmd+\` or clicking the "Files" icon in the IconRail.
- **Purpose & Core User Job**: Houses primary file navigation, vault switcher, search/bookmarks tabs, and source control sidebar.
- **Current State Description**: Resizable sidebar clamped between min and max widths, with an integrated IconRail and drag handle resizer.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Clear visual boundaries with `--color-border-subtle`. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Standard desktop IDE / note manager sidebar. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Smooth drag resize with mouse-up release. |
| Nielsen Heuristics | H4 Consistency and standards | **Partial** | Clamped minimum width in CSS (`min-width: 340px`) conflicts with ADR-0156 (240px). |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Clamps resize width so sidebar cannot be accidentally resized off-screen. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Vault name and root hierarchy visible at top. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Quick `Cmd+\` shortcut toggles full sidebar width. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean single background color (`--color-bg-primary-alt`). |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | N/A. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty state hints when 0 files exist. |
| Laws of UX | Fitts's Law | **Partial** | Resize handle is 6px visual width (`_sidebar.scss:38`). |
| Laws of UX | Hick's Law | **Pass** | Clear top-to-bottom layout: header → tree → vault switcher. |
| Laws of UX | Jakob's Law | **Pass** | Matches VS Code and Obsidian left sidebar behavior. |
| Laws of UX | Miller's Law | **Pass** | Grouped into header actions, content, and footer switcher. |
| Laws of UX | Doherty Threshold | **Pass** | CSS transitions disabled during active drag (`[data-resizing="true"]`). |
| Laws of UX | Postel's Law | **Pass** | Gracefully preserves scroll state when collapsed. |
| Laws of UX | Von Restorff | **Pass** | Subdued contrast keeps focus on main editor. |
| Gestalt Laws | Proximity & Region | **Pass** | Clear common region bounded by subtle hairline border. |
| Design System | Token Compliance | **Pass** | Uses design tokens for colors and transitions. |
| A11y & Perf | Minimum Width Clamping | **Fail** | Hardcoded `min-width: 340px` consumes >50% of screen in narrow windows (640px). |

---

## 3. Issues & Recommended Fixes

### SIDE-01: Excessive Sidebar Minimum Width (340px vs 240px ADR Constraint)
- **Severity**: High
- **Rule Violated**: Jakob's Law + A11y & Performance Feel
- **Evidence**: `_sidebar.scss:2-3`: `width: 440px; min-width: 340px;` `[Observed]`
- **Impact**: In a standard 640×480 window (the minimum window bounds in ADR-0019), a 340px sidebar + 40px icon rail = 380px, leaving only 260px for the editor! This squashes markdown text and causes horizontal clipping. ADR-0156 specifies a 240px minimum.
- **Suggested Fix**: Update `min-width` to `240px` in `_sidebar.scss` and `useSidebarResize.ts`:
  ```scss
  // Before
  width: 440px;
  min-width: 340px;

  // After
  width: 280px;
  min-width: 220px;
  ```
- **Effort**: S (<15m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.app-sidebar` | Border-right hairline | Clean divider | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Disabling CSS transitions during active resizing (`[data-resizing="true"] { transition: none; }`) guarantees fluid 60fps dragging without lag.
- Proper DOM preservation on collapse preserves expanded tree folders.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Lower `min-width` from 340px to 220px/240px.
- **Larger Work**: None.
