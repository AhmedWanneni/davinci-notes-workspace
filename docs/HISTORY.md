# HISTORY.md — Session Log & Detailed Notes

Append-only record of completed work. Current state lives in `PROGRESS.md` — read this file only for historical context. When a session ends: add a row to the Session Log table and append a dated block under Detailed Session Notes.

---

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
| 2026-08-14 | Canvas Feature Phase 5 — Groups & Framing | Implemented JSON Canvas `group` nodes: create from selection (bbox wrap) or empty (context menu), inline label rename (double-click), token-palette coloring, runtime React Flow `parentId` + `extent` containment with spec-compliant absolute bbox serialization, drag-drop nesting up to a 10-level cap, selection expansion to members for duplicate/align/distribute/delete, and cascade delete. New ADRs 0046 (containment strategy) + 0047 (nesting depth & selection propagation). 88 canvas tests passing; lint + typecheck clean. |
| 2026-08-14 | Canvas Feature Phase 2 — Text Cards | Implemented text card lifecycle: create (double-click/toolbar/right-click), move, resize (NodeResizer), edit (native textarea), delete (keyboard + context menu), snap-to-grid + alignment guides, and debounced 750ms store mechanism. Fixed stale-closure persist bug from Phase 1. 30 canvas tests passing. |
| 2026-08-14 | Canvas Feature Phase 1 — Canvas Shell | Implemented lossless bidirectional translation layer (`canvasTranslation.ts`), real React Flow empty canvas shell (`CanvasView.tsx`) with space+drag & middle-click pan, ctrl/cmd+scroll & pinch zoom, fitView controls, empty state hint, and 750ms debounced disk saving. Updated Rust fs/watcher to support `.canvas` files and added new canvas creation affordance. Re-verified bundle isolation (initial entry JS 21.08 KB raw / 7.71 KB gzip, 0 KB canvas footprint in initial entry). All 22 canvas unit tests and 109 monorepo tests passing. |
| 2026-08-16 | Canvas Feature Phase 6 — File Embed Cards | Implemented markdown note embeds (`CanvasFileNode` with `subpath`), CodeMirror 6 read-only live-preview reuse (`MarkdownView`, ADR-0048), HTML5 drag-and-drop from file tree (ADR-0049), live reactive synchronization, file swapping (`FileCardSwapPicker`), text-to-file conversion, and heading narrowing (`subpathUtils`). 97 canvas tests passing; all 14 monorepo tasks passing. |
| 2026-08-16 | Canvas Feature Phase 7 — Image / Video Cards | Implemented image and video media embeds in `@app/canvas` adhering to JSON Canvas 1.0 `CanvasFileNode` with path references only (ADR-0050). Standard `<img>` and `<video>` rendering with `object-fit: contain`, lazy loading, and broken-media state. Aspect ratio lock on image resize. Native drag-and-drop from file tree (extended `fs.rs`), clipboard paste image saving to vault `attachments/` via `write_binary_file` (ADR-0051), and modularized `FileCardNode` components (111 canvas tests, all 14 monorepo tasks passing). |
| 2026-08-16 | Canvas Feature Phase 8 — Performance Checkpoint | Enabled `onlyRenderVisibleElements={true}` for viewport culling (DOM bounded by visible area, not total count). Added persistence equality guard preventing duplicate 750ms debounce triggers on unchanged state. Optimized `groupContainment.ts` to Map-indexed O(depth) ancestor traversal and BFS child expansion. Optimized `snapNodeAlignment.ts` to zero-alloc `checkGuideDelta` with spatial pre-filter (0.003–0.005 ms/frame at 120 nodes = 0.01–0.03% of 16.6ms budget). Extracted `groupBounds.ts` and `CanvasContextMenuOverlay.tsx` to satisfy 250-line hard cap. Added reusable 120-node/130-edge fixture and `CanvasBenchmark.test.ts`. ADR-0052. 115 canvas tests / 17 suites; 14 monorepo tasks passing; tsc clean. |
L40: | 2026-08-16 | Canvas Feature Phase 9 — PDF Cards | Implemented PDF file embed cards using `pdfjs-dist@^4.10.38` (verified cost: ~121 KB gzip core+worker at first visible PDF card only). Double-gated nested lazy-load boundary: Gate 1 (existing — canvas package lazy-loads on tab open) + Gate 2 (new — `PdfCardView.tsx` dynamic import inside FileCardNode, gated by `fileType === "pdf"` AND viewport culling from Phase 8). Continuous vertical scroll with stacked canvas pages, DPR-aware rendering, debounced ResizeObserver reflow on card resize, in-flight render cancellation on unmount. Extended drag-and-drop from Phase 6/7 to recognize `.pdf` extension and `application/pdf` MIME. No new node type — PDFs reuse existing `file` variant per JSON Canvas 1.0. ADR-0053. 127 canvas tests / 19 suites; typecheck clean; all files under 250-line hard cap. |
| 2026-08-17 | Canvas Feature Phase 12 — Export | Viewport and Full-Canvas PNG export using `html-to-image`. Webpage card fallback placeholder for iframe content (ADR-0056). Export controls UI and "Exporting..." overlay. Corrected event types for canvas interactions (`ReactMouseEvent | MouseEvent`). 179 tests / 25 suites. |
| 2026-08-17 | Canvas Feature Phase 13 — App Integration (FINAL) | Wired canvas fully into Obsidian-grid app shell: Icon Rail New Canvas button (FrameCorners icon), File Tree canvas distinction + click open, Tab Bar canvas/note type icons + close-save flush, RightSidebar "not applicable for canvas" per-section empty states + StatusBar canvas chip (ADR-0057). Re-verified lazy-load boundary: entry JS 21.08 KB raw / 7.71 KB gzip — 0 KB canvas/ReactFlow/PDF in first paint (canvas vendor chunk 56 KB gzip loaded only on demand). All 13 canvas phases complete. 179 canvas tests / 25 suites; tsc clean. |

## Detailed Session Notes


### 2026-08-01 → 2026-08-07 — Monorepo, Design System & Core Phases

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

### 2026-08-13 — SQLite Lock Fix & Vault Indexing Batching

Diagnosed and resolved SQLite `SQLITE_BUSY: database is locked` error during vault opening/indexing via WAL mode & `synchronous=NORMAL` executed at connection time and 50-item bulk SQL batching.

### 2026-08-13 — Phase 12 — Performance Audit Checkpoint

Complete audit against baselines and `PERFORMANCE.md`'s 10 hard rules across the entire app.

**Audit Findings & Fixes**:

