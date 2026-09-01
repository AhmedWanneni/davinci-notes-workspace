# ADR-0119: Shared manifest infrastructure and hashing boundary

## Status

Accepted

## Context

Phase 1 needs one manifest model for both sync modes. Drive and folder sync
must later consume the same file identity and tombstone rules, while the
desktop and mobile clients must be able to use the model without importing
application code. The desktop already keeps vault parsing and policy in
TypeScript and delegates filesystem work to Rust ([ADR-0025](0025-js-side-indexer-rust-io-only.md)).
Bulk and incremental work should also preserve the batching discipline used by
vault indexing ([ADR-0037](0037-bulk-batching-and-links-conflict-handling.md)).

## Decision

Place `ManifestEntry`, manifest generation, and JSON snapshot serialization in
the dependency-light `@app/sync-client` package. It depends on no app or
service package, so both desktop and future mobile clients can consume the
same policy. Persistence is exposed through a small storage adapter; the
manifest is JSON data, while each platform chooses its durable local location.

Use Rust for filesystem walking, metadata, and BLAKE3 hashing, exposed to the
client through a narrow adapter. The desktop implementation streams files in
bounded 64 KiB reads using the maintained `blake3` crate, avoiding a WASM
dependency and avoiding loading an entire vault or file into the webview.
TypeScript owns ordering, Lamport-clock assignment, tombstones, and the
size+mtime fast path.

The fast path reuses a prior hash only when both size and mtime match. This is
an intentional performance tradeoff: a content change that preserves both
values can evade a normal incremental pass. Callers can request an occasional
full re-hash with `forceRehash`; later sync scheduling may choose its cadence.
Missing files remain as `deleted: true` entries, and unchanged tombstones are
retained.

## Consequences

- Drive and folder modes share manifest policy without sharing a transport
  abstraction or adding network code to this phase.
- Rust avoids a new WASM hashing dependency and keeps large-file memory bounded;
  the adapter boundary remains testable with an in-memory source.
- JSON persistence keeps the snapshot portable and leaves its platform path
  independent of the shared package. No SQLite schema migration is required.
- Phase 3 still owns three-way diff and conflict behavior; this ADR only
  establishes local manifest generation and durable snapshot shape.
