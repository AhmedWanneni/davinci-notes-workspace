# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code.

---

## Current Focus

Phase 13 (Release Prep & Release Candidate 1) is complete. Next up: **Dogfooding `v0.1.0-rc.1` internal build** & Design System follow-ups.

## Done

- **Phase 13 — Staging Deploy & Release Candidate 1**:
  - **Staging Deploy Channel**: Configured GitHub Actions workflow `.github/workflows/staging-release.yml` with multi-platform matrix (`macos-latest`, `ubuntu-22.04`, `windows-latest`), secret wiring for Apple Developer ID / Windows Authenticode code signing & notarization, and automatic staging channel distribution artifacts on merge to `main`.
  - **Changesets First Version Bump**: Reconstructed changesets for Phases 1–12 across `@app/design-system`, `@app/core-types`, `@app/indexer`, `@app/editor`, and `@app/sync-client`. Ran `pnpm changeset version` bumping all packages to `0.1.0` and generating comprehensive `CHANGELOG.md` files. Synchronized `@app/desktop` version to `0.1.0`.
  - **Release Candidate Tag & Native Artifacts**: Cut git tag `v0.1.0-rc.1`. Built standalone macOS release bundle (`DaVinci Notes.app` 15.6 MB binary) and native installer (`DaVinci Notes_0.1.0_aarch64.dmg` 5.5 MB).
  - **Release Notes**: Created internal release documentation in `docs/releases/v0.1.0-rc.1.md` outlining implemented capabilities (Vault I/O, CodeMirror 6 live-preview, wikilinks, backlinks, Cmd+K quick switcher, D3 force graph, SQLite settings, virtualized tree), out-of-scope items (mobile, sync, plugins, light theme), and operational notes (ad-hoc signing Gatekeeper notice, provisional bundle ID).
  - **Packaged App Verification**: Verified full standalone release application startup, webview runtime initialization, bundle size gates (<177 KB entry JS, <29 KB total CSS), and 31/31 passing workspace tasks.

## In Progress

_(nothing)_

## Next Up (in order)

1. **Dogfooding `v0.1.0-rc.1`**: Dogfood the internal RC build for daily note-taking workflows to evaluate usability and catch edge cases prior to wider distribution.
2. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`).
3. Set up Chromatic or Playwright screenshot regression for `components/`.
4. Composed patterns: file tree item, sidebar section, command palette row.
5. Migrate SCSS `@import` to `@use` (Dart Sass 3.0 deprecation warnings in build output).

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` in `tauri.conf.json` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex in `Badge.module.scss` — need confirmed Obsidian semantic palette values or new token entries.
- **Visual regression**: Chromatic account or Playwright screenshot CI not yet configured.

- **Monorepo Scaffolding**: Configured pnpm workspace, Turborepo pipeline, tsconfig path aliases, and ESLint boundary rules.
- **Local Hooks**: Configured Husky, `lint-staged`, and `commitlint` (Conventional Commits).
- **CI Pipeline**: Configured GitHub Actions workflow running lint, typecheck, test, build, Storybook build, and desktop bundle size check via Turbo affected filter. Verified both passing and failing PR flows.
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
  - Frontend imports `@app/design-system` and `@app/core-types` via workspace protocol; global token CSS + SCSS modules render correctly in dev webview.
  - `src-tauri/` follows `.gitignore` rules (`target/` ignored, `Cargo.lock` tracked). Plugins pre-installed: `tauri-plugin-fs` (with `watch`), `tauri-plugin-sql` (sqlite), `tauri-plugin-log` (debug only).
  - Turbo `build` depends on upstream `^build` (design-system, core-types cached).
