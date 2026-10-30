# ADR-0240: Git Manager Conflict Resolution and Merge Lifecycle

## Context

Phase 8 requires robust merge conflict detection, inspection, 3-pane resolution, and merge abort/completion controls:
1. When merge conflicts occur (`git status` reports unmerged `u` files), users must be able to inspect the conflicting versions (Stage 1 ancestor base, Stage 2 current branch/ours, Stage 3 incoming branch/theirs).
2. Users need a 3-pane interactive resolver (Ours, Result, Theirs) with one-click resolution options: Accept Ours, Accept Theirs, Accept Both (combination), or manually edit the result.
3. Support for adversarial conflict topologies: same-line conflicting edits, delete-vs-modify, binary files (image/attachments), and mid-merge external edits (e.g. from Syncthing or cloud sync).
4. Abort mid-merge must restore the exact prior working tree without data loss or residual index corruption.
5. Completing the merge must produce a valid 2-parent merge commit concluding the merge lifecycle.

## Decision

1. **Conflict Stage Extraction (`git_manager_conflicts.rs`)**:
   - `git_manager_get_conflict_details` inspects `git show :1:<path>` (base), `git show :2:<path>` (ours), and `git show :3:<path>` (theirs).
   - Detects deletions (`ours_exists`, `theirs_exists`) to gracefully handle delete-vs-modify conflicts.
   - Detects binary content via `--numstat` checks (`-\t-\t`) and null-byte inspection, preventing binary mangling.
2. **Dedicated Conflict Store & 3-Pane UI (`useGitConflictStore.ts`, `GitConflictResolver.tsx`)**:
   - Isolates resolution workflow in `useGitConflictStore` to respect file size caps.
   - Presents a 3-pane interface: Left = Ours (read-only), Center = Result (editable), Right = Theirs (read-only).
   - One-click shortcuts for "Ours", "Theirs", and "Both".
3. **Safe Abort & Merge Completion**:
   - `git_manager_abort_merge` invokes `git merge --abort` under `with_git_lock`, reverting the working tree to the exact state before the merge attempt.
   - `git_manager_continue_merge` verifies all conflicts are staged and commits via `git commit --no-edit`.
4. **Adversarial Verification Suite (`git_manager_conflict_tests.rs`)**:
   - Verified same-line conflict, delete-vs-modify, binary file conflict, mid-merge external filesystem edits, and hash-verified exact working tree restoration on abort using Blake3 checksum comparison.

## Consequences

- First-class visual merge conflict resolution inside the Git Manager panel.
- Resilient against external synchronization interference and binary corruptions.
- Guaranteed zero-loss abort semantics.
