# 0205 — Hybrid Browser Vault Storage and Multi-Tab Web SQLite Serialization

- **Status:** Accepted (extends ADR-0002, ADR-0006, ADR-0026, ADR-0168)
- **Date:** 2026-10-22

## Context

A browser version of DaVinci Notes must preserve plain `.md` files as the source of truth (ADR-0001) without introducing an owned backend server (ADR-0006). However, the File System Access API (`showDirectoryPicker`) is only supported on desktop Chromium browsers, whereas Origin Private File System (OPFS) is supported across Chrome, Edge, Firefox, and Safari on both desktop and mobile. Additionally, SQLite index queries and FTS5 BM25 search must obey universal `withDbLock` serialization (ADR-0168) across both async microtasks and multiple browser tabs.

## Decision

1. **Dual-Engine Browser Vault Storage**:
   - **Engine 1 (`FileSystemAccessAdapter`)**: Direct read/write to a user-selected OS directory on Chromium desktop browsers, with IndexedDB handle persistence and `requestPermission({ mode: "readwrite" })` re-prompting.
   - **Engine 2 (`OpfsFileSystemAdapter`)**: Universal fallback storing plain `.md` files and binary attachments in the browser's Origin Private File System, synchronized via the existing Google Drive manifest-diff sync engine (`createWebManifestSource` using native Web Crypto `SHA-256`) and portable `.davinci-vault-archive-v1` export/import.
2. **Multi-Tab Web Locks + Universal `withWebDbLock` (`WebSqliteAdapter`)**:
   - All web SQLite reads, writes, and `withTransaction` blocks are serialized through an in-tab FIFO promise queue wrapped inside `navigator.locks.request("davinci-vault-db-lock:<vaultId>", { mode: "exclusive" })`.
   - Re-entrant `inTransaction` tracking prevents deadlocks when `withTransaction` callbacks invoke `execute` or `select`.
   - Shared `VAULT_INDEX_MIGRATIONS` (versions 1–8) are exported from `@app/indexer` as a single immutable source of truth (ADR-0035).

## Consequences

- Works across all major browsers while giving Chromium desktop users direct local disk folder access.
- Eliminates multi-tab OPFS/SQLite corruption and preserves FTS5 BM25 ranking parity (`1.0` title, `0.75` tags, `0.5` body).
