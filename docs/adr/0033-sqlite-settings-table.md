# ADR-0033: Settings persistence in SQLite

## Status
Accepted

## Context
App preferences (Editor Font, active Vault Path) must persist across restarts without new dependencies or filesystem-write edge cases.

## Decision
Persist settings in a `settings` table (`key`, `value`) in the existing `vault-index.db` SQLite database. Not `tauri-plugin-store`, not raw JSON via fs.

## Consequences
- No new dependencies; no concurrent filesystem-write concerns.
- `schema.sql` gained a `v2` migration registered in `db.rs` to upgrade existing local databases (see migration rules in ADR-0035).
