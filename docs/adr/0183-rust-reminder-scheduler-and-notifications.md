# ADR-0183: Rust reminder scheduler, device-local notification state, and background lifecycle

## Status

Accepted

## Context

Phase 2 of Reminders requires timely, battery-efficient notification delivery on desktop (macOS, Windows, Linux) with restart and background persistence. The design must adhere to `PERFORMANCE.md` (no continuous JavaScript polling, minimal idle CPU/wakeups), survive window closing without terminating the scheduler, and handle edge cases such as app restarts, missed reminders, and clock/timezone adjustments.

## Decision

### 1. Notification Delivery via Rust-Side Timer
- **Evaluation of `tauri-plugin-notification`**:
  - The plugin provides immediate native notification delivery across desktop and mobile.
  - However, scheduled notifications (`Schedule`) are supported **only on mobile** (Android and iOS). Desktop operating systems do not provide native scheduled notification daemons accessible through the plugin.
  - Frontend bundle weight: 0 bytes when fired from Rust (or ~1.1 KB gzip if JS bindings are used).
- **Decision**: Trigger immediate notifications via Rust (`tauri-plugin-notification` / system notification API) from a single Rust background timer that sleeps until the earliest pending reminder.

### 2. Single Rust-Side Scheduler
- A single Tokio background task manages all reminders across the vault.
- **Sleep Strategy**: The scheduler computes the duration until the next earliest incomplete, un-notified reminder (`due_at_utc > now_utc`). It sleeps using `tokio::time::sleep(duration)`.
- **Zero JS Polling**: The webview never polls for due reminders.
- **Re-scheduling**: A `tokio::sync::Notify` channel signals the scheduler whenever:
  1. The vault index updates (note edit, save, delete, or completion toggle via `reschedule_reminders` command).
  2. The system clock or timezone is adjusted.
  3. A reminder is snoozed or dismissed.
- When signaled, the scheduler cancels its active sleep, queries the earliest due reminder from SQLite, and sleeps until the new target time.

### 3. Device-Local State Table (`reminder_local_state`)
- Stored in the local `vault-index.db` via Migration 7 (local SQLite only; never synced across devices, never written to Markdown files):
  ```sql
  CREATE TABLE IF NOT EXISTS reminder_local_state (
    reminder_key TEXT PRIMARY KEY NOT NULL,
    note_path TEXT NOT NULL,
    due_at_utc TEXT NOT NULL,
    text TEXT NOT NULL,
    status TEXT NOT NULL,
    notified_at INTEGER NOT NULL,
    snooze_until_utc TEXT,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reminder_local_status ON reminder_local_state(status);
  ```
- **Line-Invariant Identity**: `reminder_key` is computed as a SHA-256 hash (or stable delimiter-separated string) of `(note_path, due_at_utc, text)`. Moving a reminder line up or down within a note does not alter its key and will never trigger duplicate re-fires.

### 4. Grouped Catch-Up Pass on Launch
- On application startup, `run_catchup_pass` queries past-due reminders (`due_at_utc < now_utc`, `done = 0`, not yet in `reminder_local_state`).
- Rather than spamming the user with N individual notification toasts, past-due reminders are:
  1. Marked with `status = 'missed'` in `reminder_local_state`.
  2. Aggregated into a single grouped notification (e.g. "3 missed reminders: Task A, Task B, and 1 more").
  3. Emitted to the desktop webview as `davinci-reminders-missed` for in-app badge/list rendering.

### 5. Background App Persistence on Window Close
- Closing the main window must not kill the background scheduler.
- The app shell's existing `keep_in_tray` setting (`tray.rs` / `TraySettingsState`) intercepts window close requests and hides the window (`hide_main_window`) with `ActivationPolicy::Accessory`.
- The Rust scheduler task is owned by the Tauri `AppHandle`, remaining active while the window is hidden or closed.

## Consequences

- 0% idle CPU and zero polling wakeups while sleeping for future reminders.
- Robust handling of sleep/wake and system time jumps.
- Clean separation between portable Markdown files (note content) and device-local notification delivery state.