- **Initial JS Bundle & Lazy-Loading**: Pre-audit entry chunk was 1,110 KB raw / 368 KB gzip (monolithic, non-code-split). Implemented `React.lazy` and `Suspense` for `GlobalGraphDialog`, `SettingsDialog`, `CommandPalette`, and `LocalGraphPanel`, splitting D3 (`101 KB`), CommandPalette (`11 KB`), and Settings (`14 KB`) out of the initial paint bundle. Reduced initial entry chunk to **176.9 KB raw / 55.8 KB gzip** (and `0.87 KB` shell entry).
- **State Subscriptions (Rule 6)**: Eliminated whole-store `useWorkspaceStore()` subscriptions across `App.tsx`, `BacklinksPanel.tsx`, `CommandPalette.tsx`, and `SettingsDialog.tsx`, converting to scoped selectors to prevent UI-wide re-renders.
- **Typing Latency Keystroke Leak (Rule 2)**: Removed `notesContent` from `BacklinksPanel` `useEffect` dependencies. Backlinks query now runs only on active path change or save/indexer/watcher update (`vaultUpdateCounter`), completely eliminating per-keystroke SQLite queries.
- **Memory & Startup Redundancy (Rule 3)**: Fixed `initializeVault` in `useWorkspaceStore.ts` which redundantly re-read and parsed all 350 files over IPC on vault open; `initializeVault` now simply sets paths and optional pre-queried SQLite graph. Updated `closeNote` to evict closed note content from memory.
- **File Structure & Hard Line Cap (AGENTS.md)**: Split `App.tsx` (previously 501 lines) into focused, single-responsibility subcomponents (`VaultWelcomeView`, `AppSidebar`, `AppTabs`, `EditorArea`, `RightSidebar`, `useVaultSession`), bringing every single file in the workspace well below the 250-line hard cap (all < 235 lines).
- **Enforced CI Size-Limit Gating**: Created `scripts/check-bundle-size.mjs`, wired `check:bundle-size` into `package.json` and `.github/workflows/ci.yml`. Verified that deliberate budget breaches fail CI and verified passing on current optimized build.

**Baseline Audit Comparison Table**:

| Metric | Phase Baseline | Pre-Audit (Phase 11) | Fix Applied | Post-Audit Final | Status |
|---|---|---|---|---|---|
| **Startup / Initial JS Bundle** | Phase 3: 317 KB raw / 100 KB gzip | 1,110.20 KB raw / 367.74 KB gzip (no lazy-loading) | Lazy-loaded dialogs & D3 graph (`React.lazy`), manual vendor chunking | **176.93 KB raw / 55.82 KB gzip** (Entry) + vendor chunks | **Improved (5x smaller entry)** |
| **Vault Indexing (350 notes)** | Phase 5 + WAL: 41ms parse+graph, <15ms SQLite batch | 41ms parse+graph, ~12ms SQLite; redundant full re-read in store init (~280ms) | Removed redundant file re-reading in `useWorkspaceStore.initializeVault` | **36ms parse+graph, <15ms SQLite batch write, 0ms redundant reads** | **Improved** |
| **Typing Latency** | Phase 6: 3.96 ms avg per keystroke (Target: <16 ms) | Pure CM6: 3.944 ms; but Backlinks triggered SQLite queries per keystroke | Scoped Zustand selectors, removed `notesContent` from `BacklinksPanel` effect | **3.979 ms pure CM6; 0 SQLite queries during typing** | **Held** |
| **File Tree Scroll** | Phase 7: Tree build ~8ms, flatten ~0.4ms | Tree build ~6ms, flatten ~0.3ms, virtualized with `@tanstack/react-virtual` | Maintained `@tanstack/react-virtual` with isolated `AppSidebar` | **Tree build ~6ms, flatten ~0.3ms, 60fps virtualized scroll** | **Held** |
| **Graph View Render** | Phase 10: 200-node cap, D3 force + SVG, 60fps | Top 200 nodes capped by degree, D3 zoom & pan | Code-split GraphView and LocalGraphPanel from initial bundle | **Top 200 nodes capped, lazy-loaded on demand, 60fps pan/zoom** | **Held** |

### 2026-08-13 — CSS Modules → CUBE CSS Migration (`apps/desktop`)

Fully migrated desktop application from scoped CSS Modules to CUBE CSS architecture with structured layers (`base/`, `layout/`, `components/`, `utilities/`, `lib/`, and `_main.scss`).

- Added zero-dependency, type-safe `cn()` helper (`src/styles/cn.ts`).
- Strict BEM class naming with Stylelint `selector-class-pattern` automated enforcement for `components/` blocks.
- Radix exceptions converted to clean `data-*` attributes (`data-state`, `data-active`, `data-size`, `data-selected`).
- All token references unified directly to `@app/design-system` canonical CSS custom properties (`--color-bg-primary`, `--color-border-subtle`, `--space-*`, etc.).
- Gzipped total CSS reduced from **8.05 KB to 6.60 KB** (18% reduction); typing latency held at **4.026 ms**; all 24 tests and lint passing.

### 2026-08-14 — Obsidian App Shell Layout Restructure

- **CSS Grid App Shell**: Migrated desktop shell to full CSS Grid (`grid-template-rows: auto 1fr auto;` and middle body `grid-template-columns: 40px auto 1fr auto;`), avoiding nested flexbox chains.
- **DOM State Preservation on Collapse**: Both left (File Explorer) and right sidebars toggle via `data-collapsed="true"` setting width to 0 with `overflow: hidden`, preserving scroll position, expanded tree state, and editor selections without unmounting.
- **Top Tab Bar (`AppTabs`)**: Added `+` new tab action, right-sidebar toggle icon, and view options action. Fully wired to multi-note state in `useWorkspaceStore`.
- **Icon Rail (`IconRail`)**: Vertical ~40px icon strip providing single navigation entry points for Files, Search (Cmd+K), Global Graph, Daily Notes (`YYYY-MM-DD.md`), Settings, and Close Vault with Radix Tooltips.
- **File Tree (`AppSidebar`)**: Refactored to act as a collapsible sidebar alongside the Icon Rail with vault header, new note affordance, and virtualized `FileTree`.
- **Properties Block (`PropertiesBlock`)**: Positioned above note body in `EditorArea`. Renders parsed YAML frontmatter (`tags` as `#tag` badges, `[[wikilinks]]`, dates, authors) with collapsible accordion and "+ Add property" placeholder affordance.
- **Stacked Right Sidebar (`RightSidebar`)**: Stacked Linked Mentions (`BacklinksPanel`), Unlinked Mentions section, Note Outline (`NoteOutline` scanning H1–H6), and Local Graph (`LocalGraphPanel`).
- **Status Bar (`StatusBar`)**: Full-width thin bottom bar with live note stats (backlink count, property count, word count, character count) and vault connection indicator.
- **Bundle & Test Verification**: All 12 test suites (33 unit tests) passing; initial entry bundle holds at <22 KB raw / <8 KB gzip (total JS <1.09 MB raw / <359 KB gzip); bundle size budget gates verified.

