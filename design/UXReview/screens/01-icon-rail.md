# Screen Review: Icon Rail

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/IconRail/IconRail.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/IconRail/IconRail.tsx), [`_icon-rail.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/components/_icon-rail.scss)
- **Entry Points**: Always visible 40px vertical rail pinned to the left edge of the application shell.
- **Purpose & Core User Job**: Serves as the primary global switcher between workspace views (Files, Bookmarks, Git, AI Agent, AI Listening, Ask Vault, Search, Graph, Daily Notes, Calendar, Canvas, Reminders, Settings, Close Vault).
- **Current State Description**: 40px dark bar with top and bottom icon groups. Buttons use 18px Phosphor icons.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Active view has distinct `data-active="true"` background highlight. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar Obsidian / VS Code activity bar paradigm. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Toggling files icon collapses/expands left sidebar. |
| Nielsen Heuristics | H4 Consistency and standards | **Partial** | Some icons have custom tooltips while others rely solely on `label`. |
| Nielsen Heuristics | H5 Error prevention | **Fail** | "Close vault" button sits directly adjacent to "Settings" at the bottom with no confirmation dialog. |
| Nielsen Heuristics | H6 Recognition over recall | **Partial** | 12+ icon glyphs in a single vertical column without text labels forces icon memorization. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Instant 1-click access to major modules. |
| Nielsen Heuristics | H8 Minimalist design | **Partial** | Too many competing icons stacked in one strip; visual clutter. |
| Nielsen Heuristics | H9 Recover from errors | **Partial** | Accidental click on "Close vault" boots user back to welcome view immediately. |
| Nielsen Heuristics | H10 Help and documentation | **Partial** | Tooltip delays and inconsistent shortcut hints. |
| Laws of UX | Fitts's Law | **Fail** | Button hitbox is 30×30px, below the 32px desktop click target minimum. |
| Laws of UX | Hick's Law | **Fail** | 14 icons in a single navigation column violates Hick's law; severe choice fatigue. |
| Laws of UX | Jakob's Law | **Pass** | Matches VS Code / Obsidian activity bar location and behavior. |
| Laws of UX | Miller's Law | **Fail** | 12 icons in top group exceeds 7±2 cognitive chunking capacity. |
| Laws of UX | Doherty Threshold | **Pass** | Immediate visual response on click (<50ms). |
| Laws of UX | Postel's Law | **Pass** | Tolerant of rapid clicking. |
| Laws of UX | Von Restorff | **Fail** | Every icon has equal weight and contrast; no hierarchy. |
| Gestalt Laws | Proximity & Grouping | **Partial** | Top group is an unchunked monolith; lacks logical sub-separators. |
| Design System | Design Tokens Only | **Fail** | `_icon-rail.scss:32`: `border-radius: .5rem;` raw value instead of token. |
| A11y & Perf | Scrolling & Overflow | **Fail** | In narrow or short windows (480px height), icon rail overflows and clips bottom buttons off-screen. |

---

## 3. Issues & Recommended Fixes

### RAIL-01: Vertical Clipping & Inaccessible Settings in Short Windows
- **Severity**: Blocker
- **Rule Violated**: H1 Visibility of System Status + A11y & Performance
- **Evidence**: `_icon-rail.scss:1-14`: `.icon-rail` has `height: 100%` and no `overflow-y: auto`. Top group has 12 items (12 × 38px = 456px) + bottom group (2 × 38px = 76px) = 532px minimum height needed. In a 480px window (ADR-0019 minimum), Settings and Close Vault are completely pushed off-screen and invisible `[Observed]`
- **Impact**: Users running on laptops or small screens cannot access application Settings or Close Vault.
- **Suggested Fix**: Enable subtle vertical scrolling on the top group:
  ```scss
  .icon-rail__group--top {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none; // hide scrollbar bar
    &::-webkit-scrollbar { display: none; }
  }
  ```
- **Effort**: S (<15m)

### RAIL-02: Hick's Law Violation: 14 Unchunked Icons in One Strip
- **Severity**: High
- **Rule Violated**: Hick's Law + Miller's Law (Chunking) + Gestalt Grouping
- **Evidence**: `IconRail.tsx:74-191`: 12 top icons rendered sequentially with identical gap (`--space-2`) `[Observed]`
- **Impact**: Cognitive overload; users must visually scan 12 ambiguous icons (Calendar vs Daily Note vs Reminders vs Canvas vs Graph) to find their target.
- **Suggested Fix**: Add hairline separators or sub-grouping:
  1. *Core Navigation*: Files, Search, Bookmarks
  2. *Productivity & Notes*: Daily Note, Canvas, Calendar, Reminders
  3. *AI & Intelligence*: AI Agent, Listening, Ask Vault
  4. *System / Tools*: Source Control, Graph
- **Effort**: M (1-2h)

### RAIL-03: Sub-Target Button Size (30px vs 32px Minimum)
- **Severity**: Medium
- **Rule Violated**: Fitts's Law + Design Token Rules
- **Evidence**: `_icon-rail.scss:25-26, 32`: `width: 30px; height: 30px; border-radius: .5rem;` `[Observed]`
- **Impact**: Fails minimum comfortable click target; uses raw `.5rem` instead of `--border-radius-md`.
- **Suggested Fix**: Enlarge `.icon-rail__btn` to `width: 32px; height: 32px;` and replace `.5rem` with `var(--border-radius-md)`.
- **Effort**: S (<15m)

### RAIL-04: Close Vault Trigger Lacks Confirmation
- **Severity**: High
- **Rule Violated**: H5 Error Prevention + H9 Error Recovery
- **Evidence**: `IconRail.tsx:198-200`: Clicking "Close vault" invokes `onCloseVault` immediately without confirmation `[Observed]`
- **Impact**: Accidental click while aiming for Settings abruptly unloads the active vault, closing all tabs and open state.
- **Suggested Fix**: Show a confirmation dialog or move "Close Vault" into File menu / Vault switcher dropdown.
- **Effort**: M (1h)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.icon-rail__btn[data-active="true"]` | `border-radius: .5rem` | Raw CSS radius value | `var(--border-radius-md)` |

---

## 5. What Works Well
- Active indicator state (`data-active="true"`) is clear with subtle contrast.
- Uses Phosphor regular icons consistently.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add `overflow-y: auto` to `.icon-rail__group--top` to prevent clipping on small displays.
  - Enlarge button size to 32×32px.
  - Tokenize `border-radius` to `var(--border-radius-md)`.
- **Larger Work**:
  - Chunk icon rail into 3 semantic sub-sections with subtle dividers.
  - Require confirmation before closing vault, or move to Vault Switcher menu.
