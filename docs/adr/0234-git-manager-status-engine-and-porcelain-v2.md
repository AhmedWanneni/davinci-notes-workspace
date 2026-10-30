# ADR-0234: Git Manager Status Engine and Porcelain v2 Parsing

## Context

Phase 2 of the Git Manager requires reading repository status (staged, unstaged, untracked, and conflicted files) efficiently and reacting dynamically to repository mutations without spinning up expensive polling loops or loading the UI thread.

System `git status` can output in several formats. Legacy short format (`--short`) has ambiguities with rename quotes and whitespace handling, and requires manual parsing of compound status codes. Porcelain v2 (`--porcelain=v2`) provides stable, machine-readable output with explicit record types (Type 1 for standard changes, Type 2 for renames/copies, Type u for unmerged conflicts, and Type ? for untracked files).

To guarantee safety for paths containing spaces, unicode, or emojis (e.g. `Notes/💡 Ideas & Projects/2026 Étude.md`), NUL byte delimiting (`-z`) is strictly required.

## Decision

1. **Rust Invocation with Cancellation & Timeout**:
   - `git_manager_status` runs `git status --porcelain=v2 -z --untracked-files=all` using `std::process::Command` in Rust.
   - Enforces a 5-second timeout and cancellable execution without holding the UI thread or blocking concurrent SQLite operations.
2. **NUL-Delimited Porcelain v2 Parser**:
   - Implemented in `packages/git-manager/src/parsers/parsePorcelainV2.ts`.
   - Parses Type 1 (`1 <XY> ... <path>`), Type 2 (`2 <XY> ... <path>\0<origPath>`), Type u (`u <XY> ... <path>`), and Type ? (`? <path>`).
   - Categorizes changes into `staged`, `unstaged`, `conflicts`, and `untracked`.
3. **Event-Driven Reactive Refresh**:
   - Instead of a background polling loop, the existing filesystem watcher (`watcher.rs`) monitors `.git/HEAD`, `.git/index`, and `.git/refs/**` mutations.
   - When detected, it emits the Tauri event `"git-changed"`.
   - The UI subscribes to `"git-changed"` only while `GitSidebarPanel` is mounted, debounced by 200 ms to avoid redundant updates during rapid disk writes.
4. **CUBE CSS & Token Compliance**:
   - `GitStatusRow` and `GitChangesList` use dedicated SCSS modules with design system tokens (`var(--type-scale-*)`, `var(--color-*)`, `var(--space-*)`).
   - All files adhere to the 250-line maximum limit.

## Consequences

- Zero Git processes spawned while the Git Manager panel is not mounted or the feature is disabled.
- Full path fidelity for international characters and whitespace without escaping corruption.
- Real-time updates when commits, checkouts, or external edits alter the working tree or index.
