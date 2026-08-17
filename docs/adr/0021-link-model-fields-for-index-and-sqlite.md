# ADR-0021: Link model fields for index + SQLite

## Status
Accepted

## Context
The `links` table columns (`target_raw`, `heading`, `block_id`) need a 1:1 mapping from parsed link data at insert time.

## Decision
`Link` in `@app/core-types` adds `targetRaw`, `heading`, and `blockId` beyond the minimal shape in `stack-architecture.md`.

## Consequences
- Parsed links map 1:1 onto `links` columns without ad hoc transforms at insert time.
