# ADR-0189: Sync conflict resolution orchestration and zero-data-loss safety

## Status

Accepted

## Context

ADR-0122 defined the conflict resolution policies for DaVinci Notes (diff3 line merge for `.md`, copy-based resolution for `.canvas` and binaries, edit-wins for delete-vs-edit).
However, the low-level functions in `@app/sync-client` (`resolveTextConflict`, `resolveBinaryConflictName`, `resolveDeleteVsEdit`) lacked a unified, shared orchestrator (`resolveConflictAction`) callable identically by both desktop and mobile sync engines.

When mobile sync was ported, conflicting items were identified and left untouched pending conflict resolution. To satisfy the standing requirement of zero silent data loss across all platforms, a shared orchestrator must evaluate every conflict and guarantee:
1. When a 3-way text merge can be mathematically proven safe (non-overlapping line edits), produce clean merged content and converge both vaults.
2. When a merge cannot be proven safe (overlapping line edits, unparseable syntax, structured `.canvas` files, or binaries), never force or guess a merge; preserve both versions losslessly by generating a conflict copy (`<name> (<device> copy).<ext>`).
3. For delete vs. edit collisions, edit always wins regardless of whether the edit was local or remote.
4. Correctness must remain invariant under wall-clock skew (using content hashes and logical Lamport clocks) and survive mid-merge process termination via atomic writes.

## Decision

1. **Shared Orchestration in `@app/sync-client`**:
   Add `resolveConflictAction` to `@app/sync-client/conflictResolver.ts`. Both desktop and mobile invoke this exact shared function. No platform-specific fork is permitted.
2. **Clean Merge vs. Conflict Copy**:
   - For `.md` files with a common ancestor (or created with empty base): run `resolveTextConflict`. If `hasConflict === false`, return `{ action: "clean-merge", mergedContent }`.
   - If `hasConflict === true` or the file is non-text (`.canvas`, images, PDFs): return `{ action: "conflict-copy", copyPath, copyContent }`. The local file remains intact and the remote content is written to a non-colliding copy.
3. **Delete vs. Edit**:
   - Local deleted, remote edited -> `{ action: "delete-vs-edit-apply-remote" }`.
   - Local edited, remote deleted -> `{ action: "delete-vs-edit-keep-local" }`.
4. **Crash Resilience**:
   All writes (clean merges, pulled files, and conflict copies) use temporary files (`.tmp.sync_<nonce>_<filename>`) atomically renamed to the target. Mid-write interruptions leave the pre-existing files unchanged.
5. **Clock Invariance**:
   Manifest diff classification depends strictly on content hash, file size, and deletion state, while manifest sequencing uses logical Lamport clocks. Wall-clock skew has zero effect on convergence.

## Consequences

- Mobile and desktop sync engines use the exact same shared conflict resolution behavior.
- Zero silent data loss across all 10 adversarial conflict scenarios.
- Both devices converge to identical, deterministic vault states.
