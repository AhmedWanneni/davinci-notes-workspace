# ADR-0224: Reminders Page (`davinci://reminders`), Notification Channels, Keychain Isolation, and Scheduled Messages

## Status

Accepted

## Context

Reminders were initially surfaced via a modal dialog (`RemindersDialog`) and delivered solely through local OS desktop notifications (`tauri-plugin-notification`). Users need:
1. A dedicated, full-page workspace experience (`davinci://reminders`) opened from the sidebar icon rail (matching `davinci://bookmarks`), showing reminders grouped by Overdue, Today, Upcoming, and Done with inline add, edit, complete, snooze, and delete actions.
2. Optional, free outbound notification channels (Desktop, Telegram Bot API, Slack Incoming Webhooks with multiple named destinations, WhatsApp Click-to-Chat, and optional experimental CallMeBot WhatsApp) with retry/backoff, rate limiting, and explicit failure surfacing in the UI and activity logs.
3. A **Scheduled Messages** tab for scheduling one-off or recurring messages to any configured channel.

The design must obey `AGENTS.md` and `PERFORMANCE.md`: zero startup bundle cost (`React.lazy()`), zero new npm dependencies (native `fetch`), universal SQLite lock serialization (`withDbLock` per ADR-0168), immutable applied migrations (ADR-0035), Rust for I/O only (ADR-0025), and strict hardware/OS keychain isolation for secrets (ADR-0120).

## Decisions

### 1. Virtual Tab Routing (`davinci://reminders`) & Lazy-Load Boundary
- Promote Reminders to a virtual workspace tab (`REMINDERS_TAB_ID = "davinci://reminders"`) opened from `IconRail`, Command Palette, and the system tray (`davinci-tray-open-reminders`), deduplicated in `AppTabs` alongside notes and `davinci://bookmarks`.
- Load `RemindersView` and `NotificationsSettingsTab` behind `React.lazy()` dynamic import boundaries (0 KB initial bundle impact).

### 2. Unified `notify(destination, payload)` Interface & Adapters
- All outbound notifications flow through a single TypeScript dispatcher `notify(destination, payload)` with per-channel adapters:
  - `desktop`: Native notification via `tauri-plugin-notification` (always available, on by default).
  - `telegram`: Direct `POST https://api.telegram.org/bot<token>/sendMessage` supporting multiple named destinations (personal DM `chat_id` or group/channel `chat_id` where the bot was added).
  - `slack`: Direct `POST` to Slack Incoming Webhook URLs supporting multiple named destinations (e.g. `#team`, `My DM`) and a 1 msg/sec per-webhook token bucket queue.
  - `whatsapp-click`: Constructs `https://wa.me/<digits>?text=<encoded>` and surfaces a manual **"Send on WhatsApp"** action on the fired notification toast and row (honestly labeled as requiring a manual Send click in WhatsApp).
  - `whatsapp-callmebot`: Optional, experimental, off-by-default adapter (`GET https://api.callmebot.com/whatsapp.php`) with a 2-second rate limit and explicit third-party privacy warning.

### 3. Slack Mention Safety Policy
- Automated Vault Reminders always neutralize `@channel`, `@here`, `@everyone`, `<!channel>`, `<!here>`, and `<!everyone>` (inserting a zero-width space `@\u200Bchannel`) so note task titles never accidentally trigger workspace-wide alerts.
- Scheduled Messages neutralize raw `<!channel>`/`<!here>` injection tokens and only convert literal `@channel`/`@here` into active group mentions when the user explicitly writes them and enables `allowChannelMentions` on the message/destination.

### 4. OS Keychain Secret Storage & Redaction (`com.davinci.notes.notification-channels`)
- Channel secrets (Telegram bot token, Slack webhook URLs, phone numbers, CallMeBot API key) are stored exclusively in the host OS keychain via Rust (`notification_auth.rs`, service `"com.davinci.notes.notification-channels"`) guarded by `reject_plugin_runner`.
- Non-secret destination metadata (`id`, `kind`, `name`, `enabled`, `isDefaultForReminders`, `status`, `lastError`) is stored in the SQLite `settings` table (`key = 'notification_channels_config'`).
- Removing a destination immediately deletes its keychain entry before removing its metadata.
- `redactSecrets` strips tokens, webhook paths, API keys, and phone numbers before any error is stored in SQLite, shown in the UI, or appended to `LogsSettingsTab`.

### 5. Device-Local `scheduled_messages` Table (Migration 10) & Missed-While-Offline Policy
- Store scheduled messages in a device-local SQLite table (`scheduled_messages` in `vault-index.db`, Migration 10) rather than a synced vault JSON file. Because channel credentials live in the device-local OS keychain and do not sync across devices, device-local SQLite storage eliminates the risk of two open devices firing duplicate Slack/Telegram messages at the scheduled time.
- Store per-reminder channel overrides in `reminder_local_state.channels_json` and delivery errors in `reminder_local_state.delivery_error` (Migration 10), keeping Markdown task syntax clean (`- [ ] Task (@YYYY-MM-DD HH:mm)`).
- **Missed-While-Offline Policy**:
  - Scheduled messages within a **5-minute grace window** (e.g., brief wake from sleep) send automatically.
  - Scheduled messages **> 5 minutes overdue** on app launch or wake are marked `status = 'missed'` (never silently sent hours late to external chats), trigger a desktop notification, and present **"Send Now"** and **"Skip / Dismiss"** actions in the UI.
- **Recurrence & DST**: Recurring scheduled messages reuse `@app/indexer` (`advanceRecurringReminder`) with stored `local_date`, `local_time`, and IANA `tz`, preserving wall-clock time across DST transitions, month-end 31st clamping, and leap-year Feb 29 rollovers.

## Consequences

- 0 KB new npm dependencies; 0 KB startup bundle overhead.
- Complete secret isolation from vault sync and logs.
- Honest UX for channel capabilities (automatic Telegram/Slack vs. manual final click on WhatsApp Click-to-Chat) and offline desktop scheduling constraints.
