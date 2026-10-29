# ADR-0235: Git Manager Staging, Discard, and Commit Operations

## Context

Phase 3 of the Git Manager introduces working tree mutations: staging files into the Git index, unstaging files, discarding uncommitted modifications or cleaning untracked files, creating commits, and amending previous commits.

Key technical challenges:
1. Concurrency: Git index file locks (`.git/index.lock`) cause fatal crashes if multiple processes or threads write concurrently (e.g. user staging files while an auto-save version is being written).
2. Initial commit edge-cases: A freshly initialized repository has no `HEAD` commit. Common commands like `git reset HEAD <file>` fail with ambiguous revision errors.
3. Pathspec mixing in discard: Running `git restore --worktree -- <paths>` fails completely if any path in the argument list is an untracked file not yet known to Git.
4. Destructive actions: Discarding changes permanently deletes uncommitted edits.

## Decision

1. **Global Serialization with `with_git_lock`**:
   - All Git-mutating operations (`stage`, `unstage`, `discard`, `commit`) acquire `GIT_OPERATION_LOCK` in Rust before spawning the Git CLI process.
   - Prevents index lock collisions between manual user actions and background auto-versioning.
2. **Initial Commit & Empty HEAD Handling**:
   - `unstage_paths_internal` verifies whether `HEAD` exists via `git rev-parse --verify HEAD`.
   - If `HEAD` exists: uses `git restore --staged -- <paths>`.
   - If repo has no commits: uses `git rm -r --cached --ignore-unmatch -- <paths>`.
3. **Per-Path Discard Resolution**:
   - `discard_paths_internal` iterates paths and attempts `git restore --worktree -- <path>` first. If the file is untracked (non-zero exit code), it invokes `git clean -f -d -- <path>` to remove untracked files or directories cleanly without cross-pathspec failures.
4. **Destructive Action Confirmation Gate**:
   - Discarding changes (both single-file and discard-all) requires explicit user confirmation via dialog prompt before triggering the backend command.
5. **Commit Box & Amend Workflow**:
   - `GitCommitBox` enforces non-empty commit messages, provides ⌘Enter / Ctrl+Enter keyboard submission, and supports toggling `amend` mode.

## Consequences

- Rock-solid staging and unstaging across new repositories, existing repositories, and mixed file sets.
- Guaranteed protection against index corruption and race conditions.
- Zero data loss risk from accidental discards.
