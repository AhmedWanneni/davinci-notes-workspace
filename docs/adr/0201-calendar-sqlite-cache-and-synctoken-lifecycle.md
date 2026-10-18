# ADR-0201: Calendar event SQLite caching, incremental syncToken lifecycle, and withDbLock serialization

## Status

Accepted (extends ADR-0168, ADR-0199)

## Context

Google Calendar events and metadata must be available offline and display instantaneously in the app shell without blocking the UI or editor thread.

1. **Ephemeral Derived Cache**:
   - Google Calendar events are not the vault's source of truth; they are disposable external mirror data.
   - If the user disconnects their account, all cached events, calendars, and sync tokens must be purged instantly.
   - Managing a separate SQLite database file introduces multiple connection pools, separate file locks, and filesystem footprint. `vault-index.db` is already managed with WAL mode, 5000ms busy timeout, and universal promise-queue serialization (`withDbLock`).

2. **SQLite Concurrency & Lock Contention (ADR-0168)**:
   - Vault note indexing, FTS5 updates, embeddings, and reminders already write to `vault-index.db`.
   - Simultaneous network sync and user typing or file saving would risk `SQLITE_BUSY` errors if locks were held during network I/O or if uncoordinated transactions overlapped.
   - Per ADR-0168, all database access must go through the single exported `withDbLock` promise queue, transactions must be owned solely by `withDbTransaction`, and database locks must never be held across network fetch calls.

3. **Incremental Delta Synchronization (`syncToken`)**:
   - Polling full event lists every 15 minutes wastes network bandwidth and risks Google API quota throttling.
   - Google Calendar API v3 provides incremental synchronization via `syncToken`. Initial sync queries events with `timeMin` and receives a `nextSyncToken`. Subsequent requests pass `syncToken` to retrieve only added, modified, or cancelled (`status: 'cancelled'`) events.
   - If Google invalidates a sync token (HTTP 410 Gone), the engine must gracefully clear the stored token and perform a full date-window resync.

## Decision

1. **Migration 8 in `vault-index.db`**:
   - Register Migration 8 in `src-tauri/src/db.rs` with `google_calendars`, `google_calendar_events`, and `google_calendar_sync_state` tables and indices on `start_iso`, `calendar_id`, and `status`.

2. **Universal `withDbLock` and Transaction Ownership**:
   - All calendar persistence (`saveCalendarsToDb`, `getCalendarsFromDb`, `saveEventsToDb`, `getEventsFromDb`, `saveCalendarSyncToken`, `purgeCalendarCache`) runs through `withDbLock`.
   - Atomic batch writes are executed inside `withDbTransaction`.
   - Network requests (`listCalendars`, `listEvents`) execute completely outside database locks.

3. **Delta Sync & Invalidation Recovery**:
   - `CalendarSyncEngine` queries only selected calendars (`selected = 1`).
   - Sync passes store `nextSyncToken` in `google_calendar_sync_state`.
   - On HTTP 410 Gone (`GoogleSyncTokenExpiredError`), the engine resets `syncToken` and performs a clean 7-day full resync.
   - On account disconnect, `purgeCalendarCache` wipes all 3 calendar tables in a single atomic transaction.

## Consequences

- Calendar events render in < 2ms directly from local SQLite cache, fully functional offline.
- Zero `SQLITE_BUSY` contention with vault note indexing or reminders.
- Bandwidth usage is minimal; only changed events are transferred after initial synchronization.
- Complete privacy isolation: cache is purged upon disconnect.
