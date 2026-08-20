# ADR-0080: General search extends the existing SQLite/indexer architecture

## Status
Accepted

## Context

`@app/indexer` is the established TypeScript parsing/indexing package. It parses frontmatter, wikilinks, and tags, and produces `Note` values containing canonical note content. Desktop persistence uses SQLite through `@tauri-apps/plugin-sql`; the current schema stores note metadata, tags, and links but not searchable note bodies. ADR-0005 already selects SQLite + FTS5 for index and search, and ADR-0025 keeps parsing/indexing in JS with Rust handling filesystem I/O.

The repository has no full-text engine, query parser, or content-search implementation today. A separate JS search library would add a second index, duplicate synchronization work, and consume memory for whole-vault content.

## Decision

Extend `@app/indexer` and the existing SQLite index with an incremental FTS5 content index. Persist searchable note text through a new migration, update the FTS row in the existing note reindex path, and execute bounded SQL queries from the search layer. Keep parsing and query semantics in TypeScript; use SQLite for indexed matching and ranking. Do not add a new search dependency or native engine.

The implementation must preserve incremental indexing, batch writes, and a lazy Search UI. It must not load the whole vault into the browser for each query.

## Consequences

- One authoritative store serves content, metadata, tags, and future joins.
- FTS5 provides indexed full-text matching without a second runtime index.
- A new migration is required; applied migrations remain immutable.
- Search results can join FTS matches to `notes` and the Phase 4 tag index.
