# ADR-0231: Calendar Event Proximity Detection & Note-Taking Prompt

## Status

Accepted

## Context

Users frequently participate in scheduled meetings with video conference links (Google Meet, Zoom, Teams). Requiring the user to remember to manually navigate to the app and start recording often results in missed note-taking. Conversely, auto-recording meetings silently is a severe privacy violation and illegal in many jurisdictions without two-party consent.

## Decision

1. **Foreground Proximity Detection**:
   - The desktop app inspects cached calendar events from the local SQLite cache (`synced_calendar_events`, ADR-0201).
   - If an event has an associated video call link (`parseMeetLink`, ADR-0199) and is scheduled to start within 60 seconds (or is currently in progress), a subtle toast alert is surfaced in the bottom-right corner.
   - The prompt presents: *"Meeting starting: [Title]. Start AI Listening?"* with buttons `[Start Listening]` and `[Dismiss]`.

2. **Strict Privacy Policy**:
   - Recording is **never** started automatically without explicit user action.
   - Dismissing the toast suppresses re-prompting for that specific event instance.
   - Polling only runs while the application is active in the foreground, using existing 60-second reminder scheduler loops without additional background timers.

## Consequences

- Frictionless, timely meeting capture without manual setup.
- Strict compliance with user privacy and consent laws.
- 0 additional network requests or heavy background polling.
