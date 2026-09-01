# ADR-0117: Manifest hashing at the Rust/platform I/O boundary

## Status

Accepted

Manifest generation needs file walking, metadata reads, and BLAKE3 content
hashing. The repository's established boundary keeps filesystem I/O in Rust and
manifest/indexing policy in TypeScript. A JS-side BLAKE3 implementation would
add runtime/bundle cost and create a second vault-reading path.

## Decision

BLAKE3 hashing is supplied by a platform adapter: desktop will expose native
file hashing through Tauri IPC, while shared `@app/sync-client` owns manifest
policy and accepts a `ManifestSource` adapter providing file metadata and
`hashFile(path)`. Tests inject deterministic offline adapters.

The manifest package remains network-free and Tauri-free. It applies the
size+mtime fast path before invoking the adapter, preserving the Rust-for-I/O,
JS-for-logic architecture and allowing a future mobile adapter to use sandbox-
native file APIs without duplicating manifest policy.
