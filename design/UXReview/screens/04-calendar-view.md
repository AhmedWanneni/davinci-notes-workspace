# Screen Review: Google Calendar & Meetings View

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/CalendarView/CalendarLeaf.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/CalendarView/CalendarLeaf.tsx), [`EventModal.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/CalendarView/EventModal.tsx), [`ScheduleXCalendar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/CalendarView/ScheduleXCalendar.tsx)
- **Entry Points**: Clicking IconRail "Calendar" icon or tab `davinci://calendar`.
- **Purpose & Core User Job**: Syncs Google Calendar meetings, displays multi-view calendar (month grid, week, day, agenda), links events to Daily Notes, and creates meeting notes.
- **Current State Description**: Full-screen calendar powered by Schedule-X with a custom dark theme token wrapper, date range stepping toolbar, and event detail modal.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Sync status spinner and current view date title displayed in toolbar. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Standard calendar grid matching Google Calendar. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Switch between Month, Week, Day, and Agenda views freely. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard Schedule-X accessible calendar architecture. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Read-only sync prevents unintended deletion of Google Calendar events. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Events display summary, time, and attendees. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | "Create Meeting Note" generates pre-formatted template note in 1 click. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Flat grid lines without heavy card frames. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Re-connect button if OAuth token expires. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Connect Google Calendar prompt when unlinked. |
| Laws of UX | Fitts's Law | **Pass** | Large date cell click targets in month and week views. |
| Laws of UX | Hick's Law | **Pass** | View mode switcher cleanly limited to Month / Week / Day / Agenda. |
| Laws of UX | Jakob's Law | **Pass** | Matches Google Calendar navigation and view modes. |
| Laws of UX | Miller's Law | **Pass** | Time slots chunked into hourly blocks. |
| Laws of UX | Doherty Threshold | **Pass** | SQLite cached events render instantaneously on open. |
| Laws of UX | Postel's Law | **Pass** | Adapts all-day vs timed events across timezones. |
| Laws of UX | Von Restorff | **Pass** | Current day highlighted with distinct accent border. |
| Gestalt Laws | Common Region | **Pass** | Clean grid cell containment. |
| Design System | Token Theme Adapter | **Pass** | Schedule-X tokens bound to `--color-bg-primary`, `--color-border-subtle`. |
| A11y & Perf | SQLite Local Cache | **Pass** | Zero network blocking on leaf open; background sync worker flushes updates. |

---

## 3. Issues & Recommended Fixes

### CAL-01: CSS Modules Usage in CalendarView
- **Severity**: Low
- **Rule Violated**: Project Design Rules (CUBE CSS Architecture)
- **Evidence**: `CalendarLeaf.tsx:28`: Imports `CalendarView.module.scss` `[Observed]`
- **Impact**: Lingering CSS module violates ADR-0038 CUBE CSS requirement.
- **Suggested Fix**: Migrate to `apps/desktop/src/styles/components/_calendar.scss`.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.calendar-leaf` | Full height grid | Clean calendar layout | Keep as-is (passes box audit) |

---

## 5. What Works Well
- "Create Meeting Note" action parses attendees, meeting link, and agenda into a dedicated markdown note instantly.
- Local SQLite caching allows offline review of scheduled meetings.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate SCSS module to CUBE CSS.
- **Larger Work**: None.