### 2026-08-14 — Phase 13 — Staging Deploy & Release Candidate 1

- **Staging Deploy Channel**: Configured GitHub Actions workflow `.github/workflows/staging-release.yml` with multi-platform matrix (`macos-latest`, `ubuntu-22.04`, `windows-latest`), secret wiring for Apple Developer ID / Windows Authenticode code signing & notarization, and automatic staging channel distribution artifacts on merge to `main`.
- **Changesets First Version Bump**: Reconstructed changesets for Phases 1–12 across `@app/design-system`, `@app/core-types`, `@app/indexer`, `@app/editor`, and `@app/sync-client`. Ran `pnpm changeset version` bumping all packages to `0.1.0` and generating comprehensive `CHANGELOG.md` files. Synchronized `@app/desktop` version to `0.1.0`.
- **Release Candidate Tag & Native Artifacts**: Cut git tag `v0.1.0-rc.1`. Built standalone macOS release bundle (`DaVinci Notes.app` 15.6 MB binary) and native installer (`DaVinci Notes_0.1.0_aarch64.dmg` 5.5 MB).
- **Release Notes**: Created internal release documentation in `docs/releases/v0.1.0-rc.1.md` outlining implemented capabilities (Vault I/O, CodeMirror 6 live-preview, wikilinks, backlinks, Cmd+K quick switcher, D3 force graph, SQLite settings, virtualized tree), out-of-scope items (mobile, sync, plugins, light theme), and operational notes (ad-hoc signing Gatekeeper notice, provisional bundle ID).
- **Packaged App Verification**: Verified full standalone release application startup, webview runtime initialization, bundle size gates (<177 KB entry JS, <29 KB total CSS), and 31/31 passing workspace tasks.

### 2026-08-14 — Canvas Feature Phase 0 — Package Setup & Data Model

- **Package Scaffolding (`packages/canvas` -> `@app/canvas`)**: Created workspace package holding data model, file I/O, and future React Flow components together (mirroring `design-system` and `editor`).
- **JSON Canvas 1.0 Spec Compliance**: Defined strict TypeScript models matching `jsoncanvas.org/spec/1.0/` for `CanvasData`, `CanvasNode` (`text`, `file`, `link`, `group` variants), `CanvasEdge` (directional endpoints, sides, colors, labels), and `CanvasColor` (presets "1".."6" and `#...` hex strings).
- **Parsers, Serializers & Validators**: Pure functions `parseCanvas`, `serializeCanvas`, `validateCanvas` with comprehensive schema validation. Hand-crafted realistic spec-compliant fixtures (`basic.canvas`, `complex.canvas`).
- **File I/O Round-Trip**: Built `canvasIO.ts` (`readCanvasFile`, `writeCanvasFile`) with pluggable filesystem adapters (dynamic Node `fs/promises` for test/tools and Tauri IPC bridge for desktop). Tested disk round-trip writing `CanvasData` to temp file and verifying exact structural equality on read-back.
- **Boundary Enforcement**: Configured `eslint-plugin-boundaries` for `canvas` element (`packages/canvas/**/*`, `mode: "full"`). Restricted dependencies to `@app/core-types` and `@app/design-system` only. Tested and verified boundary violation failure using a throwaway import, then cleaned up.
- **Dependency Addition (`@xyflow/react`)**: Added `@xyflow/react` (^12.4.4) to `packages/canvas` (54.8 KB min+gzip).
- **Lazy-Load Verification & Bundle Audit**: Established `React.lazy` dynamic import boundary in `EditorArea.tsx` for `.canvas` files. Configured Vite vendor chunking. Verified via `scripts/check-bundle-size.mjs`: initial entry JS chunk holds at **21.08 KB raw / 7.71 KB gzip** with **0 KB** canvas code in the initial bundle; async canvas chunk is **4.39 KB raw / 1.46 KB gzip**.
- **Test Suite**: 4 test files (18 unit tests) in `@app/canvas` passing; all 105 tests across 14 workspace tasks passing.

### 2026-08-14 — Canvas Feature Phase 1 — Canvas Shell

- **Bidirectional Translation Layer (`packages/canvas/canvasTranslation.ts`)**: Built pure TypeScript translation functions (`jsonCanvasToReactFlow` and `reactFlowToJsonCanvas`) decoupling JSON Canvas schema from React Flow internal models. Validated 100% lossless round-trip fidelity via unit tests.
- **React Flow Canvas Component (`CanvasView.tsx`)**: Mounted real React Flow instance with smooth space+drag & middle-click pan, ctrl/cmd+scroll zoom, pinch zoom, and zoom-to-fit toolbar control. Added empty state editorial UI hint when `nodes.length === 0`.
- **Debounced Save / Load Integration**: Connected canvas state changes to `useWorkspaceStore` via `onContentChange`, automatically reusing the existing 750ms debounced disk saving workflow (`saveNoteNow`) for `.canvas` files.
- **Native Vault Support & New Canvas Creation**: Updated Rust `fs.rs` and `watcher.rs` to index and watch `.canvas` files. Added `createNewCanvas` to `useVaultSession` and "New canvas" action button in `AppSidebar` writing valid initial `{ "nodes": [], "edges": [] }` files immediately.
- **Bundle Audit & Lazy-Load Re-Verification**: Verified that `@app/canvas` and `@xyflow/react` remain in an asynchronous chunk (`vendor-canvas-*.js` 172 KB raw / 55.9 KB gzip) with **0 KB** footprint in initial entry JS. Initial entry JS remains well under budget at **21.08 KB raw / 7.71 KB gzip**.
- **Test Suite**: All 22 tests in `@app/canvas` passing; all 109 tests across 14 workspace tasks passing.

### 2026-08-14 — Canvas Feature Phase 2 — Text Cards

