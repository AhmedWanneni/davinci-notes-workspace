# ADR-0125: Comprehensive Sync Architecture Closeout Across Phases 0–7

## Status

Accepted

## Context

With Phase 7 (Regression & Performance Pass) completed, the local-first synchronization architecture is fully built, tested, and verified across all 8 phases (Phases 0 through 7) outlined in `plans/sync/sync-plan.md` and `plans/sync/sync-plan-phases.md`.

This ADR records the final comprehensive closeout indexing all architectural decisions, platform boundaries, security models, conflict resolution algorithms, burst handling, and performance benchmarks established throughout the sync implementation.

## Architectural Summary Across Phases 0–7

### 1. Phase 0 — Architecture & Storage Decoupling (ADR-0116)
- **Zero Owned Backend**: Sync relies exclusively on Google Drive OAuth/API or Syncthing/folder tools. No backend servers, custom APIs, or database middle-layers are owned or maintained.
- **Manifest-Diff Model**: Sync operates on a 3-way manifest diffing protocol (Local vs. Remote vs. Base), superseding CRDTs/server-canonical sync (ADR-0008).

### 2. Phase 1 — Shared Manifest Infrastructure (ADR-0117, ADR-0119)
- **Shared Package**: Implemented in `@app/sync-client`.
- **Hashing Boundary**: Platform I/O provides fast native BLAKE3 file hashing; shared JS code owns manifest data structures, device clocks, tombstones, and fast-path metadata comparison (`size` + `mtimeMs`).
- **Fast-Path Skip**: Manifest generation skips re-hashing when file `size` and `mtimeMs` match cached metadata, resulting in 0 re-hashes on unchanged 350-file vaults (< 1.5 ms execution time).

### 3. Phase 2 — Google Drive OAuth & Scope Architecture (ADR-0118, ADR-0120, ADR-0121)
- **PKCE Authentication**: Uses Desktop PKCE OAuth 2.0 flow via local loopback webserver and OS Keychain storage (`keyring` / `tokio`).
- **Scope Model**: Requests non-sensitive `drive.file` and `drive.appdata` additively.
- **Hidden App Data Folder**: Drive API calls target `spaces=appDataFolder` and `parents: ["appDataFolder"]`, keeping per-device manifest state hidden from the user's main Drive folder.

### 4. Phase 3 — Manifest Storage, Delta Tracking & Transfer
- **Manifest Persistence**: Device manifests are stored in Drive's hidden `appDataFolder` as `manifest-<deviceId>.json` (`DriveManifestStore`).
- **Delta Tracking**: Changes API `listChanges` uses `startPageToken` and `spaces=appDataFolder` for incremental remote polling.
- **Deduplicated Transfer**: Content-hash keyed blob storage uploads missing blobs (`uploadContentBatch`) and applies pulled changes safely via `applyPulledChanges`.

### 5. Phase 4 — Conflict Resolution & Data Loss Prevention (ADR-0122)
- **Text Files (`.md`)**: Line-based `node-diff3` three-way merge. Non-overlapping edits merge cleanly without markers; overlapping edits insert `<<<<<<<`, `=======`, `>>>>>>>` inline markers with zero content loss. Tested safe with `@app/indexer` wikilink parsing.
- **Canvas Files (`.canvas`)**: Atomic copy resolution (`isTextMergeable` returns `false`), generating `<name> (<device> copy).canvas`. Bypasses text merge to prevent JSON syntax corruption. Validated 100% valid JSON Canvas 1.0 format.
- **Binary Assets (`.png`, `.jpg`, `.pdf`)**: Atomic copy resolution with device name and numeric collision chaining (`<name> (<device> copy) 1.<ext>`).
- **Delete-vs-Edit**: Edit wins over deletion with surfaced user notification.

### 6. Phase 5 — Syncthing / Folder Sync Mode (ADR-0123)
- **Zero-Daemon Integration**: Operates standalone via canonical folder selection (`openAndIndexVaultFromPicker`) without daemon IPC.
- **Watcher Burst Robustness**: `reconcileVaultChanges` pre-fetches `readNote` IPC calls in parallel prior to acquiring SQLite `BEGIN IMMEDIATE` locks (~1–2 ms lock hold). Verified under a 52-item burst in 452 ms without `SQLITE_BUSY` errors or UI freezes.
- **Conflict Recognition & UI**: Recognizes `.sync-conflict-*` files, displays `[Conflict]` badge in FileTree, keeps conflict files fully indexed in FTS5/SQLite, and surfaces them in `SyncConflictsPanel`.

### 7. Phase 6 — Sync Setup & Mode Configuration UI (ADR-0124)
- **Asymmetric Framing**: Displays Google Drive as the primary recommended built-in option (`<Badge variant="primary">Recommended</Badge>`) and Syncthing as the secondary external tool (`<Badge variant="secondary">External</Badge>`).
- **Mode Isolation**: Sync is opt-in (`"off"` by default). Active mode views present dedicated status and management controls without misleading in-place mode switching buttons.

### 8. Phase 7 — Regression & Performance Verification
- **Large-Vault Manifest & Diff**: 350-item manifest incremental generation completes in < 1.5 ms (0 re-hashes). Three-way diff classification completes in < 2 ms.
- **Editor Responsiveness**: Background sync operations do not block the UI or editor thread (keystroke latency benchmark maintained at < 1.0 ms).
- **Multi-Format Sync**: `.canvas`, `.png`, `.jpg`, `.pdf`, and `.md` files pass all regression and conflict tests.

## Verification Result

- **`@app/sync-client`**: 32 / 32 tests passed (10 test files).
- **`@app/desktop`**: 151 / 151 tests passed (42 test files).
- **Total Test Suite**: 183 / 183 tests passed cleanly.
