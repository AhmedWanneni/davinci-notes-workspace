# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code.

---

## Current Focus

**Canvas Feature Phase 4 (Selection & Arrangement)** is complete. Next up: **Canvas Feature Phase 5 — Groups & Framing**.

## Done

- **Canvas Feature: Phase 4 — Selection & Arrangement**:
  - **Selection Mechanics**: Fully verified and integrated single select, marquee drag-select (`selectionOnDrag={true}`, `SelectionMode.Partial`), Shift-click add/remove (`multiSelectionKeyCode="Shift"`), and Ctrl/Cmd+A select-all (with input field guard).
  - **Group Drag**: Multi-card drag moving selection as a single unified gesture with 24px grid snap and alignment guides.
  - **Duplicate Selection (`useCanvasSelectionOps.ts`)**: Duplicate single or multiple cards (via `⌘D` / `Ctrl+D` shortcut or context menu), generating unique IDs, offset by (+40px, +40px), cleanly preserving all internal edges connecting nodes inside the selection, and discarding crossing edges into/out of the selection.
  - **Alignment & Distribution (`arrangeNodes.ts`)**: Pure utility functions for left, right, top, bottom, horizontal center, and vertical center alignment, as well as equal horizontal and vertical spacing distribution (anchoring outer boundaries).
  - **Toolbar Controls & Tooltips**: Added alignment and distribution button groups to `CanvasControls.tsx` with dynamic count gating (2+ nodes for align, 3+ nodes for distribute) and descriptive tooltips explaining minimum selection requirements when disabled.
  - **Axis-Constrained Movement**: Shift key drag locks movement to the dominant axis (horizontal or vertical) after a 5px threshold.
  - **Modular Hook Architecture & Line Limits**: Refactored canvas interactions into modular hooks (`useCanvasContextMenu.ts`, `useCanvasSelectionOps.ts`, `useCanvasInteractions.ts`), keeping all source files strictly under the 250-line hard cap (all ≤ 238 lines).
  - **Persistence & Performance**: All multi-card operations update underlying `CanvasData` and leverage the existing 750ms debounced disk saving (`useWorkspaceStore.saveNoteNow`) with zero per-keystroke or per-frame I/O overhead.
  - **Test Suite**: 56 unit tests passing in `@app/canvas` across 12 test suites (added 14 pure unit tests in `arrangeNodes.test.ts`); all 32 workspace tasks passing.

- **Canvas Feature: Phase 2 — Text Cards**:
  - **Data Model Verification**: Confirmed Phase 0 `CanvasTextNode` (`id`, `x`, `y`, `width`, `height`, `text`, optional `color`) matches JSON Canvas 1.0 spec with no extensions added.
  - **Text Card Component (`TextCardNode.tsx`)**: Custom React Flow node with `NodeResizer` for corner/edge resize, body drag via React Flow's built-in handling, and distinct edit mode (double-click to edit, drag disabled while editing).
  - **Text Editing Approach**: Lightweight native `<textarea>` — not CodeMirror. Rationale: in-card fields are plain text only for this phase; pulling `@app/editor` (~CM6 bundle) into every text card would add meaningful weight and complexity for a small overlay field. CodeMirror remains the right choice for full note tabs (Phase 6).
  - **Create / Move / Resize / Delete**: Double-click empty canvas to create; toolbar "+" and right-click pane "Add text card" as secondary entry points; drag body to move; resize handles via `NodeResizer`; select + Delete/Backspace and right-click "Delete card"; all mutations update underlying `CanvasData` via existing translation layer.
  - **Snap-to-Grid & Alignment**: 24px grid snap on drag-stop and resize-end; custom alignment snap (`snapNodeAlignment.ts`) against other cards' edges/centers during drag (React Flow v12 has no built-in alignment guides).
  - **Persistence Fix**: Replaced Phase 1 stale-closure `setTimeout` persist with `applyNodeChanges`-based handlers + `lastSerializedRef` guard preventing store feedback loops during drag; visual updates remain immediate, disk write stays on existing 750ms debounced `updateNoteContent`/`saveNoteNow` path.
  - **Test Suite**: 30 tests in `@app/canvas` passing (added `TextCardNode`, `snapNodeAlignment`, `canvasConstants` tests; updated `CanvasView` tests for text card rendering).

