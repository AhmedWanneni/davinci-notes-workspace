# ADR-0236: Git Manager Diff Viewer and Hunk Staging

## Context

Phase 4 requires viewing file diffs (comparing unstaged working tree changes against the Git index, and staged changes against `HEAD`), as well as applying hunk-level patches directly to the staging area.

Key considerations:
1. Bundle weight: Diff rendering must not inflate initial bundle weight. `@codemirror/merge` (~15 KB gzip) is code-split and isolated inside `@app/git-manager`.
2. Large files: Viewing 5 MB markdown notes or files with thousands of lines must remain responsive without freezing the UI thread.
3. Clean staging abstractions: Diffing must accurately reflect whether the user is inspecting staged changes (`git diff --cached`) or unstaged changes (`git diff`), handling newly added, modified, and deleted files.
4. Hunk staging: Applying specific patches must update the index directly without corrupting working tree edits.

## Decision

1. **Lazy `@codemirror/merge` Unified Merge View**:
   - `GitDiffViewer` uses `@codemirror/merge`'s `unifiedMergeView` extension.
   - Renders unified deletions in red and additions in green with line gutters and syntax highlighting.
   - CodeMirror 6's virtualized line viewport ensures smooth rendering even for large multi-thousand line files.
2. **Dual-Mode Backend Diff Queries (`git_manager_diff.rs`)**:
   - `git_manager_get_file_diff`:
     - If `staged`: queries `HEAD:<path>` (original) and `:<path>` (index), plus `git diff --cached -U3`.
     - If `unstaged`: queries `:<path>` (or `HEAD:<path>` fallback for untracked) and working tree disk content, plus `git diff -U3`.
3. **Atomic Patch Staging (`git apply --cached`)**:
   - `git_manager_apply_patch` pipes unified diff patches directly into `git apply --whitespace=nowarn --cached -`.
   - Unstaging passes `--reverse`.
   - Operations are wrapped in `with_git_lock` to prevent concurrency races.

## Consequences

- Lightweight, fast inline diff viewer integrated into the Git Manager workflow.
- Accurate comparisons for both staged and unstaged revisions.
- Zero bundle weight impact when Git Manager is disabled.