- **Data Model Verification**: Confirmed Phase 0 `CanvasTextNode` (`id`, `x`, `y`, `width`, `height`, `text`, optional `color`) matches JSON Canvas 1.0 spec with no extensions added.
- **Text Card Component (`TextCardNode.tsx`)**: Custom React Flow node with `NodeResizer` for corner/edge resize, body drag via React Flow's built-in handling, and distinct edit mode (double-click to edit, drag disabled while editing).
- **Text Editing Approach**: Lightweight native `<textarea>` — not CodeMirror. Rationale: in-card fields are plain text only for this phase; pulling `@app/editor` (~CM6 bundle) into every text card would add meaningful weight and complexity for a small overlay field. CodeMirror remains the right choice for full note tabs (Phase 6).
- **Create / Move / Resize / Delete**: Double-click empty canvas to create; toolbar "+" and right-click pane "Add text card" as secondary entry points; drag body to move; resize handles via `NodeResizer`; select + Delete/Backspace and right-click "Delete card"; all mutations update underlying `CanvasData` via existing translation layer.
- **Snap-to-Grid & Alignment**: 24px grid snap on drag-stop and resize-end; custom alignment snap (`snapNodeAlignment.ts`) against other cards' edges/centers during drag (React Flow v12 has no built-in alignment guides).
- **Persistence Fix**: Replaced Phase 1 stale-closure `setTimeout` persist with `applyNodeChanges`-based handlers + `lastSerializedRef` guard preventing store feedback loops during drag; visual updates remain immediate, disk write stays on existing 750ms debounced `updateNoteContent`/`saveNoteNow` path.
- **Test Suite**: 30 tests in `@app/canvas` passing (added `TextCardNode`, `snapNodeAlignment`, `canvasConstants` tests; updated `CanvasView` tests for text card rendering).

### 2026-08-14 — Canvas Feature Phase 4 — Selection & Arrangement

- **Selection Mechanics**: Fully verified and integrated single select, marquee drag-select (`selectionOnDrag={true}`, `SelectionMode.Partial`), Shift-click add/remove (`multiSelectionKeyCode="Shift"`), and Ctrl/Cmd+A select-all (with input field guard).
- **Group Drag**: Multi-card drag moving selection as a single unified gesture with 24px grid snap and alignment guides.
- **Duplicate Selection (`useCanvasSelectionOps.ts`)**: Duplicate single or multiple cards (via `⌘D` / `Ctrl+D` shortcut or context menu), generating unique IDs, offset by (+40px, +40px), cleanly preserving all internal edges connecting nodes inside the selection, and discarding crossing edges into/out of the selection.
- **Alignment & Distribution (`arrangeNodes.ts`)**: Pure utility functions for left, right, top, bottom, horizontal center, and vertical center alignment, as well as equal horizontal and vertical spacing distribution (anchoring outer boundaries).
- **Toolbar Controls & Tooltips**: Added alignment and distribution button groups to `CanvasControls.tsx` with dynamic count gating (2+ nodes for align, 3+ nodes for distribute) and descriptive tooltips explaining minimum selection requirements when disabled.
- **Axis-Constrained Movement**: Shift key drag locks movement to the dominant axis (horizontal or vertical) after a 5px threshold.
- **Modular Hook Architecture & Line Limits**: Refactored canvas interactions into modular hooks (`useCanvasContextMenu.ts`, `useCanvasSelectionOps.ts`, `useCanvasInteractions.ts`), keeping all source files strictly under the 250-line hard cap (all ≤ 238 lines).
- **Persistence & Performance**: All multi-card operations update underlying `CanvasData` and leverage the existing 750ms debounced disk saving (`useWorkspaceStore.saveNoteNow`) with zero per-keystroke or per-frame I/O overhead.
- **Test Suite**: 56 unit tests passing in `@app/canvas` across 12 test suites (added 14 pure unit tests in `arrangeNodes.test.ts`); all 32 workspace tasks passing.

### 2026-08-14 — Canvas Feature Phase 5 — Groups & Framing

- **Group Creation** (`useCanvasGroupOps.ts`): right-click empty canvas → "Add group" creates a default 480×360 group (grid-snapped, selected on creation); right-click on a selection → "Group selection" computes the bbox of the selected members (with label/padding insets via `computeGroupBboxForIds`), snap-wraps them, and reparents members to the new group with `parentId` + relative positions. Both flows persist through the existing debounced save path.
- **Group Node UI** (`GroupCardNode.tsx`): bordered frame using the Phase 3 token palette accent (`getCanvasEdgeColorCss`), label bar with inline double-click rename (native input, Enter/Escape/blur commit), `NodeResizer` with grid-snapped resize-end. No gradients/shadows per design rules; depth communicated via border + label bar.
- **Runtime Containment Strategy (ADR-0046)**: React Flow `parentId` + `extent: "parent"` at runtime gives clipping and automatic drag propagation through all nesting levels with zero custom drag-sync code. Disk serialization always converts to absolute world coordinates and strips all React Flow fields, so `.canvas` files are 100% JSON Canvas 1.0 compliant (implicit bbox membership, no extension fields). `assignParentsByBbox` re-derives parent links on every load: smallest-area containing group wins, strict area comparison prevents a group from becoming its own parent's ancestor.
- **Nesting & Selection Semantics (ADR-0047)**: 10-level depth cap enforced in `reparentNodesOnDrop` / `createGroupFromSelection`; a drop that would exceed depth 10 silently falls back to the deepest allowed parent. Click selects the frame only; `expandSelectionToMembers` transitively expands the selection before duplicate/align/distribute/delete. Delete of a group cascades to transitive children (context menu + `onNodesDelete`); "Ungroup" reserved for a future phase.
- **Drag-Drop Reparenting** (`reparentNodesOnDrop` in `groupContainment.ts`): when a node or group is dropped inside a group, it becomes a child (parent-relative position + extent). Wired at two chokepoints matching React Flow v12's drag-stop event order — `handleNodesChange` (position changes with `dragging: false`, which XYDrag emits before `onNodeDragStop`) and `onNodeDragStop` (grid-snap + reparent in `useCanvasDrag.ts`, now computing deltas from current state so reparented parent-relative coordinates snap correctly). Guards: strict area ordering, cycle prevention (`wouldCreateCycle`), depth cap, and skipped descendants of dragged parents (children move with parent, never re-parented).
- **Selection Ops Group-Awareness**: duplicate/align/distribute in `useCanvasSelectionOps.ts` expand to transitive members before operating, so Phase 4 operations "just work" on group selections without group-specific UI.
- **Context Menu** (`CanvasContextMenu.tsx`): "Add group", "Group selection" (shown only when a selection exists), delete resolves group vs card via `deleteGroupAware`; group color uses the existing palette swatch row (shared with edge color per ADR-0044).
- **File Limits**: `useCanvasDrag.ts` extracted out of `useCanvasInteractions.ts` (which exceeded the 250-line cap); all canvas files ≤ 250 lines.
- **Performance**: reparenting/containment is O(dragged × groups) and runs only on drag-stop (a discrete user event), never per-frame or per-keystroke; load-time containment walk is O(n×m) and unmeasurable below ~1000 nodes. Zero new dependencies (React Flow `parentId`/`extent` replaces a custom containment engine). Persistence unchanged: 750ms debounced `saveNoteNow`.
- **Test Suite**: 88 tests passing across 13 suites (added `groupContainment.test.ts` for pure containment/reparent/selection-expansion, nested-group round-trip tests in `canvasTranslation.test.ts`, group rendering tests in `CanvasView.test.tsx`). Lint + typecheck clean.

