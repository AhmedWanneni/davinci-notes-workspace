# DECISIONS.md — Architecture Decision Log (index)

Browsable index of all architecture decisions. Check this before "fixing" something that looks like an odd choice — it may be deliberate. Each decision's full Context / Decision / Consequences lives in its own file under `docs/adr/`. To add a decision: create a new numbered ADR (`docs/adr/NNNN-<name>.md`) and append a row below. Never edit an accepted ADR to flip a decision — write a superseding ADR instead (append-only; see ADR-0035).

---

## How to use

- Scan the table below to see whether a decision exists for the area you're touching.
- Open the linked ADR for the full rationale before reversing or "fixing" the behavior.
- `PROGRESS.md` carries current state; `docs/HISTORY.md` carries session history. This file only carries decisions.

---

## Platform & Architecture

| ADR | Decision | Status |
|---|---|---|
| [0001](adr/0001-use-tauri-v2-not-electron.md) | App shell: Tauri v2, not Electron (desktop + mobile, ~8 MB) | Accepted |
| [0002](adr/0002-use-react-and-typescript.md) | Frontend: React + TypeScript | Accepted |
| [0003](adr/0003-use-codemirror-6-not-prosemirror.md) | Editor: CodeMirror 6, not ProseMirror/Tiptap | Accepted |
| [0004](adr/0004-store-notes-as-plain-markdown-files.md) | Notes are plain `.md` files, not a database | Accepted |
| [0005](adr/0005-use-sqlite-with-fts5-for-index-and-search.md) | Index/search: SQLite + FTS5, not NoSQL, not Tantivy | Accepted |
| [0007](adr/0007-use-scss-and-postcss-not-tailwind.md) | Styling: SCSS + PostCSS + tokens, not Tailwind | Accepted |
| [0008](adr/0008-manifest-diff-sync-not-crdt.md) | Sync: manifest-diff file sync, not CRDT (Yjs) | Accepted |
| [0011](adr/0011-changesets-and-trunk-based-branching.md) | Changesets + trunk-based branching | Accepted |
| [0017](adr/0017-provisional-bundle-identifier.md) | Bundle identifier `com.davinci.notes` (provisional) | Accepted |

## Desktop Shell

