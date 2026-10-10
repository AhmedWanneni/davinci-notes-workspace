# ADR-0168: Vault-index write-lock contention and universal lock discipline

## Status

Accepted — supersedes ADR-0148

## Context

During watcher-driven indexing and editing, SQL statements stalled for ~5.2 seconds
(matching SQLite's 5000 ms `busy_timeout`) on `INSERT`, `DELETE`, and `BEGIN IMMEDIATE`.

Root-cause analysis revealed that `tauri-plugin-sql` uses a pooled connection model
(`sqlx::SqlitePool`). While ADR-0148 serialized top-level writes using `withDbLock`
and assumed reads retained concurrent WAL access without coordination, multiple unqueued
reads (`queryBacklinkSources` in BacklinksPanel, `loadNoteIcons` in treeIconStorage,
and `executeSearchQuery` in App) checked out connections from the pool while a writer
transaction was active. In addition, connection initialization PRAGMAs were not
atomically serialized under `withDbLock`, and note removals during watcher batches
executed unbatched per-note queries (two queries per deleted file), unnecessarily
extending write-lock hold times.

## Decision

1. **Universal Lock Discipline**: Every query against `vault-index.db` — both writes
   and reads (`queryBacklinkSources`, `loadNoteIcons`, `executeSearchQuery`) — must
   execute through the `withDbLock` async serial queue. No direct `db.select` or
   `db.execute` calls may bypass this boundary.
2. **Batch Removals**: Note, link, and FTS deletions are performed in 50-item chunks
   via `removeNotesBatch` and `removeFtsRows` using parameterized `IN (...)` queries,
   mirroring `persistNotesBatch`.
3. **Single Transaction Boundary**: Watcher batch reconciliation and vault write
   operations bundle all batch deletes and inserts into a single `withDbTransaction`
   block guarded by `withDbLock`, avoiding interleaved statements and transaction thrash.
4. **Connection Configuration**: Database initialization wraps PRAGMA configuration
   (`journal_mode=WAL`, `busy_timeout=5000`, `synchronous=NORMAL`, `foreign_keys=ON`)
   within `withDbLock` to ensure consistent connection settings.

## Consequences

- Completely eliminates SQLite write-lock contention stalls without artificially
  raising `busy_timeout`.
- Keeps lock duration minimal by chunking deletions and keeping filesystem I/O outside
  the database transaction.
- Preserves zero additional runtime dependencies and adheres to lightweight
  architecture guidelines (`PERFORMANCE.md`).
- File line counts remain strictly bounded below the 250-line hard cap (extracted
  `sqliteGraphIndex.ts` for full graph queries).

## Verification

- `removeNotesBatch` and `removeFtsRows` verified across all CRUD operations: note
  create, duplicate, delete, folder delete, folder rename, note rename, and indexer
  reconcile batches.
- Desktop test suite passed completely: 89 test files, 302/302 tests passing.
- Desktop ESLint passed with 0 errors and 0 warnings.
