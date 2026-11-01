# Screen Review: Workspace Empty State

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EmptyState/EmptyState.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EmptyState/EmptyState.tsx), [`_empty-state.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/styles/components/_empty-state.scss)
- **Entry Points**: Center editor area when an open vault has all tabs closed, or in sidebars/dialogs when a list has zero items.
- **Purpose & Core User Job**: Prevents blank canvas confusion by providing clear feedback and keyboard shortcuts to resume work.
- **Current State Description**: Centered vertical stack with icon, title, description, and optional action buttons. Available in three sizes (`sm`, `md`, `lg`).

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Informs user clearly that no document is currently open. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Clean minimalist desk surface metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | User can immediately open notes or command palette. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standardized component used across Empty editor, Bookmarks, and Reminders. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Cannot perform invalid document actions while in empty state. |
| Nielsen Heuristics | H6 Recognition over recall | **Partial** | Lacks clickable shortcut chips in the main editor variant (plain text only). |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Keyboard shortcuts (`Cmd+N`, `Cmd+O`, `Cmd+Shift+P`) work immediately. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean, flat typography without container cards or borders. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | N/A. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Describes what action to take next. |
| Laws of UX | Fitts's Law | **Partial** | When an action button is provided, it is centered but has no primary CTA prominence. |
| Laws of UX | Hick's Law | **Pass** | Focused single-purpose presentation. |
| Laws of UX | Jakob's Law | **Pass** | Parity with VS Code and Obsidian empty workspace watermarks. |
| Laws of UX | Miller's Law | **Pass** | 3-tier chunk (Icon, Message, CTA). |
| Laws of UX | Doherty Threshold | **Pass** | Renders synchronously without layout shift. |
| Laws of UX | Postel's Law | **Pass** | Safely renders with or without icon/title/action props. |
| Laws of UX | Von Restorff | **Pass** | Muted typography prevents visual distraction. |
| Gestalt Laws | Proximity & Alignment | **Pass** | Symmetrical vertical centering. |
| Design System | Flat & Tokens | **Pass** | Zero borders or drop shadows; uses design tokens. |
| A11y & Perf | Contrast & Focus | **Pass** | Meets WCAG AA contrast against `--color-bg-primary`. |

---

## 3. Issues & Recommended Fixes

### EMP-01: Main Editor Empty State Missing Clickable Quick-Start Actions
- **Severity**: Low
- **Rule Violated**: H6 Recognition over Recall + Fitts's Law
- **Evidence**: `EmptyState.tsx:28-35`: In the default editor empty state, shortcuts are displayed as plain static text rather than clickable interactive badges `[Observed]`
- **Impact**: New users or mouse-centric users must manually navigate to the sidebar rather than clicking an inline "Create new note" or "Open note" button directly in the center pane.
- **Suggested Fix**: Provide interactive pill buttons that trigger `createNewNote()` and `openSearch()` when clicked.
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.empty-state` | Pure flex column, no border/background | None; follows flat Swiss typography | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Reusable across multiple viewports (`data-size="sm"`, `"md"`, `"lg"`).
- Zero borders, zero cards, completely flat layout respecting Gestalt proximity.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add interactive button pills for `Create note (⌘N)` and `Quick open (⌘P)` in the main workspace empty view.
- **Larger Work**: None.
