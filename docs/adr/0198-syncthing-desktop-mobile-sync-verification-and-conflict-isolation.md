# ADR-0198: Syncthing desktop-mobile sync verification and conflict isolation

## Status

Accepted (extends ADR-0116, ADR-0189)

## Context

Running the 10-scenario synchronization matrix across desktop and mobile exposed three edge-case failures in file indexing and conflict handling:

1. **Conflict File Indexing Pollution**:
   - Syncthing resolves concurrent offline modifications by keeping one file and creating a `*.sync-conflict-<date>-<time>-<id>.<ext>` file.
   - Because conflict files retain their `.md` extension, the mobile scanner (`vaultScanner.ts`) pushed them into `ctx.notes`, causing the indexer to parse links, frontmatter, and FTS for conflict files as normal notes.
   - Desktop and mobile must surface conflict files in the UI for user resolution while never indexing them as regular notes.

2. **Temporary File Leakage During Large Transfers**:
   - During large block transfers (e.g. 200 MB attachments), Syncthing writes `.syncthing.<file>.tmp` or `<file>.syncthing.tmp` files.
   - Without explicit temporary file pattern recognition, scanners risked reading, parsing, or indexing incomplete temporary artifacts before block transfers completed.

3. **Loop Prevention and Offline Emulation**:
   - Simulating offline mobile editing by pausing network devices tore down TCP sockets, introducing 20-second dial backoffs. Folder-level pausing (`folder.paused = true`) provides instantaneous offline emulation without destroying TCP connection state.
   - H1 ↔ filename synchronization only triggers from active user editor typing (debounced at 750ms); external filesystem updates land via reconcilers without triggering rename loops, maintaining stable mtimes.

## Decision

1. **Non-Destructive Conflict Isolation (`isSyncthingConflictPath`)**:
   - `packages/syncthing-api/conflicts.ts` provides `isSyncthingConflictPath` and `findSyncthingConflictFiles`.
   - On desktop, `VaultIndexer.ts`'s `isIndexedNotePath` rejects conflict paths from note indexing. `SyncConflictsPanel` reads vault paths to surface conflict versions for side-by-side review or cleanup.
   - On mobile, `vaultScanner.ts` routes conflict files to `VaultScanResult.conflicts` and excludes them from `ctx.notes` and `ctx.attachments`. Both offline versions are preserved on disk with zero data loss.

2. **Transfer Isolation (`isSyncthingTmpPath`)**:
   - Standardize `isSyncthingTmpPath` across `@app/syncthing-api`, desktop `VaultIndexer.ts`, and mobile `vaultScanner.ts`.
   - All `.syncthing.*.tmp`, `*.syncthing.tmp`, and `*.sync-conflict-*.tmp` files are ignored by file scanners, ensuring partial transfers are never opened or indexed.

3. **Automated End-to-End Verification Matrix**:
   - Implement `scripts/verify-syncthing-matrix.mjs` orchestrating a dual-node cluster (Desktop @ 8384, Mobile Peer @ 8385) running all 10 matrix scenarios directly against the filesystem.

## Consequences

- 10-scenario matrix verified with 100% pass rate directly on filesystem and REST endpoints.
- Zero note index pollution from Syncthing conflict or temporary sync files.
- Zero data loss during concurrent offline edits; both copies remain intact on disk.
- Complete hash convergence (100% SHA-256 match) across desktop and mobile vaults.