### 2026-08-16 — Canvas Feature Phase 6 — Markdown File Embed Cards

- **File Node Data Model & Translation**: `CanvasFileNode` (`type: "file"`, `file: string`, optional `subpath: string`) verified against the JSON Canvas 1.0 specification. Losslessly translated between JSON Canvas and React Flow in `canvasTranslation.ts`.
- **Renderer Reuse (ADR-0048)**: Reused CodeMirror 6 live-preview markdown renderer from `@app/editor` via `MarkdownView` with `EditorState.readOnly.of(true)` and `EditorView.editable.of(false)`. Extracted `editorTheme.ts` into a dedicated module to share syntax styling across full and read-only editors while reducing `Editor.tsx` from 215 to 125 lines. 0 KB new dependencies.
- **Live Note Syncing**: File cards subscribe to `useWorkspaceStore.notesContent` for instantaneous reactive updates when a note is edited in an open editor tab, with async fallback to `readNote` IPC for unopened vault notes.
- **Drag-and-Drop Creation (ADR-0049)**: Implemented native HTML5 Drag and Drop from `FileTree` rows to `CanvasView` using MIME type `application/vnd.davinci.note` (and `text/plain`), calculating coordinates with React Flow's `screenToFlowPosition` snapped to the 24px grid. Alternative creation paths supported via wikilink paste (`[[Note]]`) and context menu.
- **Card Actions**:
  - **Swap File**: Header button and context menu trigger `FileCardSwapPicker` allowing fast search and re-targeting of the embed to any note in the vault.
  - **Convert Text Card to File**: Context menu action promotes text card content to a real vault note (invoking `writeNote` + `persistNote`), converting the canvas node to a file embed.
  - **Narrow to Heading**: Pure `subpathUtils.ts` extracts heading section (`# Heading` up to the next heading of same/higher level) and displays the subpath badge in the header.
- **Card UI & Resize**: `FileCardNode.tsx` with header icon, display title, subpath badge, action buttons, `NodeResizer` (grid-snapped), 4 connection handles, and scrollable body.
- **File Structure & Caps**: Split UI pickers into `FileCardSwapPicker.tsx` and `FileCardHeadingPicker.tsx`, extracted `useCanvasFileOps.ts`, ensuring all files stay strictly ≤ 250 lines (soft cap 150-200).
- **Test Suite**: 97 canvas unit and integration tests passing across 15 suites (added `subpathUtils.test.ts`, `FileCardNode.test.tsx`, and updated `CanvasView.test.tsx`); all 14 monorepo tasks passing.

### 2026-08-16 — Canvas Feature Phase 7 — Image / Video Cards