| ADR | Decision | Status |
|---|---|---|
| [0018](adr/0018-baseline-tauri-plugins-preinstalled.md) | Baseline Tauri plugins pre-installed (fs/sql/log) | Accepted |
| [0019](adr/0019-desktop-window-defaults.md) | Window defaults 1200×800, min 640×480 | Accepted |
| [0025](adr/0025-js-side-indexer-rust-io-only.md) | Vault indexing: JS-side `@app/indexer`, Rust for I/O only | Accepted |
| [0026](adr/0026-js-plugin-dialog-for-folder-picker.md) | Folder picker via JS dialog plugin, not Rust `blocking_pick_folder` | Accepted |
| [0038](adr/0038-cube-css-desktop-styling.md) | Desktop styling: CUBE CSS, not CSS Modules | Accepted |
| [0040](adr/0040-obsidian-grid-app-shell.md) | Obsidian-style CSS Grid app shell + DOM preservation on collapse | Accepted |
| [0058](adr/0058-canonical-note-creation-path.md) | Note creation: canonical `createNoteInVault`; no `window.prompt()` | Accepted |
| [0059](adr/0059-new-note-h1-from-filename-no-rename-sync.md) | New-note H1 from filename stem at creation (rename sync superseded by 0060) | Superseded |
| [0060](adr/0060-bidirectional-h1-filename-sync.md) | Bidirectional H1 ↔ filename sync via canonical `renameNoteInVault` | Accepted |
| [0061](adr/0061-canonical-vault-folder-creation.md) | Canonical `createFolderInVault`; empty folders in `allFolderPaths` | Accepted |
| [0062](adr/0062-editor-markdown-formatting-gap-audit.md) | Editor Markdown formatting audit baseline; retain one CodeMirror rendering path | Accepted |
| [0063](adr/0063-direct-codemirror-soft-line-break-decorations.md) | Soft paragraph breaks use direct CodeMirror state decorations | Accepted |
| [0064](adr/0064-canonical-note-delete-and-duplicate.md) | Note delete/duplicate use canonical vault helpers; file-tree drag remains canvas-copy only | Accepted |
| [0065](adr/0065-editor-settings-contract-ownership.md) | `@app/editor` owns editor settings schema/defaults; clients provide storage adapters | Accepted |
| [0066](adr/0066-inline-markdown-formatting-and-highlight-extension.md) | Inline Markdown formatting completeness with GFM Strikethrough and custom Highlight | Accepted |
| [0067](adr/0067-markdown-internal-links-and-image-embeds.md) | Markdown internal links resolve via indexer; images embed via async widget; unified `linkExtension` | Accepted |
| [0068](adr/0068-editor-list-task-live-preview.md) | Viewport-bounded list/task widgets; canonical task `x`; no list-depth cap | Accepted |
| [0069](adr/0069-active-ordered-list-marker-visibility.md) | Keep ordered numerals visible on the active line; preserve raw active bullets/tasks | Accepted |
| [0070](adr/0070-editor-code-block-language-coverage.md) | Initial embedded code grammar: JavaScript/TypeScript-family tags only | Accepted |
| [0071](adr/0071-editor-footnote-and-inline-footnote-scope.md) | Inline footnotes render only in read-only MarkdownView; references/definitions render in both modes | Accepted |
| [0072](adr/0072-editor-markdown-formatting-plan-complete.md) | Phases 1–8 complete the basic Markdown formatting plan; future work is separately scoped | Accepted |
| [0073](adr/0073-editor-mermaid-rendering-and-performance.md) | Mermaid diagrams use dynamically loaded, cursor-gated widgets with 150ms external-update debounce | Accepted |
| [0074](adr/0074-editor-katex-math-rendering.md) | Use dynamically loaded KaTeX for cursor-gated inline/block math; reuse the 150ms debounce policy | Accepted |
| [0075](adr/0075-shared-tag-model-package.md) | Place pure tag parsing, nesting, and canonical identity in dependency-free `@app/core-types` | Accepted |
| [0076](adr/0076-tag-unicode-matching-rule.md) | Tags use Unicode letters/numbers/marks/symbols plus `_`, `-`, `/`, and ZWJ; punctuation and whitespace terminate matches | Accepted |
| [0077](adr/0077-editor-tag-badge-rendering-and-click-stub.md) | Tag badges render with first-seen display casing and a stub click callback in `@app/editor` | Accepted |
| [0078](adr/0078-frontmatter-note-tag-set-and-body-validation.md) | Frontmatter tag bodies share the tag rules via body validators; notes expose `frontmatter`/`inline`/`all` tag sets | Accepted |

## General Search

| ADR | Decision | Status |
|---|---|---|
| [0079](adr/0079-general-search-surface.md) | Full-text/operator Search is separate from the fuzzy Command Palette | Accepted |
| [0080](adr/0080-general-search-sqlite-fts5.md) | Extend `@app/indexer` and SQLite with FTS5; add no search dependency | Accepted |
| [0081](adr/0081-general-search-v1-operators.md) | V1: terms, quoted phrases, `tag:` with optional `#`, and exclusions | Accepted |
| [0082](adr/0082-general-search-package-placement.md) | Place search parsing and execution in `@app/indexer` | Accepted |
| [0083](adr/0083-general-search-parser-edge-cases.md) | Empty `tag:` is a parse error; unknown operators remain plain terms | Accepted |
| [0084](adr/0084-general-search-execution-ranking.md) | Implicit AND; exclusions remove; FTS bm25 ranks text and title/path order ties | Accepted |
| [0085](adr/0085-desktop-live-index-exposure.md) | Workspace state holds the live TagIndex; SQLite singleton remains the FTS authority | Accepted |
| [0086](adr/0086-general-search-plan-closeout.md) | General Search decision index and verification status; benchmark tooling remains an explicit blocker | Accepted |
| [0087](adr/0087-tags-view-counts-and-live-updates.md) | Tags view uses live TagIndex, direct counts, Command Palette action, and vault update counter | Accepted |
| [0088](adr/0088-tags-plan-closeout.md) | Tags plan decision index, explicit scope boundary, and regression closeout | Accepted |
| [0089](adr/0089-html-sanitizer-library.md) | Use DOMPurify in standalone `@app/sanitize`; lazy-load it later | Accepted |
| [0090](adr/0090-html-sanitizer-allowlist-and-css-policy.md) | Exact HTML/class/style allowlist and constrained CSS values | Accepted |
| [0091](adr/0091-html-block-boundaries.md) | HTML blocks require matching tags on contiguous nonblank lines | Accepted |
| [0092](adr/0092-html-inline-rendering-policy.md) | Inline HTML uses the sanitizer; `<s>` shares Markdown styling and comments stay hidden | Accepted |
| [0093](adr/0093-html-markdown-boundary.md) | Markdown inside captured HTML stays literal; Markdown outside the range remains active | Accepted |
| [0094](adr/0094-html-support-plan-closeout.md) | HTML Support closeout: shared sanitizer, opaque HTML range, no canvas/iframe scope expansion | Accepted |
| [0095](adr/0095-html-table-default-styling.md) | Sanitized HTML tables use token-based collapsed borders, cell spacing, and hidden source continuation lines | Accepted |
| [0096](adr/0096-html-block-statefield-widget.md) | HTML blocks use full-range structural decorations from a StateField, not inline ViewPlugin replacements | Accepted |
| [0097](adr/0097-html-block-cursor-gated-source.md) | HTML block widgets reveal source while the selection cursor is inside, matching Mermaid/math live-preview toggles | Accepted |