- **Canvas Feature: Phase 1 — Canvas Shell**:
  - **Bidirectional Translation Layer (`packages/canvas/canvasTranslation.ts`)**: Built pure TypeScript translation functions (`jsonCanvasToReactFlow` and `reactFlowToJsonCanvas`) decoupling JSON Canvas schema from React Flow internal models. Validated 100% lossless round-trip fidelity via unit tests.
  - **React Flow Canvas Component (`CanvasView.tsx`)**: Mounted real React Flow instance with smooth space+drag & middle-click pan, ctrl/cmd+scroll zoom, pinch zoom, and zoom-to-fit toolbar control. Added empty state editorial UI hint when `nodes.length === 0`.
  - **Debounced Save / Load Integration**: Connected canvas state changes to `useWorkspaceStore` via `onContentChange`, automatically reusing the existing 750ms debounced disk saving workflow (`saveNoteNow`) for `.canvas` files.
  - **Native Vault Support & New Canvas Creation**: Updated Rust `fs.rs` and `watcher.rs` to index and watch `.canvas` files. Added `createNewCanvas` to `useVaultSession` and "New canvas" action button in `AppSidebar` writing valid initial `{ "nodes": [], "edges": [] }` files immediately.
  - **Bundle Audit & Lazy-Load Re-Verification**: Verified that `@app/canvas` and `@xyflow/react` remain in an asynchronous chunk (`vendor-canvas-*.js` 172 KB raw / 55.9 KB gzip) with **0 KB** footprint in initial entry JS. Initial entry JS remains well under budget at **21.08 KB raw / 7.71 KB gzip**.
  - **Test Suite**: All 22 tests in `@app/canvas` passing; all 109 tests across 14 workspace tasks passing with zero errors.

- **Canvas Feature: Phase 0 — Package Setup & Data Model**:
  - **Package Scaffolding (`packages/canvas` -> `@app/canvas`)**: Created workspace package holding data model, file I/O, and future React Flow components together (mirroring `design-system` and `editor`).
  - **JSON Canvas 1.0 Spec Compliance**: Defined strict TypeScript models matching `jsoncanvas.org/spec/1.0/` for `CanvasData`, `CanvasNode` (`text`, `file`, `link`, `group` variants), `CanvasEdge` (directional endpoints, sides, colors, labels), and `CanvasColor` (presets "1".."6" and `#...` hex strings).
  - **Parsers, Serializers & Validators**: Pure functions `parseCanvas`, `serializeCanvas`, `validateCanvas` with comprehensive schema validation. Hand-crafted realistic spec-compliant fixtures (`basic.canvas`, `complex.canvas`).
  - **File I/O Round-Trip**: Built `canvasIO.ts` (`readCanvasFile`, `writeCanvasFile`) with pluggable filesystem adapters (dynamic Node `fs/promises` for test/tools and Tauri IPC bridge for desktop). Tested disk round-trip writing `CanvasData` to temp file and verifying exact structural equality on read-back.
  - **Boundary Enforcement**: Configured `eslint-plugin-boundaries` for `canvas` element (`packages/canvas/**/*`, `mode: "full"`). Restricted dependencies to `@app/core-types` and `@app/design-system` only. Tested and verified boundary violation failure using a throwaway import, then cleaned up.
  - **Dependency Addition (`@xyflow/react`)**: Added `@xyflow/react` (^12.4.4) to `packages/canvas` (54.8 KB min+gzip).
  - **Lazy-Load Verification & Bundle Audit**: Established `React.lazy` dynamic import boundary in `EditorArea.tsx` for `.canvas` files. Configured Vite vendor chunking. Verified via `scripts/check-bundle-size.mjs`: initial entry JS chunk holds at **21.08 KB raw / 7.71 KB gzip** with **0 KB** canvas code in the initial bundle; async canvas chunk is **4.39 KB raw / 1.46 KB gzip**.
  - **Test Suite**: 4 test files (18 unit tests) in `@app/canvas` passing; all 105 tests across 14 workspace tasks passing.

