# ADR-0203: Calendar Reminder Alerts and Menu-Bar Tray Integration

## Context
Phase 7 introduces proactive upcoming meeting alerts (a 5-minute heads-up notification and meeting start alert) and system tray menu integration without introducing heavy background daemon threads, battery drain, or polling overhead.

## Decisions
1. **Lightweight Periodic Checking**:
   - `calendarReminderBridge.ts` runs a periodic 30-second tick examining the local SQLite-cached events for the active date.
   - Dedupes alert dispatches via in-memory `notifiedKeys` (`${event.id}-5min`, `${event.id}-now`), ensuring each meeting alert is emitted at most once per stage.
2. **System Tray Integration**:
   - Formats upcoming meetings within the next 12 hours into system tray items with `📅` or `📹` (if Meet link present) prefixes and start timestamps (`HH:MM`).
   - If a Google Meet URL is present, clicking the tray item opens the video link directly in the user's browser via Tauri's `open_external_url`, without bringing the entire desktop note editor forward.
3. **No Network Polling on Alert Check**:
   - The alert bridge queries the local SQLite database cache only (`getEventsFromDb`), completely decoupling reminder notifications from Google API rate limits or network connectivity.

## Consequences
- Zero battery or CPU impact; zero unnecessary Google API quota usage.
- Users receive timely alerts before calls even if offline or working inside a different application.
- Seamless coexistence with the existing note reminder notification system.
