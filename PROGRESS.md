# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code.

---

## Current Focus

Desktop app shell is working and wired to the design system. Next session should begin the first real desktop feature (vault loading / file tree) or add Badge semantic color tokens — see Next Up.

## Done

- **Monorepo Scaffolding**: Configured pnpm workspace, Turborepo pipeline, tsconfig path aliases, and ESLint boundary rules.
- **Local Hooks**: Configured Husky, `lint-staged`, and `commitlint` (Conventional Commits).
- **CI Pipeline**: Configured GitHub Actions workflow running lint, typecheck, test, build, and Storybook build via Turbo affected filter. Verified both passing and failing PR flows.
- **PR Template & Conventions**: Created `.github/PULL_REQUEST_TEMPLATE.md` and `CONTRIBUTING.md`.
- **Changesets**: Configured `@changesets/cli` tracking `packages/*` and ignoring apps/services.
- **Design System — Phase 1 (Tokens)**: Style Dictionary pipeline outputs SCSS vars, CSS custom properties, and typed TS constants from token source files (color, type, space, border, motion, icon). Separate `--font-ui` and `--font-editor` tokens.
- **Design System — Phase 2 (Foundation)**: CSS reset, global styles, mixins (border-depth, focus-visible, breakpoints). Stylelint configured with `color-no-hex` rule (ignores `tokens/dist/`).
- **Design System — Phase 3 (Primitives)**: All 12 primitives built and verified (lint, 40 unit tests, Storybook build):

| Primitive | Component + SCSS | Stories (variants/states) | Play fn | Unit tests | TSDoc | Radix |
|---|---|---|---|---|---|---|
| Typography | ✓ | ✓ | ✓ | ✓ | ✓ | Slot |
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | Slot |
| Input | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Checkbox | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Radio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Toggle | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Divider | ✓ | ✓ | ✓ | ✓ | ✓ | Separator |
| Badge | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Tooltip | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dialog | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DropdownMenu | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Popover | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Storybook 10 alignment**: Removed deprecated `@storybook/addon-essentials` (merged into core in SB 10); interaction tests use `storybook/test`. `build-storybook` verified passing.
- **Root `.gitignore`**: Monorepo-wide ignore rules for Node/pnpm, build output, Tauri/Rust, mobile artifacts, local vaults/DBs, secrets, Storybook, test coverage, and editor cruft. Decisions: ignore Tauri `gen/` (regenerate locally/CI); commit Style Dictionary `tokens/dist/` (reviewable diffs). See `DECISIONS.md`.
- **Desktop App Shell (`apps/desktop`)**: Tauri v2 + React 19 + Vite 7 scaffold integrated into the monorepo.
  - Frontend imports `@app/design-system` (Typography + Button) and `@app/core-types` via workspace protocol; global token CSS + SCSS modules render correctly in dev webview (verified visually — Obsidian dark bg `#1e1e1e`, accent button `#7f6df2`, system UI font stack matches Storybook).
  - `src-tauri/` follows `.gitignore` rules (`target/` ignored, `Cargo.lock` tracked). Plugins pre-installed: `tauri-plugin-fs` (with `watch`), `tauri-plugin-sql` (sqlite), `tauri-plugin-log` (debug only).
  - Turbo `build` depends on upstream `^build` (design-system, core-types cached). CI picks up desktop via existing `--filter=...[origin/main]` — no workflow changes needed.
  - **Baseline bundle sizes** (shell only, macOS aarch64, 2026-08-02):
    - Vite JS: **317 KB** raw / **100 KB** gzip (⚠️ barrel import from `@app/design-system` pulls all 12 primitives + Radix — see Blocked)
    - Vite CSS: **26 KB** raw / **4 KB** gzip
    - Native `.app`: **14 MB** on disk
    - DMG installer: **4.8 MB**
  - **Dev startup**: Vite ready ~145 ms; first `tauri dev` Rust compile ~76 s (subsequent runs use debug cache). `pnpm turbo run dev --filter=@app/desktop` verified launching window.

## In Progress

_(nothing)_

## Next Up (in order)

1. **Confirm bundle identifier** — provisional `com.davinci.notes` in `tauri.conf.json`; replace if you have a preferred ID (see `DECISIONS.md`)
2. Begin first desktop feature: vault folder picker + file tree shell (no editor yet)
3. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`)
4. Fix design-system barrel tree-shaking (317 KB JS for 2 components is too heavy — add `package.json` exports / subpath imports before feature work adds more UI)
5. Set up Chromatic or Playwright screenshot regression for `components/`
6. Composed patterns: file tree item, sidebar section, command palette row
7. Migrate SCSS `@import` to `@use` (Dart Sass 3.0 deprecation warnings in build output)

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — needs owner confirmation before distribution.
- **Badge success/warning colors**: Placeholder raw hex in `Badge.module.scss` — need confirmed Obsidian semantic palette values or new token entries.
- **Design-system barrel bundle bloat**: Importing `{ Button, Typography }` from `@app/design-system` index currently bundles all 12 primitives (~317 KB JS). Need subpath exports or per-component entry points before adding more UI.
- **Visual regression**: Chromatic account or Playwright screenshot CI not yet configured.

## Session Log

| Date | Focus | Outcome |
|---|---|---|
| 2026-08-01 | Git Workflow, Hooks, CI & Changesets | Configured Husky, commitlint, lint-staged, GitHub Actions CI workflow, PR templates, CONTRIBUTING.md, and Changesets. All verified. |
| 2026-08-02 | Design system primitives wrap-up | Added Storybook play functions for all primitives, fixed lint error, aligned Storybook 10 deps (removed addon-essentials), verified lint/test/build-storybook. All 12 primitives complete against checklist. |
| 2026-08-02 | Root `.gitignore` | Added monorepo `.gitignore` with section headers. Tauri `gen/` ignored; Style Dictionary `tokens/dist/` committed. Flagged previously tracked `.turbo/` cache for manual untrack review. |
| 2026-08-02 | Desktop app shell scaffolding | Replaced `apps/desktop` placeholder with Tauri v2 + React + Vite app. Wired design-system shell, monorepo build/lint/typecheck/test, Rust plugins baseline. Verified dev + release build on macOS. Documented bundle size baseline. |
