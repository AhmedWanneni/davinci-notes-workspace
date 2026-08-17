# ADR-0036: SQLite WAL mode enabled at connection time, not via migration

## Status
Accepted

## Context
`PRAGMA journal_mode=WAL` and `PRAGMA synchronous=NORMAL` are required to avoid `SQLITE_BUSY` under concurrent access, but `tauri-plugin-sql` wraps migrations in a transaction and SQLite forbids journal/safety-level changes inside a transaction (`Safety level may not be changed inside a transaction`).

## Decision
Execute both PRAGMAs immediately on connection acquisition in `sqliteIndex.ts` (`getVaultIndexDb()`), outside any transaction. Do not attempt them in migrations (a v3 migration attempt was removed).

## Consequences
- `journal_mode=WAL` persists in the DB file header once set; `synchronous=NORMAL` is set on every connection initialization.
- `.gitignore` ignores `*.db-wal`, `*.db-shm`, and `*.db-journal` sidecars.
- Supersedes the PRAGMA-via-migration approach from ADR-0035.
