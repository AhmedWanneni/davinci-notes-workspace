# Screen Review: Reminders Management View

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/RemindersView/RemindersView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/RemindersView/RemindersView.tsx), [`RemindersSubView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/RemindersView/RemindersSubView.tsx)
- **Entry Points**: Clicking IconRail "Reminders" bell icon or tab `davinci://reminders`.
- **Purpose & Core User Job**: Centralized dashboard for managing all parsed reminders in the vault: Today, Upcoming, Overdue, and Completed; channel dispatch status badges (Telegram, Slack, Desktop).
- **Current State Description**: Full-window dashboard with tab switcher (Reminders vs Scheduled Messages), quick filter input, "Add Reminder" button, and categorized task list.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Badges indicate due date, recurrence, and notification channel dispatch state. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar task management list. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Checkbox marks done; snooze button delays alert; delete removes reminder. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Tasks reflect standard markdown `- [ ]` syntax with `(@reminder...)` tags. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Overdue tasks flagged in prominent danger accent. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Displays origin note title and line number next to task. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Clicking task note link jumps directly to the exact line in editor. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Flat checklist rows without heavy card frames. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Unchecking completed task restores it to active state. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty state describes reminder markdown syntax. |
| Laws of UX | Fitts's Law | **Pass** | Checkbox has 20px hit area with generous row padding. |
| Laws of UX | Hick's Law | **Pass** | Clear category tabs (Today / Upcoming / Overdue / Completed). |
| Laws of UX | Jakob's Law | **Pass** | Matches Apple Reminders / Things task dashboard layouts. |
| Laws of UX | Miller's Law | **Pass** | Grouped by due date category. |
| Laws of UX | Doherty Threshold | **Pass** | Reactive query updates when tasks are completed in editor. |
| Laws of UX | Postel's Law | **Pass** | Parses recurring reminders and handles due-date anchoring. |
| Laws of UX | Von Restorff | **Pass** | Overdue tasks distinctly styled with `--color-text-error`. |
| Gestalt Laws | Proximity & Similarity | **Pass** | Grouped by temporal proximity (Today vs Later). |
| Design System | Flat & Tokens | **Pass** | Uses token colors and border hairlines. |
| A11y & Perf | Keyboard Navigation | **Pass** | `useReminderKeyboardNav.ts` provides arrow key row cycling. |

---

## 3. Issues & Recommended Fixes

### REM-01: CSS Modules Usage in RemindersView
- **Severity**: Low
- **Rule Violated**: Project Design Rules (CUBE CSS Architecture)
- **Evidence**: `RemindersView.tsx:13`: Imports `RemindersView.module.scss` `[Observed]`
- **Impact**: Lingering CSS module violates ADR-0038 CUBE CSS standard.
- **Suggested Fix**: Migrate styles to `apps/desktop/src/styles/components/_reminders-view.scss`.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.reminders-view__item` | Subtle hover background | Flat list item | Keep as-is (passes box audit) |

---

## 5. What Works Well
- 1-click jump to originating note and exact line number saves time locating tasks.
- Channel status pills confirm external dispatch (Telegram, Slack) without leaving the view.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate SCSS module to CUBE CSS.
- **Larger Work**: None.
