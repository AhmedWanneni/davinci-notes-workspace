# ADR-0148: Vault-index transaction ownership and write serialization

## Status

Accepted

## Context

The app reported both `cannot start a transaction within a transaction` and
`cannot rollback - no transaction is active` while indexing and editing. The
vault index uses one `tauri-plugin-sql` connection. The indexer had explicit
transactions but did not join the existing `withDbLock` write queue; ordinary
note writes also bypassed that queue. Remediation A added the `text` column to
`embedding_chunks`, but its embedding store does not open transactions.

## Decision

`withDbLock` serializes every top-level write against the vault-index database.
Only `withDbTransaction` may issue `BEGIN IMMEDIATE`, `COMMIT`, or `ROLLBACK`.
The transaction helper owns the complete transaction and preserves the
original operation error when SQLite has already ended the transaction; an
expected `no transaction is active` rollback failure is suppressed.

The indexer remains the transaction owner for full and incremental indexing.
Create, save, folder-rename, duplicate, delete, plugin/theme settings, and
other single-operation writes participate in `withDbLock` without opening
nested transactions. Embedding writes remain ordinary statements inside the
same serialized write discipline; the 50-item embedding/index batches remain
unchanged.

## Consequences

WAL and connection-time `synchronous=NORMAL` remain governed by ADR-0036.
There is no nested transaction or second rollback path. Writes are serialized
on the existing connection, while reads retain WAL concurrency. Savepoints are
not needed because no inner operation owns a transaction.

## Verification

Transaction call sites are now centralized in `sqliteIndex.ts`:
`withDbTransaction` issues `BEGIN IMMEDIATE`, `COMMIT`, and guarded
`ROLLBACK`. `VaultIndexer.ts` calls it for full indexing and incremental
reconciliation. Embedding persistence uses `EmbeddingStore.upsert/remove`
ordinary statements and has no transaction calls.

The focused vault/indexing suite passed 28 tests in 7 files, including
concurrent index/reconcile stress, repeated 350-note cycles, all CRUD write
paths, and the auto-rollback regression. ESLint and `git diff --check` passed.
