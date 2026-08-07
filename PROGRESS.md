# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code.

---

## Current Focus

Phase 5 (vault loading & file I/O) is complete. Next session: **Phase 6 — editor integration** (CodeMirror 6, debounced save/reindex).

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
- **Phase 4 — Core Data Layer (`packages/core-types`, `packages/indexer`)**: Platform-agnostic types + parsers + graph index + SQLite schema (not wired to UI or vault I/O yet).
  - **`@app/core-types`**: `Note`, `Link`, `Vault`, `Frontmatter` interfaces (dependency-free, types only). One interface per file + barrel export.
  - **`@app/indexer`**: `parseLinks` (wikilinks, aliases, `#heading`, `#^block-id`, markdown relative links, unresolved links, code-region masking), `parseFrontmatter` (YAML via `yaml`), `buildGraph` + `updateGraphForNote` (incremental edge/backlink updates), `schema.sql`.
  - **Rust**: `apps/desktop/src-tauri/src/db.rs` registers migration v1 from `packages/indexer/schema.sql`; `tauri.conf.json` preloads `sqlite:vault-index.db`. `cargo check` verified.
  - **Tests** (Vitest, Node): **14 tests** in `@app/indexer` — 9× `parseLinks`, 3× `parseFrontmatter`, 2× `buildGraph` (full vault fixture + incremental update). Realistic fixture vault under `packages/indexer/fixtures/`. `@app/core-types` has no logic tests (types only).
  - **Verified**: `pnpm turbo run test lint typecheck --filter=@app/indexer --filter=@app/core-types` passing.
- **Phase 5 — Vault Loading & File I/O (`apps/desktop`)**: Rust fs commands + debounced watcher + JS indexer bridge + SQLite persistence. No file tree or editor UI yet — verified via debug buttons/console.
  - **Rust I/O** (`fs.rs`): `open_vault` (folder picker via `tauri-plugin-dialog`), `list_notes`, `get_file_tree`, `read_note`, `write_note`. Vault-scoped path validation; no parsing in Rust.
  - **File watcher** (`watcher.rs`): `notify-debouncer-full` with **400 ms** debounce; emits `vault-changed` Tauri event with batched `changed` / `removed` path lists.
  - **SQLite**: Schema unchanged (`packages/indexer/schema.sql` via `db.rs` migration). Frontend `sqliteIndex.ts` upserts notes/links through `@tauri-apps/plugin-sql`.
  - **Indexer bridge** (`apps/desktop/src/vault/`): `@app/indexer` runs in the webview — `noteFromMarkdown` → full index on vault open, incremental `reconcileVaultChanges` on watcher batches. Decision logged in `DECISIONS.md`.
  - **IPC surface**: `openVault`, `getFileTree`, `readNote`, `writeNote`, `subscribeVaultChanges` (barrel `vault/index.ts`).
  - **Debug verification** (`App.tsx`): buttons open fixture vault, 350-note large fixture, or folder picker; logs index timing + backlink spot-check (`projects/alpha.md` ← `projects/beta-overview.md`).
  - **Indexing baseline** (350-note generated vault, macOS, 2026-08-06):
    - Parse + graph (`pnpm --filter @app/indexer benchmark:large-vault`): **41 ms**
    - Full open + index via Tauri (includes sequential IPC reads + SQLite writes): use **“Index large fixture (350 notes)”** debug button to measure locally — expect low hundreds of ms on desktop; track regressions against this.
  - **Verified**: Phase 4 tests still passing; `cargo check` clean; `@app/desktop` lint + typecheck clean.

## In Progress

_(nothing)_

## Next Up (in order)

1. **Phase 6 — Editor integration**: CodeMirror 6, live-preview decorations, wikilink autocomplete, debounced save-to-disk + reindex.
2. **Confirm bundle identifier** — provisional `com.davinci.notes` in `tauri.conf.json`; replace if you have a preferred ID (see `DECISIONS.md`).
3. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`).
4. Fix design-system barrel tree-shaking (317 KB JS for 2 components is too heavy — add `package.json` exports / subpath imports before feature work adds more UI).
5. Set up Chromatic or Playwright screenshot regression for `components/`.
6. Composed patterns: file tree item, sidebar section, command palette row.
7. Migrate SCSS `@import` to `@use` (Dart Sass 3.0 deprecation warnings in build output).

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
| 2026-08-05 | Phase 4 — core data layer | Implemented `@app/core-types` + `@app/indexer` (parsers, graph builder, schema.sql, Rust db migration wiring). 14 unit tests passing; lint/typecheck clean. No UI/Tauri indexer integration yet — Phase 5 next. |
| 2026-08-06 | Phase 5 — vault loading & file I/O | Rust fs/watcher commands, JS `@app/indexer` bridge + SQLite persistence, debounced `vault-changed` events, debug verification UI. Indexing baseline: 350 notes / 41 ms parse+graph. Phase 6 (editor) next. |
