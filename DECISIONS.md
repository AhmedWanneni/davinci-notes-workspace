# DECISIONS.md — Architecture Decision Log

Non-obvious decisions and their rationale. Check here before "fixing" something that looks like an odd choice — it may be deliberate. Append new entries at the bottom, don't edit past entries (add a superseding entry instead if a decision changes).

---

### App shell: Tauri v2, not Electron
Rust + native webview, ~8MB bundle vs Electron's ~150MB, lower idle memory, faster startup. v2 (stable as of Oct 2024, actively released through 2026) supports desktop *and* mobile (iOS/Android) from one codebase — this was the deciding factor over Electron, which has no mobile path.

### Frontend: React + TypeScript
Matches existing skillset. No framework debate needed — this was a fit-to-existing-experience call, not a technical necessity.

### Editor: CodeMirror 6, not ProseMirror/Tiptap
This is what Obsidian itself uses. Markdown stays the source of truth; live-preview rendering is a decoration layer on top, not a separate WYSIWYG document model. ProseMirror is more WYSIWYG-first and fights against "raw markdown is the file."

### Data storage: plain `.md` files on disk, not a database
Core to the local-first value proposition — portable, grep-able, no lock-in, works with any external tool. The app is a *view* over a folder, not the owner of the data.

### Index/search: SQLite + FTS5, not a NoSQL store, not Tantivy
Data is inherently relational (notes, links, tags — join-shaped queries like "notes tagged X linking to Y"). NoSQL doesn't fit. Tantivy was considered for search-ranking quality but rejected for v1: it would mean maintaining two data stores in sync for marginal gains on a problem (structured + text queries together) SQLite already handles well. Revisit only if search relevance becomes a real user complaint.

