# ADR-0238: Git Manager Branch Management and Dirty Tree Guard

## Context

Phase 6 requires branch operations in the Git Manager panel:
1. Listing local and remote branches with upstream tracking and ahead/behind information.
2. Switching branches safely, preventing silent working tree clobbers or partial checkouts when uncommitted changes exist.
3. Creating new branches from the current HEAD.
4. Deleting branches with confirmation and safe vs forced deletion behavior.
5. Providing stash push and pop utilities to let users stash changes when they need to switch branches.

## Decision

1. **Tab-Delimited Branch Enumeration (`git_manager_branches.rs`)**:
   - `git branch -a --format="%(refname:short)%09%(upstream:short)%09%(HEAD)%09%(upstream:track)"` queries local and remote tracking branches using standard ASCII tabs (`%09`), avoiding formatting collisions with commit/branch naming.
   - Parses ahead/behind indicators directly from `upstream:track` (e.g. `[ahead 2, behind 1]`).
2. **Dirty Tree Guard Before Checkout**:
   - Before executing `git checkout <branch>`, `git_manager_switch_branch` checks `git status --porcelain=v2 -z`.
   - If tracked or untracked changes exist, it returns `Err("DIRTY_WORKING_TREE: Cannot switch branches with uncommitted changes.")` unless the user explicitly requests force or stashes first.
3. **Dedicated Stash Commands (`git_manager_stash.rs`)**:
   - `git_manager_stash` and `git_manager_stash_pop` allow safe saving and restoring of working tree states without clobbering user notes.
   - Kept in a dedicated file under 150 lines to maintain single responsibility and respect file size constraints.
4. **Radix Popover UI (`GitBranchSwitcher.tsx`)**:
   - Compact branch button showing the active branch name, upstream tracking badge, and ahead/behind counts.
   - Filterable branch list with active branch checkmark, "Create branch", and branch deletion action with confirmation.
5. **Concurrency & Synchronization**:
   - All branch modifications (switch, create, delete, stash) acquire `with_git_lock` via `GIT_OPERATION_LOCK`.

## Consequences

- Prevents accidental merge conflicts or note overwrites during branch switching.
- Clean and lightweight branch switching with zero external UI dropdown bloat.
- Stash push/pop provides an escape hatch when switching branches with dirty working trees.
