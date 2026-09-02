# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Lint Cleanup — All 9 Packages Clean**
Full workspace lint had been blocked by pre-existing errors surfaced when the `@typescript-eslint/no-unused-vars` rule was configured for the first time. All 43 test files pass (158 tests).

## Last Session

**Lint Cleanup**

### Completed
- **`@app/indexer`**: Removed unused `normalizeTag` import in `buildTags.ts`; removed unused `phrase` parameter from `quoteFtsValue` in `searchExecution.ts`.
- **`@app/editor`**: Typed all `Vim.defineEx` callbacks with `CodeMirrorV` (from `@replit/codemirror-vim`) instead of `any`; prefixed intentionally-unused `cm` params as `_cm`; fixed unused `view` destructure in `vimModalEditing.test.ts`.
- **Root `.eslintrc.js`**: Configured `@typescript-eslint/no-unused-vars` with `argsIgnorePattern/varsIgnorePattern: "^_"` (standard TS underscore convention); added `overrides` to disable `boundaries/no-private` for `*.test.ts` files (test files legitimately reach internal helpers).
- **`@app/canvas` (`CanvasBenchmark.test.ts`)**: Resolved by the test-file override above — was on "Next Up" list.
- **`@app/desktop` (`createNoteCrudActions.ts`)**: Implemented the stubbed `renameFolderFromTree` body (was `// ... rest of the file` placeholder) — wired `renameFolderInVault(oldPath, trimmed)` correctly.
- **Result**: All 9 packages lint clean; 43 test files, 158 tests pass.

## Next Up (in order)

1. **Manual Re-Test of OAuth Sign-In**: Execute interactive OAuth sign-in flow and verify consent display shows both `drive.file` and `drive.appdata` permissions, token presence in OS keychain, refresh/restart persistence, and sign-out deletion.
2. **Stabilization pass Phase 1** (`plans/stablize.md`): dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
3. **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
5. **Unlinked Mentions Detection**
6. **Inline Property Editing**
7. **Outline Scroll Synchronization**
8. Add success/warning semantic color tokens
9. Chromatic / Playwright screenshot regression

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.
