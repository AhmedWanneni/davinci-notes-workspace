# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code.

---

## Current Focus

Design system: tokens + foundation setup (not yet started — this is the starting point).

## Done

- **Monorepo Scaffolding**: Configured pnpm workspace, Turborepo pipeline, tsconfig path aliases, and ESLint boundary rules.
- **Local Hooks**: Configured Husky, `lint-staged`, and `commitlint` (Conventional Commits).
- **CI Pipeline**: Configured GitHub Actions workflow running lint, typecheck, test, build, and Storybook build via Turbo affected filter. Verified both passing and failing PR flows.
- **PR Template & Conventions**: Created `.github/PULL_REQUEST_TEMPLATE.md` and `CONTRIBUTING.md`.
- **Changesets**: Configured `@changesets/cli` tracking `packages/*` and ignoring apps/services.

## In Progress

_(nothing yet)_

## Next Up (in order)

1. Set up tooling: PostCSS pipeline, Stylelint, Storybook, Vitest (see `design-system-plan.md` Phase 0)
2. Define design tokens: color, type scale, spacing, border, motion (`design-system-plan.md` Phase 1)
3. Reset + global mixins (Phase 2)
4. Typography primitive — build first, validates type scale against real content
5. Button, Input, Checkbox/Radio/Toggle, Divider, Badge, Tooltip primitives — each with story + test before moving to next
6. Turn on Stylelint token-enforcement rule (only once tokens are stable)
7. Composed patterns (file tree item, sidebar section, command palette row) — only after primitives are stable

## Blocked / Open Questions

_(none)_

## Session Log

| Date | Focus | Outcome |
|---|---|---|
| 2026-08-01 | Git Workflow, Hooks, CI & Changesets | Configured Husky, commitlint, lint-staged, GitHub Actions CI workflow, PR templates, CONTRIBUTING.md, and Changesets. All verified. |