- **Obsidian App Shell Layout Restructure**:
  - **CSS Grid App Shell**: Migrated desktop shell to full CSS Grid (`grid-template-rows: auto 1fr auto;` and middle body `grid-template-columns: 40px auto 1fr auto;`), avoiding nested flexbox chains.
  - **DOM State Preservation on Collapse**: Both left (File Explorer) and right sidebars toggle via `data-collapsed="true"` setting width to 0 with `overflow: hidden`, preserving scroll position, expanded tree state, and editor selections without unmounting.
  - **Top Tab Bar (`AppTabs`)**: Added `+` new tab action, right-sidebar toggle icon, and view options action. Fully wired to multi-note state in `useWorkspaceStore`.
  - **Icon Rail (`IconRail`)**: Vertical ~40px icon strip providing single navigation entry points for Files, Search (Cmd+K), Global Graph, Daily Notes (`YYYY-MM-DD.md`), Settings, and Close Vault with Radix Tooltips.
  - **File Tree (`AppSidebar`)**: Refactored to act as a collapsible sidebar alongside the Icon Rail with vault header, new note affordance, and virtualized `FileTree`.
  - **Properties Block (`PropertiesBlock`)**: Positioned above note body in `EditorArea`. Renders parsed YAML frontmatter (`tags` as `#tag` badges, `[[wikilinks]]`, dates, authors) with collapsible accordion and "+ Add property" placeholder affordance.
  - **Stacked Right Sidebar (`RightSidebar`)**: Stacked Linked Mentions (`BacklinksPanel`), Unlinked Mentions section, Note Outline (`NoteOutline` scanning H1–H6), and Local Graph (`LocalGraphPanel`).
  - **Status Bar (`StatusBar`)**: Full-width thin bottom bar with live note stats (backlink count, property count, word count, character count) and vault connection indicator.
  - **Bundle & Test Verification**: All 12 test suites (33 unit tests) passing; initial entry bundle holds at <22 KB raw / <8 KB gzip (total JS <1.09 MB raw / <359 KB gzip); bundle size budget gates verified.

- **Phase 13 — Staging Deploy & Release Candidate 1**:
  - **Staging Deploy Channel**: Configured GitHub Actions workflow `.github/workflows/staging-release.yml` with multi-platform matrix (`macos-latest`, `ubuntu-22.04`, `windows-latest`), secret wiring for Apple Developer ID / Windows Authenticode code signing & notarization, and automatic staging channel distribution artifacts on merge to `main`.
  - **Changesets First Version Bump**: Reconstructed changesets for Phases 1–12 across `@app/design-system`, `@app/core-types`, `@app/indexer`, `@app/editor`, and `@app/sync-client`. Ran `pnpm changeset version` bumping all packages to `0.1.0` and generating comprehensive `CHANGELOG.md` files. Synchronized `@app/desktop` version to `0.1.0`.
  - **Release Candidate Tag & Native Artifacts**: Cut git tag `v0.1.0-rc.1`. Built standalone macOS release bundle (`DaVinci Notes.app` 15.6 MB binary) and native installer (`DaVinci Notes_0.1.0_aarch64.dmg` 5.5 MB).
  - **Release Notes**: Created internal release documentation in `docs/releases/v0.1.0-rc.1.md` outlining implemented capabilities (Vault I/O, CodeMirror 6 live-preview, wikilinks, backlinks, Cmd+K quick switcher, D3 force graph, SQLite settings, virtualized tree), out-of-scope items (mobile, sync, plugins, light theme), and operational notes (ad-hoc signing Gatekeeper notice, provisional bundle ID).
  - **Packaged App Verification**: Verified full standalone release application startup, webview runtime initialization, bundle size gates (<177 KB entry JS, <29 KB total CSS), and 31/31 passing workspace tasks.

