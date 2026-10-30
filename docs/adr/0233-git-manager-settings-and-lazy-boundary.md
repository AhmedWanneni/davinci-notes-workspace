# ADR-0233: Git Manager Activation Setting and Lazy-Loaded Monorepo Boundary

## Status

Accepted

## Context

Phase 1 introduces the activation mechanism, repo detection, icon rail navigation, and empty states for the Git Manager source control interface. Per `PERFORMANCE.md` and `AGENTS.md`, non-critical views must impose strictly 0 KB bundle weight and zero process spawning when disabled or unused.

## Decisions

1. **Setting `git.enabled`**:
   - Stored in the SQLite `settings` table as `"git.enabled"` (`"true"` | `"false"`), defaulting to `false`.
   - Read/written strictly through `withDbLock` to maintain universal SQLite concurrency discipline.
   - Exposed as "Git Version Control" toggle in `GeneralSettingsTab`.
2. **Dedicated Workspace Package `@app/git-manager`**:
   - Colocated under `packages/git-manager` as an independent workspace library.
   - ESLint boundaries configured to prohibit importing application layers (`apps/*`).
3. **True Lazy-Load Boundary**:
   - `AppSidebar` dynamically imports `@app/git-manager` via `React.lazy()` only when `isGitManagerOpen` is true.
   - Initial production bundle entry delta is strictly **0 KB**. The code-split Git chunk is 4.4 KB raw (1.8 KB gzip).
   - Zero Git child processes are spawned while the feature is disabled or while the Git panel is hidden.
4. **Icon Rail & Empty States**:
   - Phosphor `GitBranch` icon appears on the icon rail only when `git.enabled` is `true`.
   - Three distinct empty states handled:
     - `not-installed`: Git missing from PATH with actionable installation guidance.
     - `not-repo`: Vault not tracked with Git with a primary "Initialize Repository" button.
     - `no-commits`: Fresh repository ready for its initial commit.

## Verification

- `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml git_manager_commands` passed (2/2 tests).
- `pnpm --filter @app/git-manager test` passed (6/6 tests).
- `pnpm --filter @app/desktop test IconRail.test.tsx AppSidebar.test.tsx` passed (12/12 tests).
- `pnpm --filter @app/desktop build:web` generated isolated chunk `index-9krMKY6f.js` (4.4 KB raw), absent from initial entry bundle.
- 0 ESLint errors across `@app/git-manager` and `@app/desktop`.
