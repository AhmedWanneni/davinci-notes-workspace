# ADR-0025: Desktop vault indexing — JS-side `@app/indexer`, Rust for I/O only

## Status
Accepted

## Context
Phase 5 boundary decision: where should parsing/graph logic live?

## Decision
Parsing and graph logic stay in `@app/indexer` (TypeScript in the webview) — not ported to Rust, not compiled to WASM. Rust handles vault-scoped file I/O (`fs.rs`), debounced filesystem watching (`watcher.rs` via `notify-debouncer-full`, 400 ms batch window), and vault path state. The frontend orchestrates vault open → `list_notes` / `read_note` IPC → `noteFromMarkdown` → SQLite writes via `@tauri-apps/plugin-sql` (`sqliteIndex.ts`). Incremental watcher reconciliation re-indexes only changed/removed paths.

## Consequences
- Reuses Phase 4 unit tests unchanged; avoids duplicating wikilink/frontmatter logic in Rust or adding a WASM bridge.
- Tradeoff: initial full index reads each file over IPC sequentially — acceptable for v1; batch/parallel reads or a Rust-side worker are future optimizations if the baseline regresses.