### Wikilink schema: `links` table with target/source/resolved columns, indexed on target
Makes backlinks a single indexed query instead of a full-vault scan. Must support: plain links, `|alias`, `#heading`, `#^block-id`, and unresolved links (target doesn't exist yet, still rendered, click-to-create). Rename propagation (rewriting `[[old name]]` across the vault) is the highest-risk feature here — plan for it explicitly, don't bolt it on later.

### Styling: SCSS + PostCSS, not Tailwind, not a hybrid
The app's aesthetic (editorial, typography-driven, borders-as-depth, deliberately not the common AI-generated-UI look) doesn't map to utility-class composition. Tailwind's defaults actively fight this direction. A hybrid was rejected too — two styling systems means AI-generated code inconsistently reaches for whichever one first, undermining the file-organization discipline. Token layer (SCSS vars + CSS custom properties) gives the consistency benefit Tailwind would have provided, without the utility-class syntax mismatch.

### Sync: manifest-diff file sync, not CRDT (Yjs)
The actual problem is single-user, multi-device, rarely-simultaneous editing — not live multi-user collaboration. CRDTs solve a harder problem than the one that exists. Sync operates at the file layer (hash + mtime comparison, push/pull whole files) underneath the editor, not inside it. Conflicts (rare, same note edited on two devices since last sync) are resolved Dropbox-style: server version wins, losing version saved as a conflicted copy file, resolved manually. Revisit CRDTs only if true live cross-device sync or multi-user collaboration becomes an actual goal — treat that as a distinct, larger-scope feature, not a v1 requirement.

### Design tokens: Obsidian dark theme as color baseline
Color tokens in `packages/design-system/tokens/src/color.json` are sourced from Obsidian's published dark theme (`#1e1e1e` bg, `#dcddde` text, `#7f6df2` accent). These are starting values, not final brand-locked — validate against a running Obsidian instance before treating as canonical. Success/warning semantic colors for Badge are **not yet tokenized**; `Badge.module.scss` uses placeholder hex (`#2ecc71`, `#f1c40f`) until confirmed.

### Storybook 10: essentials merged into core
`@storybook/addon-essentials` removed from dependencies (empty/deprecated since SB 9). Controls, actions, and viewport ship in `storybook` core. Interaction test imports use `storybook/test`, not `@storybook/test`.

### Changesets over semantic-release; trunk-based branching
Changesets chosen for independent per-package versioning in the monorepo. Trunk-based branching (main + short-lived PRs) chosen over GitFlow for simplicity given small team size.

### Mobile storage: app-sandboxed, not arbitrary folder access
iOS/Android don't allow desktop-style folder access. Vault lives in app-private storage; all external changes arrive through the sync client, not a filesystem watcher (which desktop uses instead, since sync clients like iCloud/Dropbox can write directly into a folder there).

### Mobile navigation: stack-based, not multi-pane
Desktop's multi-pane/split-view model doesn't translate to a phone screen. Backlinks/graph/tags become sheets or dedicated screens rather than always-visible panels.

### Mobile graph view: scoped down or deferred
Weaker mobile GPUs + small screens make full force-directed graph rendering a real risk. Default to backlinks-only on mobile for v1; revisit full graph rendering only after validating it's actually needed once the app is in daily use on a phone.

### `.gitignore`: Tauri mobile `gen/` ignored
`apps/*/src-tauri/gen/` is gitignored — Tauri regenerates iOS/Android native project scaffolding via `tauri ios init` / `tauri android init`. Keeps the repo free of large, churn-heavy generated platform code. CI/mobile dev docs should document the regen step.

### `.gitignore`: Style Dictionary output committed
`packages/design-system/tokens/dist/` (SCSS vars, CSS custom properties, typed TS) is **committed**, not ignored. Output is small, human-readable, and useful to diff in PR review when token source JSON changes. CI still runs `build:tokens` to verify generated output matches source.

### Desktop bundle identifier: `com.davinci.notes` (provisional)
No bundle ID was documented in repo docs when scaffolding `apps/desktop`. Used `com.davinci.notes` derived from the workspace name — **confirm or replace before any App Store / notarization work**. Change in `apps/desktop/src-tauri/tauri.conf.json` → `identifier`.

### Desktop shell: baseline Tauri plugins pre-installed
`tauri-plugin-fs` (with `watch` feature for vault file watching), `tauri-plugin-sql` (SQLite feature for FTS index), and `tauri-plugin-log` (debug builds only) are registered in `src-tauri/src/lib.rs` with default capabilities — not wired to app features yet, so future sessions don't start from zero on plugin setup. File watching lives in the fs plugin's `watch` feature, not a separate crate (Tauri v2).

### Desktop window defaults
Initial window 1200×800, minimum 640×480 — sized for a future multi-pane note app shell, not a minimal dialog. Deliberately larger than Tauri's 800×600 default.

### Wikilink resolution: case-insensitive filename stem
Wikilink targets resolve against the **filename stem** (path basename without `.md`), compared case-insensitively — not against frontmatter `title`. Matches Obsidian's default "link name = file name" convention and keeps resolution independent of parsed metadata. When two notes share the same stem in different folders, the **alphabetically first vault-relative path** wins (deterministic, testable); ambiguous links are a known v1 limitation until a disambiguation UI exists.

### Link model fields for index + SQLite
`Link` in `@app/core-types` adds `targetRaw`, `heading`, and `blockId` beyond the minimal shape in `stack-architecture.md`, so parsed links map 1:1 onto the `links` table columns (`target_raw`, `heading`, `block_id`) without ad hoc transforms at insert time.

### Frontmatter parsing: `yaml` package in `@app/indexer`
YAML frontmatter uses the `yaml` npm package (~25 KB min gzip per bundlephobia — acceptable for indexer-only use, not shipped in initial editor bundle until vault indexing runs). Malformed YAML returns `{ frontmatter: {}, error }` without throwing; missing frontmatter returns `{}`.

### parseLinks: ignore links inside code
Fenced code blocks and inline backtick spans are masked before link extraction so `[[wikilink]]` inside examples does not pollute the graph — aligns with how users expect code samples to behave.

### SQLite index schema location + DB name
Canonical DDL lives in `packages/indexer/schema.sql` (shared desktop/mobile). Rust applies it via `include_str!` in `apps/desktop/src-tauri/src/db.rs` as migration v1. Connection string: `sqlite:vault-index.db`, preloaded in `tauri.conf.json`. `links` includes a surrogate `id` column so multiple outbound links from the same note to the same target (different headings/block refs) can coexist; `idx_links_target` on `target_path` preserved per original backlink-query design.

### Desktop vault indexing: JS-side `@app/indexer`, Rust for I/O only
Phase 5 boundary: **parsing and graph logic stay in `@app/indexer` (TypeScript in the webview)** — not ported to Rust, not compiled to WASM. Rust handles vault-scoped file I/O (`fs.rs`), debounced filesystem watching (`watcher.rs` via `notify-debouncer-full`, 400 ms batch window), and vault path state. The frontend orchestrates vault open → `list_notes` / `read_note` IPC → `noteFromMarkdown` → SQLite writes via `@tauri-apps/plugin-sql` (`sqliteIndex.ts`). Incremental watcher reconciliation re-indexes only changed/removed paths, not the full vault. Rationale: reuses Phase 4 unit tests unchanged; avoids duplicating wikilink/frontmatter logic in Rust or adding a WASM bridge. Tradeoff: initial full index reads each file over IPC sequentially — acceptable for v1; batch/parallel reads or a Rust-side worker are future optimizations if the baseline regresses.

### Vault folder picker: JS `@tauri-apps/plugin-dialog`, not Rust `blocking_pick_folder`
`open_vault` Rust command accepts a **path string only**. Folder selection uses `@tauri-apps/plugin-dialog` `open({ directory: true })` in the webview (`pickVaultFolder.ts`). Rust `blocking_pick_folder()` inside a sync Tauri command was freezing the entire app on macOS (main-thread block). Watcher starts **after** initial index completes; watcher events are suppressed/paused during index + reconcile to prevent read→event→reindex loops.

### Editor architecture: shared `@app/editor` package for desktop and mobile
We implemented the CodeMirror 6 editor inside a shared workspace package (`packages/editor` re-exported as `@app/editor`) instead of app-local logic in `apps/desktop`. Rationale: Aligning with `mobile-app-stack-architecture.md`, the editor's core logic is identical across platforms but requires distinct layout wrappers and platform-specific options (e.g. folderpicker storage paths on desktop vs app private sandbox on mobile). We parameterized the workspace metadata (`notePaths`, `sourcePath`, and `onLinkClick` navigation callbacks) so the React component remains completely storage-agnostic, easing the path for mobile-specific touch customization without duplicated configurations.

### File Tree Virtualization: `@tanstack/react-virtual`
Used `@tanstack/react-virtual` for virtualizing the file tree in the sidebar (Phase 7). A file tree has dynamic height, nested collapsible folders, and needs to handle thousands of items without dropping frames. This library is very lightweight (~3.5KB), headless, and supports dynamic list items cleanly. We flatten the nested tree into a list of "visible nodes" based on folder expand/collapse state, allowing standard flat-list virtualization to work effectively. We deliberately build the tree synchronously in JS from `allNotePaths` instead of calling the Rust IPC `get_file_tree` on every watcher update to avoid excessive serialization overhead and lag, achieving <10ms re-renders for large fixture vaults.

### Backlinks Panel Layout & Context Snippet Strategy
Phase 8 Backlinks Panel (`BacklinksPanel`) is placed as a dedicated right sidebar in `App.tsx` (`App.module.scss`). It queries the SQLite `links` table indexed on `target_path` via `queryBacklinkSources` to instantly find referencing notes without scanning the vault. To provide context snippets with the link highlighted without mutating the SQLite schema or adding a database migration, source note content is loaded (from memory or cached IPC read) and parsed with `parseLinks` on demand, rendering snippets in <5ms.

### Command Palette / Quick Switcher Fuzzy Matcher: `fuzzysort`
Phase 9 uses `fuzzysort` for keyboard-driven quick switching. It was chosen because it is exceptionally fast, lightweight (~6kb gzipped), and most importantly, it comes with built-in highlighting capabilities (`result.highlight(...)`) designed explicitly for Sublime/Obsidian-style match visualization. This aligns perfectly with `PERFORMANCE.md` rules to avoid heavy libraries and unnecessary main-thread overhead, allowing instant (<1ms) title matching across thousands of notes.

### Graph View Rendering Strategy: SVG + d3-force with Node Capping
Phase 10 implements the Graph View using `d3-force` (~5.5KB gzip) for the physics simulation and standard **SVG** for rendering, rather than `react-force-graph` (Canvas/WebGL). 
Rationale: SVG allows us to seamlessly style the graph elements (nodes/edges) using our existing SCSS design system tokens (`var(--color-bg-overlay)`) and primitives (Radix `Tooltip`), which would be difficult to replicate perfectly in Canvas. 
Performance Capping: To ensure SVG rendering doesn't drop frames on large vaults (per `PERFORMANCE.md`), the Global Graph implements a strict capping strategy. Nodes are sorted by degree (number of connections), and only the top 200 most-connected nodes are rendered. This keeps the DOM tree small (<500 elements including edges) and guarantees a smooth 60fps pan/zoom experience (via `d3-zoom`) while avoiding the useless "hairball" visualization that happens when rendering thousands of nodes.

### Graph View Node Labels: Scaling with Zoom
Node title labels are rendered natively in SVG `<text>` elements below each node. These labels are inside the zoom-controlled `<g>` container, meaning **they scale visually as the user zooms in or out**. 
Rationale: In dense graph clusters, fixed-size labels would overlap and create a completely unreadable block of text. Allowing them to scale naturally means users can zoom into a cluster to read the node titles, matching standard map/graph UX expectations. The font styling uses standard design-system tokens (`var(--font-ui)`, `var(--type-scale-xs)`).

### Settings Persistence: SQLite (Phase 11)
App preferences (e.g., Editor Font, active Vault Path) are persisted locally across restarts. Instead of pulling in `tauri-plugin-store` or writing raw JSON files via fs APIs, we created a simple `settings` table in the existing `vault-index.db` SQLite database (`key`, `value`).
Rationale: The SQLite DB is already wired perfectly and avoids introducing new dependencies or edge cases with concurrent filesystem writes. `schema.sql` was updated and a `v2` migration was registered in `db.rs` to transparently upgrade existing local databases.

### Light Theme Defusal (Phase 11)
The settings UI intentionally omits a "Light / Dark" theme toggle for v1. 
Rationale: As stated earlier in this doc, the design tokens (`packages/design-system/tokens/src/color.json`) only reflect the baseline Obsidian dark theme values. Adding a broken or partially-functioning theme toggle before light theme design tokens actually exist would violate our standards for UI polish. The app remains dark-first.

### SQLite Migration Strategy (Mid-Iteration Fix)
In Phase 11, we appended the `settings` table directly to `packages/indexer/schema.sql` (which is used as migration v1), while also adding a v2 migration. Because `tauri-plugin-sql` hashes migration strings, changing v1 caused local dev databases to panic. We cleared the local dev database (`~/Library/Application Support/com.davinci.notes/vault-index.db`) to fix this and establish a firm rule: **Never edit an applied migration**. 
Going forward, since the foundational schema (notes, links, settings) is now stable, any further schema modifications must be done exclusively through new, incremental migrations (v2, v3, etc.) rather than modifying v1.

### SQLite Connection Mode: WAL Mode Enabled at Connection Time (Not via Migration)
SQLite WAL (Write-Ahead Logging) mode and synchronous level (`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`) are executed immediately upon connection acquisition in `sqliteIndex.ts` (`getVaultIndexDb()`), outside of any transaction.
Superseding note on Migration v3: Attempts to execute PRAGMAs (such as `PRAGMA synchronous`) inside `tauri-plugin-sql` migrations fail because `tauri-plugin-sql` wraps migration execution inside a SQL transaction, and SQLite forbids safety/journal level changes inside an active transaction (`Safety level may not be changed inside a transaction`). Thus, PRAGMAs are executed directly on the DB handle at connection creation. `journal_mode=WAL` persists in the DB file header once set, while `synchronous=NORMAL` is set on every connection initialization. `.gitignore` ignores `*.db-wal`, `*.db-shm`, and `*.db-journal` sidecars.

### Vault Indexing Bulk Transaction Batching & Links Conflict Handling
### Vault Indexing Bulk Transaction Batching & Links Conflict Handling
Bulk vault indexing (`indexVaultFull`) and watcher reconciliation (`reconcileVaultChanges`) use `persistNotesBatch` chunking notes and links into parameterized bulk SQL operations (50 items per query).
Links Conflict Handling Rationale: The `links` table uses a surrogate `id` column and has **no unique constraint** on `(source_path, target_path)` because multiple outlinks from the same source note to the same target note (e.g. `[[Note#Heading1]]` and `[[Note#Heading2]]`) are valid and must both be preserved. Therefore, upserts (`ON CONFLICT`) are semantically invalid and unsupported on `links`. Instead, we execute `DELETE FROM links WHERE source_path IN (...)` for batch source paths prior to bulk `INSERT INTO links`. Verified 10/10 consecutive vault open/index cycles without lock errors.

### Desktop Styling: CSS Modules → CUBE CSS Migration
Migrated `apps/desktop` from CSS Modules (`Component.module.scss` + `styles.className`) to **CUBE CSS** (Composition, Utility, Block, Exception) with a structured global SCSS architecture (`src/styles/` containing `base/`, `layout/`, `components/`, `utilities/`, `lib/`, and a single `_main.scss` entry point).
Rationale:
- **Methodology Alignment**: Fits the app-layer / thin-block philosophy and design-system token inheritance far better than isolated per-component hashing.
- **BEM + Kebab-Case Enforced**: All desktop-local blocks in `components/` use strict BEM selectors (`.file-tree`, `.file-tree__row`), validated by a Stylelint `selector-class-pattern` rule.
- **Exception Layer via Radix State Attributes**: State variations leverage existing accessible data attributes (`data-state`, `data-active`, `data-size`, `data-selected`) rather than manually synchronizing dynamic React classes.
- **Zero-Dep Class Grouping**: Implemented a lightweight zero-dep `cn()` utility (`src/styles/cn.ts`) supporting CUBE bracket grouping notation in TSX (`className={cn("[ composition ]", "[ utility ]", "[ block ]")}`).
- **Performance & Bundle Gains**: Build-time static SCSS/PostCSS compilation only; gzipped total CSS reduced from 8.05 KB to 6.60 KB with zero runtime JS style recalculation.

### Staging Deploy Channel & Release Candidate Strategy (Phase 13)
- **Staging Channel Workflow**: Configured `.github/workflows/staging-release.yml` to trigger on `main` push and manual dispatch, building native desktop staging artifacts with Turborepo quality gates and size-budget enforcement.
- **Auto-updater & Feed Endpoints**: Staging channel builds target `https://staging.updates.davincinotes.com/{{target}}/{{current_version}}` (distinct from future `stable.updates.davincinotes.com`), enabling independent dogfooding without affecting public production releases.
- **Code Signing Approach**: Configured GitHub Actions secret bindings for macOS Apple Developer ID notarization (`APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) and Windows Authenticode with graceful fallback to ad-hoc local signing when secrets are absent. Documented macOS Gatekeeper bypass instructions for unsigned internal test builds.
- **Build Promotion Rule**: Release candidates (e.g. `v0.1.0-rc.1`) produce binary artifacts (`DaVinci Notes.app`, `.dmg`) that are tested directly. When an RC passes testing, the exact same binary is promoted to stable rather than rebuilt from source.

### App Shell: Obsidian UI Grid Architecture
Restructured `apps/desktop`'s app shell to match the official Obsidian UI composition using CSS Grid:
- **Grid Layout Mechanism**: Root `.app-shell` uses `grid-template-rows: auto 1fr auto` (Top Tab Bar / Shell Header, Main Body Grid, Bottom Status Bar). The middle body uses `grid-template-columns: 40px auto 1fr auto` (Icon Rail, Collapsible File Tree Sidebar, Main Editor Area, Collapsible Right Sidebar).
- **DOM State Preservation on Collapse**: Both sidebars toggle visibility via CSS attributes (`data-collapsed="true"` setting width to 0) rather than conditional unmounting (`{isOpen && <Sidebar />}`). This preserves scroll positions, expanded file tree nodes, and active tab states across collapses.
- **Consolidated Icon Navigation**: Created `IconRail` as the single navigation entry point (File Tree, Search Cmd+K, Global Graph, Daily Notes, Settings, Close Vault) removing ad-hoc sidebar buttons.
- **Properties / Frontmatter Block**: Integrated `PropertiesBlock` directly above the note editor, rendering YAML metadata (tags as `#tag` badges, wikilinks, dates, authors) with collapsible accordion state.
- **Stacked Right Sidebar**: Stacked Linked Mentions (`BacklinksPanel`), Unlinked Mentions placeholder, Note Outline (`NoteOutline` parsing H1–H6), and Local Graph (`LazyLocalGraphPanel`).
- **Live Status Bar**: Thin footer displaying vault state, backlink count, property count, word count, and character count computed dynamically from note content.

### Canvas Architecture & Data Model (Phase 0)
- **Unified Package Placement (`packages/canvas`)**: Data model, JSON Canvas file I/O, and React Flow view components live together in `packages/canvas` (scoped as `@app/canvas`), mirroring the single-package design pattern established by `packages/design-system` and `packages/editor`. This avoids premature package fragmentation while keeping desktop/mobile reuse direct and clean.
- **Strict JSON Canvas 1.0 Compliance**: TypeScript models adhere directly to `jsoncanvas.org/spec/1.0/` without custom extensions. Top-level `nodes` and `edges` arrays are optional in the file format (defaulting to `[]` in memory). Discriminated unions model `text`, `file`, `link`, and `group` nodes, and standard directional edges. Preset colors `"1"` through `"6"` and arbitrary hex colors (`#...`) are supported.
- **Architectural Boundary Enforcement**: ESLint `eslint-plugin-boundaries` element `canvas` (`packages/canvas/**/*`, `mode: "full"`) is restricted to depend only on `@app/core-types` and `@app/design-system`. Dependencies on `apps/*` or `packages/indexer` are forbidden. Verified with an intentional temporary import violation that failed the build prior to cleanup.
- **Lazy-Loading Boundary & Zero Initial Bundle Impact**: `@app/canvas` and its transitive dependency `@xyflow/react` (~55 KB min+gzip) are lazy-loaded on-demand via dynamic `import("@app/canvas")` (`React.lazy`) in `EditorArea.tsx` when a `.canvas` file is opened. Verified via bundle analysis: initial desktop entry chunk (`index-*.js`) contains **0 KB** of canvas or React Flow code, holding initial entry size at **21.08 KB raw / 7.71 KB gzip**.

### Canvas Shell & Translation Layer (Phase 1)
- **JSON Canvas ↔ React Flow Translation Layer**: Created `packages/canvas/canvasTranslation.ts` containing pure mapping functions (`jsonCanvasToReactFlow`, `reactFlowToJsonCanvas`). This decouples the JSON Canvas spec schema from React Flow's internal state representation. Unit tests confirm 100% lossless bidirectional round-trip conversion across all node types (`text`, `file`, `link`, `group`) and directional edge attributes.
- **Viewport Position Non-Persistence**: In accordance with the JSON Canvas 1.0 open specification, `.canvas` files exclusively serialize `nodes` and `edges`. Pan and zoom coordinates are deliberately not written to `.canvas` files to maintain strict spec interoperability with Obsidian and other JSON Canvas tools. React Flow's `fitView` is used on load to automatically frame content cleanly.
- **Unified 750ms Debounced Persistence**: Canvas state changes serialize to JSON in memory and emit to `EditorArea`/`useWorkspaceStore`, reusing the existing 750ms debounced disk saving mechanism (`saveNoteNow`) established for markdown notes.
- **Full `.canvas` Native Vault Support**: Rust backend `fs.rs` and `watcher.rs` updated to discover and monitor `.canvas` files alongside `.md` notes. Sidebar header provides a "New canvas" action that instantly writes a spec-compliant `{ "nodes": [], "edges": [] }` file.

### Canvas Text Cards & Node Translation (Phase 2)
- **Text Editing Approach (Native `<textarea>`)**: Text card content editing uses a lightweight native `<textarea>` rather than embedding CodeMirror (`@app/editor`). Rationale: in-card fields are plain text only for Phase 2; embedding full CM6 instances inside every text card on the canvas would add unnecessary DOM complexity and bundle overhead. Full CodeMirror editing remains dedicated to note editor tabs.
- **JSON Canvas ↔ React Flow Text Node Handling**: Extended `canvasTranslation.ts` to convert `CanvasTextNode` to React Flow node `type: "text"` with full bidirectionality, preserving `id`, `x`, `y`, `width`, `height`, `text`, and `color` properties without extending the JSON Canvas 1.0 spec schema.
- **Node Drag/Resize & Snap Alignment**: Resizing is powered by React Flow's `NodeResizer` component. Dragging leverages React Flow's built-in position handling. Custom node alignment snap (`snapNodeAlignment.ts`) calculates magnetic edge/center alignment against other canvas nodes during drag operations. Visual updates remain immediate; persistence is debounced via the 750ms store writer without triggering store feedback loops during drag.

### Canvas Connections & Edge System (Phase 3)
- **Token-Constrained Edge Color Palette**: Edge colors are explicitly constrained to a fixed 7-option palette mapping the JSON Canvas 1.0 color presets (`"1"` through `"6"`) plus default uncolored to design-system CSS variables (`--color-border-normal`, `--color-text-error`, `--color-text-warning`, `--color-text-success`, `--color-interactive-accent`, etc.) via `canvasEdgeConstants.ts`. This guarantees visual coherence with Obsidian themes and our design system rather than allowing arbitrary unconstrained color pickers.
- **Connection Handles & Hover UX**: Connection handles are placed on all 4 card sides (`top`, `right`, `bottom`, `left`) using `@xyflow/react`'s `<Handle />` with `ConnectionMode.Loose`. To maintain an uncluttered canvas, handles are styled as subtle dots that transition to visible (`opacity: 1`) only when a card is hovered or selected, and are suppressed while in text-edit mode.
- **Edge Labeling via Overlay Renderer**: Edge labels render at the midpoint using `<EdgeLabelRenderer />` and design-system typography. Double-clicking enters an inline input mode with Enter/Escape/blur committing directly back to `CanvasData`. Empty labels render 0 DOM nodes.
- **Cascade Deletion on Node Removal**: Implemented explicit cascade cleanup in `useCanvasNodeChanges.ts` so deleting a node removes all incident edges referencing its ID, preventing dangling edge references in `.canvas` files.

### Canvas Selection & Arrangement (Phase 4)
- **Modifier Key: Shift = Axis Lock During Drag**: Holding **Shift** while dragging one or more nodes constrains movement to the *dominant axis* (horizontal or vertical) after a 5px threshold. This matches Figma/Sketch/Obsidian Canvas conventions. Rationale: Space is already reserved for pan activation (`panActivationKeyCode="Space"`), Ctrl/Cmd for zoom and multi-select toggles; Shift had no drag-time binding and is the established industry convention for axis-constrained drag. No other modifier keys are currently used for canvas drag semantics.
- **Duplicate Edge Semantics: Internal-Only**: When duplicating a selection of nodes, an edge is **copied if and only if both its `source` AND `target` endpoints are inside the selected set**. Edges that cross the selection boundary (one endpoint inside, one outside) are deliberately **not** duplicated. Rationale: Matches Figma, Draw, and Obsidian Canvas default behavior. Crossing-edge duplication would either require creating a new "half-edge" with a dangling reference (invalid) or duplicating the external unselected endpoint (unexpected to users). Keeping only fully-contained internal edges produces clean, predictable output with no ambiguity. Crossing edges remain attached to their original nodes.
- **Keyboard Shortcut: Ctrl/Cmd+D = Duplicate Selection**: Added `⌘D` / `Ctrl+D` to invoke `duplicateSelection()` outside of text-edit mode. Rationale: Universal productivity shortcut (Figma, Keynote, Google Slides, VS Code). Guarded with the same input-field predicate used by select-all (Ctrl/Cmd+A) so it does not fire inside textareas/contenteditable (where it conflicts with browser native "Add bookmark" in some contexts — but those contexts never reach the canvas pane-level listener).
- **React Flow Selection APIs Used As-Is**: Single-click select, marquee (rubber-band) drag-select, and Shift-click add/remove are all powered directly by React Flow's built-in `selectionOnDrag={true}`, `SelectionMode.Partial`, and `multiSelectionKeyCode="Shift"` without modification. Left-mouse-button drags on the empty pane trigger marquee select because `panOnDrag` is restricted to buttons 1 and 2 (middle/right). Only Ctrl/Cmd+A select-all required a small custom keydown listener. No React Flow default was overridden or reimplemented.
- **Button Count Gating for Align vs. Distribute**: Align toolbar buttons enable with ≥ 2 selected nodes. Distribute toolbar buttons enable with ≥ 3 selected nodes. Disabled buttons show explicit count-gate tooltips (e.g. "Select 2+ cards to align", "Select 3+ cards to distribute"). Rationale: Aligning 1 node is a no-op (no target edge), distributing 2 nodes is mathematically meaningless (no gaps to equalize). Explicit tooltips prevent users from wondering why a button is dim.
- **Distribution Behavior: First/Last Anchored**: `distributeNodes` anchors the leftmost (horizontal) / topmost (vertical) node and the rightmost (horizontal) / bottommost (vertical) node to their original positions, then spreads intermediate nodes equally between them. This matches standard design-tool convention and avoids the ambiguity of "centering the whole set or keeping its extent."