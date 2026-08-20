# ADR-0086: General search plan decision index and verification status

## Status
Accepted

## Decision index

General Search uses a separate lazy Search surface from the fuzzy Command
Palette (ADR-0079), extends the existing SQLite FTS5/indexer architecture
(ADR-0080), and places parsing/execution in `@app/indexer` (ADR-0082). V1
supports terms, quoted phrases, optional-`#` `tag:`, and leading-minus
exclusions (ADR-0081); malformed/unknown operator behavior is defined by
ADR-0083. Execution uses implicit AND, direct Phase 4 tag-index matching,
exclusion removal, SQLite bm25 ranking, snippets, and deterministic title/path
ties (ADR-0084). Desktop exposes one live TagIndex through workspace state and
keeps FTS behind the SQLite singleton (ADR-0085).

## Verification status

Search, tag parsing, nested matching, editor tag rendering, FTS maintenance,
watcher reconciliation, and CRUD-focused tests pass. The existing standalone
large-vault benchmark could not run because its Node/strip-types entrypoint
imports `packages/core-types/NoteTags.js`, which is not present at runtime.
The recorded mocked benchmarks remain 3 ms for the Phase 1 1,000-note FTS
batch and 4 ms for the Phase 3 1,000-note combined execution test; these are
not substitutes for the blocked cold-start SQLite benchmark.