- **Phase 4 — Core Data Layer (`packages/core-types`, `packages/indexer`)**: Platform-agnostic types + parsers + graph index + SQLite schema (not wired to UI or vault I/O yet).
- **Phase 5 — Vault Loading & File I/O (`apps/desktop`)**: Rust fs commands + debounced watcher + JS indexer bridge + SQLite persistence.
- **Phase 6 — Editor Integration (`packages/editor`, `apps/desktop`)**: CodeMirror 6 editor wrapper with live preview, custom syntax highlighting, wikilink parsing, autocomplete, state stores, and debounced saving.
- **Phase 7 — File Tree / Sidebar**: Virtualized file tree navigation using `@tanstack/react-virtual`. Synchronous JS tree building from `allNotePaths` to avoid IPC overhead. Tree build time (350 notes): ~8 ms. Flatten time: ~0.4 ms.
- **Phase 8 — Backlinks Panel**: Fast indexed query over SQLite `links` table using `idx_links_target`, right sidebar UI panel with design-system typography and highlight `<mark>` tags, live updates synchronized with watcher reconciliation & Zustand save triggers, and navigation backlink clicking.
- **Phase 9 — Search / Quick Switcher**: Keyboard-driven (Cmd/Ctrl+K) quick switcher utilizing `fuzzysort` for extremely fast, fuzzy title matching. Instant filtering, search highlights, and tiebreaker recency sorting based on open tabs. Built with Radix UI Dialog primitive for focus trapping.
- **Phase 10 — Graph View**: Built `GraphView` utilizing `d3-force` and SVG rendering to satisfy performance targets and strict design-system CSS-variable styling. Local Graph automatically adapts to active note. Global Graph implemented with strict node-capping strategy (top 200 nodes by degree) to prevent DOM choking. Added `queryFullGraphIndex` to SQLite bridge. Tested smooth 60fps pan/zoom interactions.
- **Phase 11 — Settings & Polish**: Created a unified `EmptyState` primitive and applied it consistently across the app (Vault Open, Indexing, Editor, Backlinks, Command Palette, Graph View). Added a `SettingsDialog` supporting font selection and vault switching. Settings are persisted via a new `settings` SQLite table. *Light theme toggles are intentionally excluded as out-of-scope until light tokens exist.*
- **SQLite Lock Fix & Vault Indexing Batching (Mid-Iteration Fix)**: Diagnosed and resolved SQLite `SQLITE_BUSY: database is locked` error during vault opening/indexing via WAL mode & `synchronous=NORMAL` executed at connection time and 50-item bulk SQL batching.
- **Phase 12 — Performance Audit Checkpoint**: Complete audit against baselines and `PERFORMANCE.md`'s 10 hard rules across the entire app.
  - **Audit Findings & Fixes**:
    - **Initial JS Bundle & Lazy-Loading**: Pre-audit entry chunk was 1,110 KB raw / 368 KB gzip (monolithic, non-code-split). Implemented `React.lazy` and `Suspense` for `GlobalGraphDialog`, `SettingsDialog`, `CommandPalette`, and `LocalGraphPanel`, splitting D3 (`101 KB`), CommandPalette (`11 KB`), and Settings (`14 KB`) out of the initial paint bundle. Reduced initial entry chunk to **176.9 KB raw / 55.8 KB gzip** (and `0.87 KB` shell entry).
    - **State Subscriptions (Rule 6)**: Eliminated whole-store `useWorkspaceStore()` subscriptions across `App.tsx`, `BacklinksPanel.tsx`, `CommandPalette.tsx`, and `SettingsDialog.tsx`, converting to scoped selectors to prevent UI-wide re-renders.
    - **Typing Latency Keystroke Leak (Rule 2)**: Removed `notesContent` from `BacklinksPanel` `useEffect` dependencies. Backlinks query now runs only on active path change or save/indexer/watcher update (`vaultUpdateCounter`), completely eliminating per-keystroke SQLite queries.
    - **Memory & Startup Redundancy (Rule 3)**: Fixed `initializeVault` in `useWorkspaceStore.ts` which redundantly re-read and parsed all 350 files over IPC on vault open; `initializeVault` now simply sets paths and optional pre-queried SQLite graph. Updated `closeNote` to evict closed note content from memory.
    - **File Structure & Hard Line Cap (AGENTS.md)**: Split `App.tsx` (previously 501 lines) into focused, single-responsibility subcomponents (`VaultWelcomeView`, `AppSidebar`, `AppTabs`, `EditorArea`, `RightSidebar`, `useVaultSession`), bringing every single file in the workspace well below the 250-line hard cap (all < 235 lines).
    - **Enforced CI Size-Limit Gating**: Created `scripts/check-bundle-size.mjs`, wired `check:bundle-size` into `package.json` and `.github/workflows/ci.yml`. Verified that deliberate budget breaches fail CI and verified passing on current optimized build.

### Baseline Audit Comparison Table

