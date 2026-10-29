# ADR-0237: Git Manager History Graph and Commit Detail

## Context

Phase 5 requires rendering Git commit history with a visual branch/merge graph, commit detail inspection, and per-file history navigation.

Key requirements:
1. Performance: The history view must scroll smoothly at 60 fps even on repositories with 10,000+ commits.
2. Lightweight: No third-party graph or chart libraries (e.g. Cytoscape, D3, Mermaid). Must use a custom, minimal SVG lane renderer.
3. Accurate branch topology: Branching, merging, and linear commit sequences must be represented with deterministic lane colors and bezier/line connections.
4. Detailed commit views: Users must be able to inspect commit messages, author metadata, and changed files with addition/deletion statistics, with one-click drill-down to diffs.

## Decision

1. **Delimited Paged Log Backend (`git_manager_log.rs`)**:
   - `git_manager_get_log` executes `git log --date-order -n <limit> --skip <skip> --pretty=format:%H%x1f%P%x1f%an%x1f%at%x1f%s%x1f%D%x1e` using ASCII unit (`0x1f`) and record (`0x1e`) separators.
   - Supports optional `-- <path>` filtering for per-file history.
   - `git_manager_get_commit_details` queries metadata via `git show -s` and file changes via `git diff-tree --root --no-commit-id --numstat -r <hash>`.
2. **Deterministic O(N) Graph Lane Algorithm (`calculateGraphLanes.ts`)**:
   - Computes lane positions and parent connections sequentially without graph libraries or quadratic traversals.
   - Connects parent commits using lightweight SVG lines/paths.
3. **Virtualized Rendering with `@tanstack/react-virtual`**:
   - `GitHistoryGraph` virtualizes rows using a 28px estimated height and overscan of 10 items.
   - DOM footprint remains bounded to ~25 visible elements regardless of total commit count.
4. **Commit Detail Sheet (`GitCommitDetailSheet.tsx`)**:
   - Displays full commit message, author info, and modified files with additions (`+X`) and deletions (`-Y`).

## Consequences

- Ultra-lightweight history graph with zero external graph libraries.
- Paged virtualized rendering guaranteeing 60 fps scroll performance.
- Seamless drill-down from history commits to file diffs.
