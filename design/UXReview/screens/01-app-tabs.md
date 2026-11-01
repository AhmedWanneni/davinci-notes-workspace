# Screen Review: App Tabs

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/AppTabs/AppTabs.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AppTabs/AppTabs.tsx), [`AppTabItem.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/AppTabs/AppTabItem.tsx), [`_tabs.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/layout/_tabs.scss)
- **Entry Points**: Pinned at the top of the main editor column; tabs appear as notes, canvases, or leaves are opened.
- **Purpose & Core User Job**: Allows multi-tab document workflows, switching between open documents, closing tabs, and tracking dirty/unsaved state.
- **Current State Description**: Horizontal tab strip with active tab styled with top/left/right borders and curved base. Supports middle-click close, dirty dot, conflict indicator, and new tab (+) button.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Active tab has distinct background; dirty dot shows unsaved changes. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar physical file tab metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Close button (`X`), middle-click to close tab, and `Cmd+W` supported. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard browser/IDE tab bar interaction model. |
| Nielsen Heuristics | H5 Error prevention | **Partial** | Middle-click close has no buffer zone; easy to close wrong tab if tabs shift. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | File icons and note titles clearly displayed on tab face. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Middle-click close, shortcut closure, tab overflow dropdown list. |
| Nielsen Heuristics | H8 Minimalist design | **Partial** | Complex border curvature pseudo-elements (`::before`, `::after`) add visual weight. |
| Nielsen Heuristics | H9 Recover from errors | **Partial** | No "Reopen closed tab" (`Cmd+Shift+T`) shortcut or command. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Tooltip on tab hover shows full file path. |
| Laws of UX | Fitts's Law | **Fail** | Close button hit target is only 22×22px, causing accidental tab switching. |
| Laws of UX | Hick's Law | **Pass** | Clean tab row; overflow handled via dropdown list. |
| Laws of UX | Jakob's Law | **Pass** | Matches Chrome, VS Code, and Obsidian tab strip behavior. |
| Laws of UX | Miller's Law | **Pass** | Chunked per document. |
| Laws of UX | Doherty Threshold | **Pass** | Instantaneous tab switching without remount lag. |
| Laws of UX | Postel's Law | **Pass** | Gracefully handles long titles with ellipsis truncation. |
| Laws of UX | Von Restorff | **Pass** | Active tab foreground is distinctly brighter than inactive tabs. |
| Gestalt Laws | Connectedness & Region | **Pass** | Active tab visually merges into editor area below. |
| Design System | Design Tokens Only | **Fail** | `_tabs.scss:86`: `border-radius: var(--space-2) ...;` uses space token for radius; `_tabs.scss:199`: `border-radius: 0.5rem;` raw value. |
| A11y & Perf | Hitboxes & Scrolling | **Fail** | Overly wide `min-width: 180px` causes premature crowding in narrow windows. |

---

## 3. Issues & Recommended Fixes

### TABS-01: Excessive Tab Minimum Width (180px) Crowds Narrow Windows
- **Severity**: High
- **Rule Violated**: A11y & Performance Feel + Jakob's Law
- **Evidence**: `_tabs.scss:58`: `min-width: 180px; max-width: 280px;` `[Observed]`
- **Impact**: In a 640px window or when 4 tabs are open, tabs consume 720px, forcing immediate horizontal overflow and hiding the new tab (+) button and drag region. Obsidian and VS Code use `min-width: 80px` to allow 6–8 tabs comfortably before scrolling.
- **Suggested Fix**: Reduce `min-width` from `180px` to `90px` or `100px`, allowing natural compression:
  ```scss
  // Before
  min-width: 180px;
  max-width: 280px;

  // After
  min-width: 100px;
  max-width: 240px;
  ```
- **Effort**: S (<15m)

### TABS-02: Cramped Close Button Hit Target (22px vs 32px Minimum)
- **Severity**: Medium
- **Rule Violated**: Fitts's Law
- **Evidence**: `_tabs.scss:197-198`: `.app-tabs__close` has `width: 22px; height: 22px;` `[Observed]`
- **Impact**: Difficult to target accurately; users frequently click the tab background (switching tabs) instead of clicking the close button.
- **Suggested Fix**: Expand the hit area using padding while keeping the 14px icon centered:
  ```scss
  .app-tabs__close {
    width: 26px;
    height: 26px;
    margin-right: -4px;
  }
  ```
- **Effort**: S (<15m)

### TABS-03: Design Token Misuse for Border Radius
- **Severity**: Low
- **Rule Violated**: Project Design Rules (Design Tokens Only)
- **Evidence**: `_tabs.scss:86`: `border-radius: var(--space-2) var(--space-2) 0 0;` (spacing token used as radius); `_tabs.scss:199`: `border-radius: 0.5rem;` (raw rem value) `[Observed]`
- **Impact**: Violates strict token semantics and stylelint rules.
- **Suggested Fix**: Replace with `var(--border-radius-md)` across both declarations.
- **Effort**: S (<10m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.app-tabs__tab[data-active="true"]` | Top, left, right borders + bottom margin hack (`-1px`) | Over-engineered pseudo-element corner curves (`::before`, `::after`) | Clean flat tab: border-bottom indicator (`2px solid var(--color-accent)`) or subtle background difference without pseudo-element hacks |

---

## 5. What Works Well
- Overflow dropdown menu (`TabListDropdown.tsx`) cleanly lists all open tabs with active checkmark and "Close all" option.
- Clear dirty dot indicator distinguishes modified unsaved notes from persisted notes.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Reduce `min-width` to `100px`.
  - Enlarge close button hit area to 26×26px.
  - Fix token references in `_tabs.scss` line 86 and 199.
- **Larger Work**:
  - Add `Cmd+Shift+T` command to reopen recently closed tabs.
