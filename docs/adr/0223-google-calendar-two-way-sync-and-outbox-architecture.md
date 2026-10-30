# ADR-0223: Google Calendar Two-Way Sync, ETag Concurrency, and Persistent Outbox Architecture

## Status

Accepted (extends ADR-0168, ADR-0199, ADR-0201, ADR-0217)

## Context

Phase 1 of the Google Calendar Two-Way Integration introduces bidirectional synchronization: events created, modified, or deleted within DaVinci Notes must be synchronized to Google Calendar, while remote events continue to be cached locally in SQLite (`vault-index.db`).

The integration must adhere to three fundamental constraints:
1. **Offline Durability**: Writes performed while offline or during transient network interruptions must never be lost. They must be safely committed to local SQLite and dispatched automatically upon reconnection.
2. **Conflict Resolution & Source of Truth**: When an event is edited concurrently on Google Calendar and in DaVinci Notes, mid-air collisions must be detected. Google is established as the authoritative source of truth: remote edits win on conflict (`412 Precondition Failed`), safely discarding the stale local mutation and refreshing local state without data corruption.
3. **SQLite Concurrency & Immutability (ADR-0168)**: Migration 8 is already applied and immutable. All schema evolutions require an incremental Migration 9. All database access must strictly obey `withDbLock` promise serialization and `withDbTransaction` boundaries. Long-running network I/O must never hold database locks.

## Decision

1. **Migration 9 in `vault-index.db`**:
   Register Migration 9 in `apps/desktop/src-tauri/src/db.rs`:
   - Alter `google_calendar_events` to add `etag`, `recurrence_rule`, `recurring_event_id`, `original_start_iso`, and `sync_status` (`'synced'`, `'pending_create'`, `'pending_update'`, `'pending_delete'`).
   - Create `google_calendar_outbox` table tracking pending mutations:
     - `id`: unique outbox record ID (`outbox_${uuid}`).
     - `client_mutation_id`: unique mutation ID for idempotent retries.
     - `calendar_id`: target Google Calendar ID.
     - `event_id`: Google event ID (or temporary client ID for pending creates).
     - `action`: `'create'` | `'update'` | `'delete'`.
     - `payload_json`: JSON-serialized mutation payload (`CreateCalendarEventInput` or `UpdateCalendarEventInput`).
     - `etag`: ETag at time of mutation (for optimistic locking via `If-Match`).
     - `attempts`: failure retry count.
     - `last_error`: textual error message from last dispatch attempt.
     - `created_at`: epoch millisecond timestamp for strict FIFO dispatch.
     - `updated_at`: epoch millisecond timestamp of last attempt.
   - Indices on `google_calendar_outbox(created_at)` and `google_calendar_events(sync_status)`.

2. **Outbox Pattern with Optimistic UI**:
   - Local user mutations write to both `google_calendar_events` (with appropriate `pending_*` status) and `google_calendar_outbox` inside a single atomic `withDbTransaction`.
   - The UI immediately renders the pending state with a syncing visual indicator.
   - A background dispatcher reads outbox items in strict FIFO order by `created_at`.

3. **ETag Concurrency and Google-Wins Policy**:
   - Updates and deletes transmit `If-Match: <etag>`.
   - On HTTP 200/204: event transitions to `sync_status = 'synced'` with the newly returned `etag`, and the outbox record is deleted.
   - On HTTP 412 Precondition Failed: Google Calendar has been modified remotely. The dispatcher discards the outbox row, fetches the latest event from Google, updates local SQLite, and notifies the user via a non-blocking toast.

4. **Complete Purge on Disconnect**:
   - `purgeCalendarCache()` cleans all four tables (`google_calendar_events`, `google_calendars`, `google_calendar_sync_state`, and `google_calendar_outbox`) in a single transaction.

## Consequences

- Offline writes are durable across app restarts and power loss.
- Zero risk of silent remote overwrite or ghost conflicts.
- Adheres to universal `withDbLock` discipline, eliminating `SQLITE_BUSY` errors.
- Clean separation between event caching and outbox queuing across modular files (<200 lines each).
