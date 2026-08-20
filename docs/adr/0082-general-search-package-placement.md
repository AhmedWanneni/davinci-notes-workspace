# ADR-0082: General search logic lives in `@app/indexer`

## Status
Accepted

## Context

The monorepo uses feature-capable packages rather than a package per data type. `@app/core-types` is dependency-free and owns shared models; `@app/indexer` already owns note parsing, tag indexing, graph indexing, and the SQLite schema boundary. Desktop UI consumes those capabilities through package exports.

## Decision

Place the general search query model/parser, FTS query construction, and index-level execution APIs in `@app/indexer`. Export the public search surface from its existing barrel. Keep desktop Search components and navigation wiring in `apps/desktop`; keep only genuinely cross-package value types in `@app/core-types` if later required.

## Consequences

- Search reuses Phase 4 tag queries directly and shares indexer tests/benchmarks.
- No new package boundary or dependency graph edge is introduced.
- The indexer owns pure query semantics; desktop owns presentation and app state.