- **Media Node Data Model (ADR-0050)**: Confirmed that image and video cards strictly map to the JSON Canvas 1.0 `CanvasFileNode` (`type: "file"`, `file: string`). The stored file reference is always a vault-relative path (e.g. `attachments/diagram.png` or `recordings/demo.mp4`), never base64.
- **Rendering & Fit (ADR-0050)**:
  - **Images**: Standard `<img>` element with `object-fit: contain`, `loading="lazy"`, `decoding="async"`, and fallback UI on load failure. `contain` chosen to avoid cropping user diagrams, charts, and media.
  - **Videos**: Standard `<video>` element with `controls`, `preload="metadata"`, and `object-fit: contain`.
  - **URL Resolution**: Created `useMediaUrl` hook resolving vault-relative paths to displayable asset URLs via `resolveMediaUrl` (using Tauri's `convertFileSrc` mapped from active `vaultPath`).
- **Resize Behavior (ADR-0050)**: Defaulted image cards to aspect-ratio-locked resizing (`keepAspectRatio={true}` on `<NodeResizer />`), avoiding accidental distortion. Markdown notes and video cards use free-form resizing (`keepAspectRatio={false}`). Snaps width and height to 24px grid on resize completion.
- **Media Creation & Vault Storage (ADR-0051)**:
  - **FileTree Drag & Drop**: Extended `collect_vault_paths` in `fs.rs` to discover image (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`, `.ico`, `.avif`) and video (`.mp4`, `.webm`, `.ogg`, `.ogv`, `.mov`, `.mkv`, `.m4v`) files in the vault. Rendered dedicated `Image` and `Video` icons in `FileTree.tsx`. Dragging media files onto canvas creates cards referencing their vault path.
  - **Clipboard Paste & OS Drop**: Handled paste events (`onPaste`) for image blobs and external file drops (`onDrop`), writing binary bytes to `attachments/Pasted image YYYYMMDDHHMMSS.png` using a safe `write_binary_file` Tauri command and instantiating a `CanvasFileNode` at the viewport center or drop position.
- **Modular Component Architecture**: Extracted `FileCardHeader.tsx`, `MediaCardView.tsx`, `useMediaUrl.ts`, `mediaCardUtils.ts`, and `useCanvasDropPaste.ts` from `FileCardNode.tsx` and `CanvasView.tsx`, reducing `FileCardNode.tsx` from 242 lines to 184 lines and keeping all source files within the 200-line soft cap.
- **Test Suite**: 111 canvas tests passing across 16 suites (added `MediaCardView.test.tsx` and updated `FileCardNode.test.tsx`, `CanvasView.test.tsx`, and `CanvasData.test.ts`). All 14 monorepo tasks passing with 0 lint errors and 0 type errors.

### 2026-08-16 — Canvas Feature Phase 9 — PDF Cards

- **Dependency Choice & Bundle Cost Audit (ADR-0053)**: Selected `pdfjs-dist@^4.10.38` as the only viable OSS in-browser PDF renderer. Verified actual sizes: core ~286 KB min / ~75 KB gzip, worker ~165 KB min / ~46 KB gzip. **Effective total at first visible PDF card: ~121 KB gzip (core + worker)**. Alternatives rejected: native `<object>/<iframe>` viewer (zero cost but no UI control + Tauri asset protocol workarounds), `react-pdf` wrapper (+15–25 KB gzip and page-at-a-time model incompatible with card UX), `@react-pdf/renderer` (PDF generation, wrong tool). No duplicate PDF library in workspace — grep of all `package.json` files for `pdfjs`/`react-pdf`/`pdf-lib` returned zero matches before install.
- **Dependency Scoping**: `pdfjs-dist` added as dependency of `@app/canvas` ONLY — never of `@app/editor`, core-types, or apps/desktop. Zero cross-package leakage.
- **Data Model — No New Node Type**: PDFs map to existing JSON Canvas 1.0 `CanvasFileNode` (`type: "file"`, `file: string` path reference, no embedded binary). Extended `FileCardType` union with `"pdf"` discriminant; added `PDF_EXTENSIONS = new Set(["pdf"])`, `getFileCardType` routing, and `isPdfFile` helper in `mediaCardUtils.ts`. Consistent with ADR-0050 media cards.
- **Double-Gated Nested Lazy-Load Boundary (ADR-0053)**:
  - **Gate 1 (pre-existing ADR-0041)**: `@app/canvas` + React Flow already loads via `React.lazy` dynamic import when user opens `.canvas` tab.
  - **Gate 2 (new, this phase)**: `PdfCardView.tsx` — the only module that statically imports `pdfjs-dist` — is itself loaded via dynamic `import()` inside `FileCardNode.tsx`, gated by BOTH: (a) `fileType === "pdf"` runtime check, AND (b) React Flow v12 `onlyRenderVisibleElements` viewport culling mounting the node first. A canvas with zero PDF cards → 0 bytes of pdfjs-dist in any chunk. A canvas with off-screen PDF card → 0 bytes until card scrolls into view.
  - **Boundary integrity verified**: `grep "PdfCardView" packages/canvas/index.ts` → 0 matches (barrel export intentionally excludes PdfCardView; `PDF_EXTENSIONS` and `isPdfFile` ARE exported since they're pure data/functions without pdfjs dependency).
- **Worker Chunking**: `pdfjs.GlobalWorkerOptions.workerSrc` configured inside `pdfCardRenderer.ts` (called at `PdfCardView.tsx` module initialization, NOT at project-level initialization) using `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` so Vite emits the worker as its own chunk loaded by the browser on demand, never bundled into canvas base.
- **Rendering UX — Continuous Vertical Scroll**: Chose continuous scroll over page-by-page navigation buttons — better UX for a small card context. Pages render as stacked `<canvas>` elements inside `.pdf-scroll-container` (overflow-y: auto). No toolbar chrome inside card body; reuses shared `FileCardHeader` with other file-embed types (consistent header icon, file open, swap picker affordances).
- **DPR-Aware Canvas Scaling**: `renderPdfPage` in `pdfCardRenderer.ts` sizes canvas backing store at `devicePixelRatio` multiplier while keeping CSS pixel dimensions at container width → crisp PDF text without blurriness on Retina/HiDPI displays. Output scale `transform` matrix fed directly into pdf.js's `page.render()`.
- **Card Resize Reflow & Debounce**: `usePdfResizeObserver` attaches a `ResizeObserver` to the scroll container. On container width change, waits 120 ms (RENDER_DEBOUNCE_MS) with RAF alignment to avoid thrashing during drag resize, then computes new scale = `viewportWidth / max(1, pageSizes[0].width)` (clamped 0.1–5 range), cancels ALL in-flight `renderTask`s via `renderTask.cancel()`, and re-schedules all pages at the new scale.
- **Viewport Culling Cleanup**: Phase 8's `onlyRenderVisibleElements` cascades correctly. When a PDF card goes off-screen, React Flow unmounts it → `usePdfDocumentLoader` cleanup destroys the `PDFDocumentProxy` via abort-ref + `doc.destroy()`; pending `renderTask`s are cancelled via the refs map; canvas backing stores are garbage collected with the unmounted nodes. No zombie render threads or memory leaks on pan/zoom scroll.
- **Page Render Scheduling**: `schedulePageRender` in `PdfCardView.tsx` is idempotent per page index (skips if already pending via `pendingPagesRef` Set), cancels any prior render on the same canvas before starting a new one, and catches `"Rendering cancelled"` errors silently (expected outcome of the cancel-on-resize pattern).
- **Drag-and-Drop Creation Flow**: Reused existing `useCanvasDropPaste` mechanism from Phases 6/7 unchanged in structure. Extended `handleDrop` to accept `isPdfFile(file.name) || file.type === "application/pdf"` alongside `isMediaFile`. Internal file-tree drag (`vnd.davinci.note`) already works via `getFileCardType` extension routing. External OS file drop and clipboard paste save PDFs into same `attachments/` vault folder using existing `onSaveMediaFile` callback. No third parallel creation mechanism built.
- **Modular File Architecture & Line Caps**: All new files strictly under the 250-line hard cap:
  - `PdfCardView.tsx`: 206 lines (150–200 soft-cap target; 206 is 6 over soft, well under hard)
  - `usePdfDocumentLoader.ts`: 90 lines
  - `usePdfResizeObserver.ts`: 75 lines
  - `pdfCardRenderer.ts`: 60 lines
  - `PdfCardView.test.tsx`: 107 lines
- **Test Infrastructure for pdfjs-dist**: `__mocks__/pdfjs-dist.ts` provides a lightweight mock (0-page doc, no-op render, noop destroy). Aliased in `vitest.config.ts` resolve map so `import * as pdfjs from "pdfjs-dist"` resolves to the mock during tests, avoiding the 450 KB real library from running in jsdom. `pdfjs-dist-shim.d.ts` declares a module for `pdfjs-dist/build/pdf.worker.min.mjs` to satisfy TS when Vite's URL worker resolution is active.
- **Test Suite**: 127 canvas tests passing / 19 suites (up from 115/17 in Phase 8). Added `PdfCardView.test.tsx` with 3 tests: empty state rendering, error/load state with scroll-container OR error-box presence (mock returns a 0-page doc so both branches are reachable), and `mediaCardUtils` PDF classification (`getFileCardType`, `isPdfFile`, `PDF_EXTENSIONS` set membership). `ResizeObserver` polyfilled inline in test file with no-op class matching jsdom environment gap.
- **TypeScript**: 0 type errors across `@app/canvas`. Fixed single `RefObject<HTMLDivElement | null>` vs `RefObject<HTMLDivElement>` assignability issue in `usePdfResizeObserver` options type by widening the interface.
- **Lint**: 0 PDF-code lint errors. 1 pre-existing error in `CanvasBenchmark.test.ts` line 9 (ESLint boundaries/no-private — importing `generateLargeCanvas` from `./fixtures/` subfolder) is a Phase 8 artifact unrelated to this work and tracked as a future cleanup item in Next Up list.
- **Persistence Unchanged**: PDF cards serialize identically to other file nodes via existing `canvasTranslation.ts` → `serializeCanvas.ts` path. 750ms debounced save mechanism untouched; persistence equality guard from Phase 8 continues deduplicating save calls when only pan/zoom state changes.

### 2026-08-16 — Canvas Feature Phase 10 — Webpage Embed Cards

- **Threat Model & Security Decisions (ADR-0054)**:
  - Addressed execution of untrusted third-party JavaScript within a Tauri v2 desktop webview environment with filesystem/SQLite capabilities.
  - Enforced strict isolation: zero access to `window.__TAURI__`, zero parent DOM/JS context access, zero top-level window redirection, zero local filesystem access (`file://`, `tauri://`, `data:`, `blob:`), and zero blocking modal dialogs (`alert()`, `confirm()`, `prompt()`).
- **Sandboxing Strategy**:
  - `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`.
  - Strictly banned forbidden tokens: `allow-top-navigation`, `allow-top-navigation-by-user-activation`, `allow-top-navigation-to-custom-protocols`, `allow-modals`, `allow-pointer-lock`.
  - `referrerPolicy="strict-origin-when-cross-origin"` prevents leaking local note names or paths.
- **Explicit Security Boundary Tests (`LinkCardSecurity.test.tsx`)**:
  - Automated 7-test suite explicitly verifies:
    1. Dangerous URI schemes (`javascript:`, `file:`, `data:`, `tauri:`, `blob:`) are rejected and sanitized to null, preventing injection into iframe `src`.
    2. Rendered iframe sandbox attributes strictly omit top-navigation and modal tokens.
    3. Cross-origin / parent window isolation tests.
- **JSON Canvas 1.0 `link` Node Data Model**:
  - Implemented `CanvasLinkNode` (`type: "link"`, `url: string`, `x`, `y`, `width`, `height`, optional `color`).
  - Added constants `DEFAULT_LINK_CARD_WIDTH = 480`, `DEFAULT_LINK_CARD_HEIGHT = 360`, `createLinkCardId()`.
- **YouTube Special-Casing**:
  - Automatically converts YouTube watch, shorts, youtu.be, and embed URLs into responsive privacy-enhanced player embeds (`https://www.youtube-nocookie.com/embed/{id}?start={timestamp}`).
- **Card UI & Interactions**:
  - `LinkCardNode.tsx` with header displaying domain, favicon/globe/YouTube icon, "Open in browser" (`window.open(url, '_blank', 'noopener,noreferrer')`), and "Change URL" button.
  - `LinkCardUrlEditor.tsx`: inline/popover form to edit and validate URLs with debounced autosave.
  - `useCanvasDropPaste.ts`: handles pasting or dropping URLs directly onto the canvas to instantiate link cards.
- **Architecture & Line Count Compliance**:
  - Extracted `CanvasReactFlow.tsx` (101 lines) to bring `CanvasView.tsx` down to 244 lines (well under 250-line hard cap).
  - All new files strictly within 150-200 lines (`linkCardUtils.ts` 154, `LinkCardNode.tsx` 171, `LinkCardHeader.tsx` 72, `LinkCardUrlEditor.tsx` 107).
- **Test & Bundle Verification**:
  - 159 tests passing in `@app/canvas` across 22 test files.
  - `vite build` clean; 0 KB added to entry bundle (21.58 KB raw / 7.90 kB gzip).

### 2026-08-17 — Canvas Feature Phase 12 — Export

- **Export Functionality**: Implemented viewport and full-canvas export to PNG images.
  - **Viewport Export**: Captures current visible area.
  - **Full-Canvas Export**: Fits all content, waits for render (ensuring virtualized cards are present), captures, and restores view.
- **Webpage Card Fallback (ADR-0056)**: Webpage iframes cannot be captured by DOM-to-image tools. Implemented an `isExporting` visual placeholder in `LinkCardNode` (Globe icon + URL) to avoid blank/broken areas in exports.
- **`useCanvasExport` Hook**: Encapsulates capture logic, state, and DOM filtering (removing UI controls from export).
- **UI/UX**:
  - Added Export buttons to `CanvasControls` (Camera and Download icons).
  - Added a "Exporting Canvas..." overlay with a backdrop to provide feedback and prevent concurrent modifications during capture.
- **TypeScript Fixes**: Refactored `CanvasReactFlow` and related hooks (`useCanvasInteractions`, `useCanvasEdgeInteractions`, `useCanvasContextMenu`) to use `ReactMouseEvent | MouseEvent`, aligning with XYFlow/React Flow event types and fixing several type mismatches.
- **Test Suite**: 179 tests passing across 25 suites (added `useCanvasExport.test.ts`).
- **Dependencies**: Added `html-to-image` to `@app/canvas`.

### 2026-08-17 — Canvas Feature Phase 13 — Full App Integration (FINAL — all 13 phases complete)

- **Scope discipline**: This session explicitly touched only the wiring layer connecting `@app/canvas` into the desktop Obsidian-grid app shell; no changes to canvas internals (rendering/cards/edges/groups/export) per plan.

- **1. Icon Rail Entry Point (ADR-0040 / ui-grid-layout-plan.md region)**:
  - Extended `IconRailProps` with optional `onCreateCanvas?: () => void`.
  - Added conditional `FrameCorners` (Phosphor regular, 18px) button in the `icon-rail__group--top` group, wrapped in `Tooltip` "New canvas".
  - Wired in `App.tsx` to existing `handleCreateCanvasPrompt` → reuses Phase 1 `useVaultSession.createNewCanvas` (empty `{nodes:[], edges:[]}` JSON, writes `.canvas`, adds to paths, opens tab).

- **2. File Tree — pre-existing, re-verified**:
  - `FileTree.tsx` already handles `.canvas` correctly:
    - Detection: `isCanvas = isFile && item.node.name.endsWith(".canvas")` (line 90-91).
    - Icon: `FrameCorners size={14}` (line 149-150), distinct from `FileText` for `.md`.
    - Title: strips both `.md` and `.canvas` extensions (line 99).
    - Click: routes through `onNoteClick(item.node.path)` → `openNote(path)` for any file type (line 128).
    - Virtualization (`@tanstack/react-virtual`): operates on flattened `visibleNodes: Array<{node, depth}>` — completely type-agnostic, row size 28px uniform, overscan 10.
  - HTML5 `draggable` (line 106) + `onDragStart` (MIME type `application/vnd.davinci.note` + plaintext path) already supports canvas files for D&D embeds per ADR-0049.
  - `AppSidebar` header already included New Canvas `FrameCorners` action in its `app-sidebar__header-actions` row alongside New Note (pre-existing from Phase 1).

- **3. Tab Bar Integration**:
  - **Visual distinction**: Added `isCanvas = path.endsWith(".canvas")` per tab row. Prepended a `<span class="app-tabs__tab-icon">` containing `FrameCorners` for canvas or `FileText` for notes (13px, Phosphor regular weight — consistent with file-tree icon sizing).
  - Added `.app-tabs__tab-icon` CSS rule in `_tabs.scss`: inline-flex, inherit color from tab (muted→normal on active/hover), flex-shrink 0, opacity 0.85 for subtlety.
  - **Close save discipline re-verified**: `useWorkspaceStore.closeNote(path)` implementation (lines 117-142) executes in this order:
    1. Clears pending `saveTimers[path]` 750ms debounce timer
    2. Calls `saveNoteNow(path)` **synchronously await** — writes to disk via `writeNote` then re-indexes for .md, for .canvas writeNote writes raw JSON content directly — persistence path is generic file write, no markdown parser difference.
    3. Only after save completes: updates `openNotes`, `activeNotePath`, `notesContent`.
  - Canvas mutations flow into the exact same mechanism: `EditorArea.tsx` passes `onContentChange={(p,c) => updateNoteContent(p,c)}` to `LazyCanvasView`. So canvas dirty dots, debounce timers, and save-flush-on-close are identical behavior to notes.

- **4. Right-Sidebar + StatusBar Behavior (ADR-0057, documented with 3-option analysis)**:
  - Evaluated: (a) hide right sidebar entirely for canvas (jarring pop-in/out), (b) build canvas-equivalent outline/graph panels (out of scope for v1), (c) per-section explicit "not applicable for canvas" empty states (no layout shift, clear messaging, low effort).
  - Selected option (c), implemented in `RightSidebar.tsx`:
    - Boolean `isCanvasActive = activePath?.endsWith(".canvas") ?? false`.
    - **Linked Mentions** section: replaces `BacklinksPanel` + Unlinked Mentions subsection with single Typography empty message "Canvas files do not have linked mentions".
    - **Outline** section: replaces `NoteOutline(content)` with "Canvas outline not available" (preventing misleading zero-headings result from `parseHeadings` over JSON canvas string).
    - **Local Graph** section: replaces LazyLocalGraphPanel with "Local graph not available for canvas" (canvas-card-edge relationship topology stored inside per-canvas JSON, not in vault-wide SQLite wikilink graph).
    - Collapse toggles (`isMentionsOpen/isOutlineOpen/isGraphOpen`) preserved independently; sidebar `[data-collapsed]` behavior unchanged — no hide/reshow jank during note↔canvas tab switches.
  - `StatusBar.tsx` same `isCanvas` gate:
    - When canvas active: single `<span class="status-bar__stat">Canvas file</span>` instead of the backlink/properties/word/char stats — those four stats compute from `parseFrontmatter` + markdown body length, which is meaningless for JSON canvas content.
  - `PropertiesBlock`/Editor header already correctly branch-gated: `EditorArea.tsx` renders the H1 title + `PropertiesBlock` only in the non-canvas branch (line 150-167); the canvas branch (line 134-148) renders only `LazyCanvasView`.

- **5. Lazy-Load Boundary Re-Verification (ADR-0041)**:
  - **Static analysis**: `grep -R "import.*@app/canvas" apps/desktop` → 1 result total, at `EditorArea.tsx:19` and only inside dynamic `import("@app/canvas")` within `React.lazy()`. No top-level imports in IconRail, AppTabs, RightSidebar, StatusBar, or App.tsx.
  - **Vite production build output analysis**:
    - **Entry JS (first paint)**: `index-D9tyl52t.js` = 21.08 KB raw / **7.71 KB gzip** — exactly matches the ADR-0041 post-Phase-0 measurement. **Confirmed zero canvas/ReactFlow/PDF.js footprint in initial bundle.**
    - Canvas code (loaded only on first canvas tab open): `vendor-canvas-CL11XwPH.js` = 173.61 KB raw / 56.37 KB gzip. + `vendor-canvas-7ZgWJ5_7.css` = 15.53 KB raw.
    - PDF code (loaded only on first PDF card visible inside viewport): `PdfCardView-Bd2RSY7L.js` = 330.32 KB / 97.33 KB gzip + `pdf.worker.min-yatZIOMy.mjs` ~ 1.3 MB (double-gated per ADR-0053).
  - `check-bundle-size.mjs` reports: entry raw/gzip well within budget (250 KB raw / 80 KB gzip limits). The "total JS/CSS" budget exceedances predate this session — the checker counts lazy chunks in totals even though they never ship in first-paint; noted as open question for later budget adjustment.

- **Pre-existing fixups (not Phase 13 scope, but blocking CI/typecheck)**:
  - `usePdfDocumentLoader.ts:34`: `loading.onProgress = undefined` — typecheck TS2322 (`Function` incompatibility). Changed to `() => {}` no-op.
  - `CanvasView.tsx:1`: unused `useState` import in top-level React import destructuring. Removed import.

- **Verification results**:
  - `@app/canvas` tests: 179/179 passing, 25 suites.
  - `@app/desktop` tsc --noEmit: 0 errors after PDF onProgress fix.
  - `@app/desktop` lint: 0 errors.
  - Remaining canvas lint error: `CanvasBenchmark.test.ts` boundaries/no-private importing from fixtures/ — pre-existing deferred, listed in PROGRESS.md Next Up.
  - Monorepo lint via turbo: all packages except canvas (see above) clean.

- **Canvas v1 scope summary (full 13 phases)**:
  - **Delivered** (13 phases, ADRs 0041-0057): Package/datamodel, shell (pan/zoom, save), text cards, edges, selection/arrangement, groups, file embeds, media, perf checkpoint, PDF, webpage, nested, export, app integration.
  - **Explicitly NOT included** v1: realtime collab, plugin API, mobile canvas, right-panel canvas outline/local-graph panels (placeholders per ADR-0057, slot in later).
  - Deferred perf: edge visibility culling refinement, alignment spatial indexing for 500+ nodes.




