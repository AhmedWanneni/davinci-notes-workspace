# Screen Review: Inline Reminder Date Picker & Modal

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EditorArea/ReminderDatePicker.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/ReminderDatePicker.tsx), [`ReminderEditModal.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/ReminderEditModal.tsx)
- **Entry Points**: Clicking on a reminder bell widget on task items in the markdown editor or typing `(@reminder...)`.
- **Purpose & Core User Job**: Sets due date, time of day (defaults to 09:00 per ADR-0182), recurrence rule (daily, weekly, monthly), and dispatch channels for task reminders.
- **Current State Description**: Floating popover or modal displaying month calendar navigation, time selector, recurrence dropdown, and Save/Clear action buttons.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Currently selected date and time displayed clearly in header. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar calendar grid and 24h/12h clock picker. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | "Clear reminder" button removes syntax; Escape dismisses. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Matches standard date picker calendar paradigms. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Past dates flagged or prevented; default 09:00 time prevents accidental midnight alerts. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Quick preset buttons ("Today", "Tomorrow", "Next week"). |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click presets accelerate common reminder intervals. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean calendar grid without excess borders. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Can edit date and recurrence anytime. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Syntax preview displays generated `(@reminder YYYY-MM-DD HH:mm)` tag. |
| Laws of UX | Fitts's Law | **Pass** | Generous 32×32px calendar date cell buttons. |
| Laws of UX | Hick's Law | **Pass** | Presets reduce choice time for common tasks. |
| Laws of UX | Jakob's Law | **Pass** | Parity with Todoist and Apple Reminders date pickers. |
| Laws of UX | Miller's Law | **Pass** | Chunked into Presets, Calendar Grid, and Time/Recurrence settings. |
| Laws of UX | Doherty Threshold | **Pass** | Synchronous date selection feedback. |
| Laws of UX | Postel's Law | **Pass** | Tolerant date parsing from raw markdown syntax. |
| Laws of UX | Von Restorff | **Pass** | Today's date highlighted with subtle circle; selected date filled with accent. |
| Gestalt Laws | Common Region | **Pass** | Single popover container. |
| Design System | Flat & Tokens | **Pass** | Token-based colors; no drop shadows. |
| A11y & Perf | Keyboard Traversal | **Pass** | Arrow keys navigate days in calendar grid. |

---

## 3. Issues & Recommended Fixes

### REMP-01: Recurrence Selector Dropdown Styled via CSS Modules
- **Severity**: Low
- **Rule Violated**: Project Design Rules (CUBE CSS Architecture)
- **Evidence**: `ReminderDatePicker.module.scss:1-55`: Local CSS module styling `[Observed]`
- **Impact**: Violates ADR-0038 CUBE CSS project architecture rule.
- **Suggested Fix**: Migrate classes to `apps/desktop/src/styles/components/_reminder-picker.scss`.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.reminder-date-picker` | Border + bg-primary-alt | Standard popover frame | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Quick date preset pills ("Today", "Tomorrow", "Next week") make scheduling trivial without manual calendar scanning.
- Default 09:00 time anchoring adheres strictly to ADR-0182.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate styling to CUBE CSS.
- **Larger Work**: None.