## In Progress

_(nothing)_

## Next Up & Identified Gaps (in order)

1. **Dogfooding `v0.1.0-rc.1`**: Dogfood the internal RC build for daily note-taking workflows to evaluate usability and catch edge cases prior to wider distribution.
2. **Unlinked Mentions Detection (Identified Gap)**: Implement vault-wide text scanner (or FTS query) to discover plain-text mentions of the active note's title without formal `[[wikilinks]]`.
3. **Inline Property Editing (Identified Gap)**: Implement interactive property adding and value editing in `PropertiesBlock` with automatic frontmatter serialization to disk.
4. **Outline Scroll Synchronization (Identified Gap)**: Connect `NoteOutline` heading clicks directly to CodeMirror 6 scroll/cursor dispatch.
5. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`).
6. Set up Chromatic or Playwright screenshot regression for `components/`.
7. Composed patterns: file tree item, sidebar section, command palette row.
8. Migrate SCSS `@import` to `@use` (Dart Sass 3.0 deprecation warnings in build output).

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
| 2026-08-14 | Obsidian App Shell Restructure | Restructured apps/desktop shell into CSS Grid architecture matching wireframe.md (Top Tab Bar with new tab/sidebar toggle, Icon Rail navigation strip, collapsible File Tree, PropertiesBlock frontmatter accordion, stacked RightSidebar with Linked Mentions, Unlinked Mentions placeholder, NoteOutline H1-H6, and bottom StatusBar with live note stats). Added unit tests; all 33 tests and bundle size budgets passing. |
| 2026-08-14 | Canvas Feature Phase 0 — Package & Data Model | Scaffolded `@app/canvas` with strict JSON Canvas 1.0 specification models, parser, serializer, validator, and pluggable file I/O with verified disk round-trip testing. Enforced architectural boundaries with ESLint and verified failure. Configured `@xyflow/react` and verified zero initial bundle impact via dynamic lazy-load route and bundle audit (initial entry JS holds at 21.08 KB raw / 7.71 KB gzip). All 18 unit tests passing. |
| 2026-08-14 | Canvas Feature Phase 3 — Connections | Implemented edge system: connection handles on 4 sides, drag-to-connect, endpoint reconnection, token-constrained color palette, inline midpoint label editing, cascade node deletion cleanup, and debounced 750ms persistence. 42 canvas tests passing. |
| 2026-08-14 | Canvas Feature Phase 4 — Selection & Arrangement | Implemented multi-card selection (click, marquee drag, Shift-click, Cmd+A), unified group drag, axis-constrained drag (Shift lock), duplicate selection (Cmd+D / context menu) preserving internal edges, and alignment/distribution (left/right/top/bottom/center + spread). Refactored hooks into modular units to satisfy the 250-line hard cap. 56 canvas tests passing; 32/32 workspace tasks passing. |
| 2026-08-14 | Canvas Feature Phase 2 — Text Cards | Implemented text card lifecycle: create (double-click/toolbar/right-click), move, resize (NodeResizer), edit (native textarea), delete (keyboard + context menu), snap-to-grid + alignment guides, and debounced 750ms store mechanism. Fixed stale-closure persist bug from Phase 1. 30 canvas tests passing. |
| 2026-08-14 | Canvas Feature Phase 1 — Canvas Shell | Implemented lossless bidirectional translation layer (`canvasTranslation.ts`), real React Flow empty canvas shell (`CanvasView.tsx`) with space+drag & middle-click pan, ctrl/cmd+scroll & pinch zoom, fitView controls, empty state hint, and 750ms debounced disk saving. Updated Rust fs/watcher to support `.canvas` files and added new canvas creation affordance. Re-verified bundle isolation (initial entry JS 21.08 KB raw / 7.71 KB gzip, 0 KB canvas footprint in initial entry). All 22 canvas unit tests and 109 monorepo tests passing. |