| Metric | Phase Baseline | Pre-Audit (Phase 11) | Fix Applied | Post-Audit Final | Status |
|---|---|---|---|---|---|
| **Startup / Initial JS Bundle** | Phase 3: 317 KB raw / 100 KB gzip | 1,110.20 KB raw / 367.74 KB gzip (no lazy-loading) | Lazy-loaded dialogs & D3 graph (`React.lazy`), manual vendor chunking | **176.93 KB raw / 55.82 KB gzip** (Entry) + vendor chunks | **Improved (5x smaller entry)** |
| **Vault Indexing (350 notes)** | Phase 5 + WAL: 41ms parse+graph, <15ms SQLite batch | 41ms parse+graph, ~12ms SQLite; redundant full re-read in store init (~280ms) | Removed redundant file re-reading in `useWorkspaceStore.initializeVault` | **36ms parse+graph, <15ms SQLite batch write, 0ms redundant reads** | **Improved** |
| **Typing Latency** | Phase 6: 3.96 ms avg per keystroke (Target: <16 ms) | Pure CM6: 3.944 ms; but Backlinks triggered SQLite queries per keystroke | Scoped Zustand selectors, removed `notesContent` from `BacklinksPanel` effect | **3.979 ms pure CM6; 0 SQLite queries during typing** | **Held** |
| **File Tree Scroll** | Phase 7: Tree build ~8ms, flatten ~0.4ms | Tree build ~6ms, flatten ~0.3ms, virtualized with `@tanstack/react-virtual` | Maintained `@tanstack/react-virtual` with isolated `AppSidebar` | **Tree build ~6ms, flatten ~0.3ms, 60fps virtualized scroll** | **Held** |
| **Graph View Render** | Phase 10: 200-node cap, D3 force + SVG, 60fps | Top 200 nodes capped by degree, D3 zoom & pan | Code-split GraphView and LocalGraphPanel from initial bundle | **Top 200 nodes capped, lazy-loaded on demand, 60fps pan/zoom** | **Held** |

- **CSS Modules → CUBE CSS Migration (`apps/desktop`)**: Fully migrated desktop application from scoped CSS Modules to CUBE CSS architecture with structured layers (`base/`, `layout/`, `components/`, `utilities/`, `lib/`, and `_main.scss`).
  - Added zero-dependency, type-safe `cn()` helper (`src/styles/cn.ts`).
  - Strict BEM class naming with Stylelint `selector-class-pattern` automated enforcement for `components/` blocks.
  - Radix exceptions converted to clean `data-*` attributes (`data-state`, `data-active`, `data-size`, `data-selected`).
  - All token references unified directly to `@app/design-system` canonical CSS custom properties (`--color-bg-primary`, `--color-border-subtle`, `--space-*`, etc.).
  - Gzipped total CSS reduced from **8.05 KB to 6.60 KB** (18% reduction); typing latency held at **4.026 ms**; all 24 tests and lint passing.

## In Progress

_(nothing)_

## Next Up (in order)

