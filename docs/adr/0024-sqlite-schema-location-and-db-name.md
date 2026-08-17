# ADR-0024: SQLite schema location + DB name

## Status
Accepted

## Context
The index schema must be shared between desktop and mobile and applied as migration v1.

## Decision
Canonical DDL lives in `packages/indexer/schema.sql`. Rust applies it via `include_str!` in `apps/desktop/src-tauri/src/db.rs` as migration v1. Connection string: `sqlite:vault-index.db`, preloaded in `tauri.conf.json`.

## Consequences
- `links` includes a surrogate `id` column so multiple outbound links from the same note to the same target (different headings/block refs) can coexist; `idx_links_target` on `target_path` preserved per the backlink-query design.
- See ADR-0006, ADR-0037, and the migration rules in ADR-0035.