## Data Model, Indexer & SQLite

| ADR | Decision | Status |
|---|---|---|
| [0006](adr/0006-wikilink-links-table-schema.md) | Wikilink `links` table schema (target/source/resolved) | Accepted |
| [0020](adr/0020-case-insensitive-filename-stem-wikilink-resolution.md) | Wikilink resolution: case-insensitive filename stem | Accepted |
| [0021](adr/0021-link-model-fields-for-index-and-sqlite.md) | Link model fields map 1:1 to `links` columns | Accepted |
| [0022](adr/0022-yaml-package-for-frontmatter-parsing.md) | Frontmatter parsing: `yaml` package in `@app/indexer` | Accepted |
| [0023](adr/0023-ignore-links-inside-code.md) | `parseLinks` ignores links inside code blocks | Accepted |
| [0024](adr/0024-sqlite-schema-location-and-db-name.md) | Schema in `packages/indexer/schema.sql`, DB `vault-index.db` | Accepted |
| [0033](adr/0033-sqlite-settings-table.md) | Settings persisted in SQLite `settings` table | Accepted |
| [0035](adr/0035-never-edit-applied-migration.md) | Never edit an applied migration; new incremental migration only | Accepted |
| [0036](adr/0036-wal-mode-at-connection-time.md) | WAL mode + `synchronous=NORMAL` at connection, not in migration | Accepted |
| [0037](adr/0037-bulk-batching-and-links-conflict-handling.md) | Bulk 50-item batching; DELETE-then-INSERT for `links` | Accepted |

## Editor & UI Features

| ADR | Decision | Status |
|---|---|---|
| [0027](adr/0027-shared-editor-package.md) | Shared `@app/editor` package for desktop + mobile | Accepted |
| [0028](adr/0028-tanstack-react-virtual-for-file-tree.md) | File tree: `@tanstack/react-virtual`, JS-built, flattened | Accepted |
| [0029](adr/0029-backlinks-panel-layout-and-snippet-strategy.md) | Backlinks: indexed query + on-demand `parseLinks` snippets | Accepted |
| [0030](adr/0030-fuzzysort-for-command-palette.md) | Command palette: `fuzzysort` | Accepted |
| [0031](adr/0031-svg-and-d3-force-with-node-capping.md) | Graph view: SVG + d3-force, top-200 node capping | Accepted |
| [0032](adr/0032-graph-node-labels-scale-with-zoom.md) | Graph labels scale with zoom | Accepted |
| [0034](adr/0034-light-theme-defused.md) | Light theme defused for v1 (dark-first) | Accepted |

## Mobile

| ADR | Decision | Status |
|---|---|---|
| [0012](adr/0012-mobile-app-sandboxed-storage.md) | Mobile storage app-sandboxed; changes via sync client | Accepted |
| [0013](adr/0013-mobile-stack-navigation.md) | Mobile navigation stack-based, not multi-pane | Accepted |
| [0014](adr/0014-mobile-graph-view-deferred.md) | Mobile graph view deferred; backlinks-only for v1 | Accepted |

