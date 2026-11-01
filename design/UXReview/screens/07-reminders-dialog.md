# UX Review: Reminders Dialog & Notification Toast

## 1. Overview
The Reminders system consists of the modal Reminders Dialog (`RemindersDialog.tsx`) and the non-intrusive floating Reminder Notification Toast (`ReminderNotificationToast.tsx`).
- **Entry points**: Bell icon in IconRail, Command Palette (`"Reminders: Open Reminders"`), or automatic event popup when a scheduled task timestamp arrives (`davinci-reminders-due`).
- **Current state**:
  - `RemindersDialog`: Radix dialog with tab navigation ("Overdue", "Today", "Upcoming", "All"), "Add reminder" drawer form, checklist with mark done checkboxes, snooze dropdowns, and note jump links.
  - `ReminderNotificationToast`: Portal toast in the bottom-right corner with "Mark Done", "Snooze" presets (15m, 1h, tomorrow), "Open Note", and WhatsApp reminder notification action.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Clear tab badge counts, loading indicators, and overdue highlight styles. |
| **H2 Match with real world** | Pass | Follows familiar task reminder patterns (due dates, snooze presets). |
| **H3 User control and freedom** | Pass | Full snooze customization, ability to undo or toggle done state, easily dismiss toast. |
| **H4 Consistency and standards** | Pass | Consistent tab bar and checklist interaction design. |
| **H5 Error prevention** | Pass | Add form validates required date/time and non-empty description. |
| **H6 Recognition over recall** | Pass | Toasts show source note title and line preview context. |
| **H7 Flexibility and efficiency** | Pass | Quick snooze presets (15 min, 1 hour, tomorrow morning) save typing time. |
| **H8 Aesthetic and minimalist design** | Partial | Nested bordered cards around each reminder item in the list. |
| **H9 Error recovery** | Pass | Completed reminders can be viewed under "All" and unchecked if marked done accidentally. |
| **H10 Help and documentation** | Pass | Empty states explain that reminders are created via `@reminder(YYYY-MM-DD HH:mm)` in any note. |
| **Fitts's Law** | Pass | Sizable checkbox targets and large snooze buttons. |
| **Hick's Law** | Pass | Preset tabs (Overdue / Today / Upcoming) prevent clutter. |
| **Jakob's Law** | Pass | Matches Apple Reminders / Google Tasks conventions. |
| **Miller / Chunking** | Pass | Cleanly chunks due timestamp, note title, and action buttons. |
| **Doherty Threshold** | Pass | Instant optimistic UI updates when checking done. |
| **Postel's Law** | Pass | Normalizes varied reminder payloads from local DB and Tauri backend events. |
| **Von Restorff** | Pass | Overdue tasks highlighted with danger red indicators. |
| **Proximity** | Pass | Snooze and Done actions are directly attached to the task row. |
| **Similarity** | Pass | Uniform list row typography. |
| **Common Region** | Partial | Each task item has a bordered card container. |
| **Uniform Connectedness** | Pass | Clear toast outline on dark background. |
| **Design tokens & styling** | Pass | Uses CSS Modules with design tokens. |
| **Accessibility (a11y)** | Pass | Checkboxes and action buttons have explicit `aria-label`s. |
| **Performance feel** | Pass | Efficient SQLite queries via `getVaultIndexDb()`. |

---

## 3. Issues

### REMIND-01: Over-boxed reminder row containers
- **Severity**: Medium
- **Rule violated**: Gestalt Common Region / H8 Aesthetic and minimalist design
- **Evidence**: `apps/desktop/src/components/RemindersDialog/RemindersDialog.module.scss` `[Code-Read Only]`
- **Why it hurts the user**: Every reminder task row is styled as an isolated floating card with border and background, creating visual fatigue when viewing 15+ reminders.
- **Suggested fix**: Use flat borderless checklist rows separated by 1px subtle divider lines (`border-bottom: 1px solid var(--color-border-subtle)`).
- **Effort**: S

### REMIND-02: Toast notification z-index collision with full-screen modals
- **Severity**: Low
- **Rule violated**: H1 Visibility of system status
- **Evidence**: `apps/desktop/src/components/RemindersDialog/ReminderNotificationToast.module.scss` `[Code-Read Only]`
- **Why it hurts the user**: When a high-level modal (such as Settings or Command Palette) is open, notification toasts can appear underneath the modal scrim.
- **Suggested fix**: Set toast portal z-index to `var(--z-toast, 9999)` ensuring critical time-sensitive reminders stay visible.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.reminder-item` | Card border + background | Excessive boxing of simple checklist rows | Flat list item with left checkbox and right actions |
| `.reminders-dialog__tabs` | Tab container box | Heavy wrapper around 4 tab buttons | Underline tab bar without box container |

---

## 5. What Works Well
- Multi-channel notification support including optional WhatsApp reminder click link (`openWhatsAppClickUrl`).
- Instant snooze options (`computeSnoozeTime`) directly from the toast popup.
- Seamless bidirectional sync: modifying a reminder updates the underlying markdown note in place (`markReminderDoneInVault`).

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Flatten reminder card borders into hairline dividers (≤30 min).
- **Quick Win**: Adjust toast container z-index to stay above modal scrims (≤15 min).
- **Larger Work**: Add recurrence support (daily/weekly/monthly repeat reminders).