1. **Phase 13 — Release Prep**: Final packaging, distribution artifacts, App Store / notarization checks, provisional bundle identifier confirmation (`com.davinci.notes`).
2. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`).
3. Set up Chromatic or Playwright screenshot regression for `components/`.
4. Composed patterns: file tree item, sidebar section, command palette row.
5. Migrate SCSS `@import` to `@use` (Dart Sass 3.0 deprecation warnings in build output).

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` in `tauri.conf.json` — confirm before distribution (Phase 13).
- **Badge success/warning colors**: Placeholder raw hex in `Badge.module.scss` — need confirmed Obsidian semantic palette values or new token entries.
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
| 2026-08-07 | Phase 6 — Editor Integration | Standalone CodeMirror 6 package `@app/editor` with live preview, autocomplete, wikilink parsing, and Zustand tab store with 750ms debounced saving. Typing latency baseline: 3.96 ms. All tests passing. |
| 2026-08-07 | Phase 7 — File Tree / Sidebar | Virtualized file tree navigation using `@tanstack/react-virtual`. Synchronous JS tree building from `allNotePaths` to avoid IPC overhead. Tree build time (350 notes): ~8 ms. Flatten time: ~0.4 ms. |
| 2026-08-07 | Phase 8 — Backlinks Panel | Implemented BacklinksPanel right sidebar querying SQLite target index, on-demand snippet extraction with link text highlighting, reactive live updates on watcher/save, and active note switching navigation. |
| 2026-08-07 | Phase 9 — Search / Quick Switcher | Built `CommandPalette` modal (Cmd+K) using Radix Dialog and `fuzzysort` for fast fuzzy-matching by note title. Implemented arrow navigation, highlighted match characters, and seamless creation of new notes when no matches exist. |
| 2026-08-07 | Phase 10 — Graph View | Built `GraphView` utilizing `d3-force` and SVG rendering to satisfy performance targets and strict design-system CSS-variable styling. Local Graph automatically adapts to active note. Global Graph implemented with strict node-capping strategy (top 200 nodes by degree) to prevent DOM choking. Added `queryFullGraphIndex` to SQLite bridge. Tested smooth 60fps pan/zoom interactions. |
| 2026-08-07 | Phase 10 — Bug Fixes | Fixed graph clipping bug caused by synchronous `clientWidth` reads during `useEffect` mount on un-layouted components (dialogs/sidebars). Swapped to `ResizeObserver` to center the D3 simulation correctly once real DOM pixels are available. Added missing SVG `<text>` elements for node labels, utilizing `var(--font-ui)` typography tokens. |
| 2026-08-07 | Phase 11 — Settings & Polish | Created unified `EmptyState` component applied consistently across the app. Built persistent `SettingsDialog` (Editor Font, Switch Vault) powered by a new `settings` SQLite table. Verified all empty, loading, and error states manually. Light theme excluded per architectural mandate. |
| 2026-08-08 | Dev Database Migration Fix | Diagnosed and fixed `tauri-plugin-sql` startup panic caused by modifying `packages/indexer/schema.sql` (migration 1) in Phase 11 after it was already applied. Deleted local dev SQLite db (`com.davinci.notes`) to allow a clean re-apply. Added strict "never edit an applied migration" rule to `AGENTS.md` and decided to stick with proper incremental migrations going forward now that foundational schema is stable. |
| 2026-08-13 | SQLite Lock Fix & Connection PRAGMAs | Resolved `SQLITE_BUSY: database is locked` via WAL mode & `synchronous=NORMAL` executed at DB connection time in `getVaultIndexDb()` (removed Migration v3 since PRAGMAs fail inside migration transactions). Implemented `persistNotesBatch` chunking (50 items/query). Reset local dev DB cleanly. Passed `verifyJournalMode` ('wal'), 10/10 repeated open/close cycles, and watcher boundary stress test. |
| 2026-08-13 | Phase 12 — Performance Audit Checkpoint | Complete audit against baselines and `PERFORMANCE.md` hard rules. Re-measured baselines; fixed whole-store Zustand subscriptions and BacklinksPanel typing leak; eliminated store init redundant full vault re-reading; implemented `React.lazy` code-splitting for non-critical dialogs and D3 graph views (cutting entry bundle from 1.11MB to 176.9KB raw / 55.8KB gzip); split `App.tsx` (501 lines -> subcomponents all < 200 lines); added `scripts/check-bundle-size.mjs` wired into CI and verified gating. All 24 tests and build passing. |
| 2026-08-13 | CSS Modules → CUBE CSS Migration | Migrated apps/desktop from CSS Modules to CUBE CSS (composition/utility/block/exception layers, BEM block naming, data-attributes for exception states, cn() bracket grouping, Stylelint BEM rule enforcement). Gzipped CSS reduced from 8.05 KB to 6.60 KB (-18%). Typing latency 4.026 ms held. All 24 tests passing. |
| 2026-08-14 | Dialog/Portal Styling Bug Fix | Diagnosed popup invisibility issue: DialogContent in packages/design-system had hardcoded literal string className="dialog-content" instead of using CSS module styles.dialogContent / styles["dialog-content"], leaving portal content unpositioned and rendered offscreen. Fixed className mapping in Dialog.tsx and Badge.tsx; removed redundant position:relative on [data-radix-portal]; verified all 12 design-system and 24 desktop test suites passing. |
| 2026-08-14 | Phase 13 — Release Prep & RC 1 | Configured GitHub Actions staging deploy workflow (`.github/workflows/staging-release.yml`) with signing/notarization secret hooks and multi-platform matrix. Reconstructed changesets for Phases 1–12 and ran `pnpm changeset version` bumping all workspace packages and desktop app to `0.1.0`. Tagged `v0.1.0-rc.1`, built native macOS release artifacts (`DaVinci Notes.app` 15.6MB, `.dmg` 5.5MB), authored internal release notes (`docs/releases/v0.1.0-rc.1.md`), and verified packaged app execution. |