## Design System & Tooling

| ADR | Decision | Status |
|---|---|---|
| [0009](adr/0009-obsidian-dark-theme-color-baseline.md) | Obsidian dark theme as token color baseline | Accepted |
| [0010](adr/0010-storybook-10-essentials-in-core.md) | Storybook 10: essentials in core, `storybook/test` imports | Accepted |
| [0015](adr/0015-ignore-tauri-mobile-gen.md) | `.gitignore`: Tauri mobile `gen/` ignored | Accepted |
| [0016](adr/0016-commit-style-dictionary-output.md) | `.gitignore`: Style Dictionary `tokens/dist/` committed | Accepted |

## Release & Delivery

| ADR | Decision | Status |
|---|---|---|
| [0039](adr/0039-staging-deploy-channel-and-rc-strategy.md) | Staging channel + promote the tested RC binary | Accepted |

## Canvas

| ADR | Decision | Status |
|---|---|---|
| [0041](adr/0041-canvas-package-and-json-canvas-data-model.md) | Canvas package + strict JSON Canvas 1.0 model, lazy-loaded | Accepted |
| [0042](adr/0042-canvas-translation-layer-and-persistence.md) | Translation layer; viewport not persisted; 750ms debounced save | Accepted |
| [0043](adr/0043-canvas-native-textarea-for-text-cards.md) | Canvas text cards: native `<textarea>`, not CodeMirror | Accepted |
| [0044](adr/0044-canvas-edge-system-constraints.md) | Canvas edges: token palette, hover handles, midpoint labels, cascade delete | Accepted |
| [0045](adr/0045-canvas-selection-and-arrangement.md) | Canvas selection: Shift axis-lock, internal-only duplicate edges, count gating | Accepted |
| [0046](adr/0046-canvas-group-containment-parentnode-runtime.md) | Canvas groups: runtime `parentNode`/`extent`, spec-compliant bbox serialization | Accepted |
| [0047](adr/0047-canvas-group-nesting-depth-and-selection-propagation.md) | Canvas nesting: 10-level cap, frame-only click with expand-to-members ops, delete cascades | Accepted |
| [0048](adr/0048-reuse-codemirror-readonly-renderer-for-canvas-file-embeds.md) | Canvas file embeds: reuse CodeMirror 6 read-only live preview, no second parser | Accepted |
| [0049](adr/0049-html5-drag-and-drop-for-canvas-file-embeds.md) | Canvas file creation: native HTML5 Drag and Drop from file tree | Accepted |
| [0050](adr/0050-canvas-media-cards-path-references.md) | Canvas media cards: path references (no base64), lazy <img>/<video>, aspect ratio lock | Accepted |
| [0051](adr/0051-canvas-clipboard-paste-and-external-media-vault-storage.md) | Canvas media creation: clipboard paste & external drop saved to vault attachments | Accepted |
| [0052](adr/0052-canvas-viewport-culling-and-render-virtualization.md) | Canvas perf: `onlyRenderVisibleElements`, persistence equality guard, Map-indexed group traversals, zero-alloc alignment | Accepted |
| [0053](adr/0053-canvas-pdf-cards-pdfjs-and-nested-lazy-boundary.md) | Canvas PDF cards: `pdfjs-dist` (~121 KB gzip, core+worker), double-gated nested lazy-load boundary, continuous-scroll canvas rendering | Accepted |
| [0054](adr/0054-canvas-webpage-embed-cards-and-sandboxing-security.md) | Canvas webpage embeds: JSON Canvas `link` node, iframe `sandbox` security whitelist, protocol sanitization, YouTube player transformation | Accepted |
| [0055](adr/0055-canvas-nested-canvas-cards-and-cycle-prevention.md) | Canvas nested canvas cards: runtime ancestor chain tracking (cycle detection) + max depth cap of 3, read-only preview flow | Accepted |
| [0056](adr/0056-canvas-export-webpage-card-fallback.md) | Canvas export: webpage card fallback placeholder for iframe content | Accepted |
| [0057](adr/0057-canvas-right-sidebar-panel-behavior.md) | Canvas right sidebar: explicit "not applicable" empty states per panel; StatusBar shows "Canvas file" chip instead of note stats | Accepted |
