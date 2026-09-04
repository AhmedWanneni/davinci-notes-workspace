# ADR-0137: AI vectors use SQLite BLOBs with application-side cosine search

## Status
Accepted

## Context

Phase 1 produces chunk embeddings that need durable storage in the existing
`sqlite:vault-index.db`. `sqlite-vec` is attractive, but this app uses
`tauri-plugin-sql` rather than a Rust-owned `rusqlite` connection.

## Evaluation

The sqlite-vec repository is active and releases are frequent, but it is
explicitly pre-v1. Its Rust offering is FFI/build support, not an extension
already integrated with this app's plugin-sql connection. Loading a compiled
extension would require a new native SQLite connection or a new Tauri SQL
plugin path. The project also has open reports covering load failures from
missing platform link flags, ABI/version mismatches, ARM CPU portability, and
virtual-table deletion behavior.

The checked risks are therefore:

- **Rust/Tauri loading:** not cleanly available through the current
  `tauri-plugin-sql` API; no extension-loading hook or raw SQLite handle exists.
- **WAL:** no direct incompatibility was found, but introducing a second
  connection/extension initialization path would re-open the existing
  `SQLITE_BUSY` and connection-PRAGMA risk.
- **Packaging/versioning:** a per-platform native extension would add binary
  assets, ABI pinning, and CPU-feature validation to the Tauri bundle.

## Decision

Store vectors as packed `Float32Array` BLOBs in `embedding_chunks`, a v4
incremental migration in the existing vault index database. Keep chunk IDs,
note paths, headings, line ranges, content hashes, and model identifiers in
ordinary columns. Rank a bounded result set with application-side cosine
similarity. Use the existing singleton DB, WAL, `synchronous=NORMAL`,
`busy_timeout`, and `withDbLock` boundaries.

This is the launch implementation. sqlite-vec can be reconsidered only after
the app has a supported Rust-owned SQLite handle and a measured cross-platform
extension packaging plan.

## Consequences

The schema works for existing pre-AI vaults through migration alone; notes and
FTS data are not rebuilt. A full scan is acceptable for the current 350-note
fixture but is not assumed acceptable for many-thousand-chunk vaults. The
interactive target is under 5ms, matching the existing editor responsiveness
budget. Phase 3 must benchmark a larger corpus before promising
search-as-you-type latency.
