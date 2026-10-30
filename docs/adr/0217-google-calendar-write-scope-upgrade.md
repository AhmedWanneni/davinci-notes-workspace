# 0217. Google Calendar Write Scope Upgrade & Task Sync

Date: 2026-10-25

## Context

Users want the AI Agent to inspect Google Calendar, create events, and automatically turn note tasks (`- [ ] Task (@YYYY-MM-DD HH:mm)`) into scheduled calendar events.
Previously, ADR-0118 and the desktop calendar subsystem configured read-only OAuth scopes (`https://www.googleapis.com/auth/calendar.events.readonly`). Requesting write scopes globally on initial connection could cause security skepticism for users who only want to view upcoming meetings in the tray or sidebar.

## Decision

1. **Incremental Write Scope Support**:
   In `calendarAuthConfig.ts`, configure `CALENDAR_WRITE_SCOPES` (`https://www.googleapis.com/auth/calendar.events`) alongside the baseline read-only scopes. Write scope is requested only when the user enables agent calendar write permissions.
2. **API Client Extension**:
   Extend `@app/google-calendar-api` with `createEvent` and `updateEvent` methods, returning `NormalizedCalendarEvent` without adding any third-party dependencies.
3. **Agent Calendar Tools**:
   Implement `calendar_list_events`, `calendar_create_event`, and `calendar_sync_tasks` in `@app/ai-agent`. `calendar_sync_tasks` extracts reminder tokens from markdown and converts them into ISO calendar events.

## Consequences

- Calendar integration gains two-way event scheduling capabilities.
- Non-agent users and read-only calendar users remain unaffected with minimal read scopes.
- Zero external runtime bundle size added.
