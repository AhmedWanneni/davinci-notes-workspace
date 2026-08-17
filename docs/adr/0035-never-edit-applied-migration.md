# ADR-0035: Never edit an applied migration

## Status
Accepted

## Context
In Phase 11 the `settings` table was appended directly to `packages/indexer/schema.sql` (migration v1) while also adding a v2 migration. Because `tauri-plugin-sql` hashes migration strings, changing v1 caused local dev databases to panic (`migration 1 was previously applied but has been modified`).

## Decision
**Never edit an applied migration.** Any schema change must be a new, incremental migration (v2, v3, ...) in the migration array. The foundational schema (notes, links, settings) is now stable; v1 is frozen.

## Consequences
- Local dev databases were cleared once (`~/Library/Application Support/com.davinci.notes/vault-index.db`) to recover.
- Migration ordering/stability is enforced project-wide; see also ADR-0036.
