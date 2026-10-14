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
| [0008](adr/0008-manifest-diff-sync-not-crdt.md) | Sync: manifest-diff file sync, not CRDT (Yjs) | Superseded by [0116](adr/0116-sync-via-drive-syncthing-no-owned-backend.md) |
| [0011](adr/0011-changesets-and-trunk-based-branching.md) | Changesets + trunk-based branching | Accepted |
| [0017](adr/0017-provisional-bundle-identifier.md) | Bundle identifier `com.davinci.notes` (provisional) | Accepted |
| [0152](adr/0152-local-git-engine-and-lazy-load-boundary.md) | Local version history uses opt-in system Git; no git2-rs/libgit2 binary cost and a real dynamic-import boundary | Accepted |
| [0153](adr/0153-automatic-local-version-commit-batching.md) | Local version history auto-commits 2-second post-save Markdown batches; Command Palette can flush a manual version | Accepted |
| [0154](adr/0154-local-history-panel-diff-and-safe-restore.md) | Local history lives in the right sidebar with an in-project line diff and append-only restore commits | Accepted |
| [0155](adr/0155-generic-git-remote-credentials.md) | Generic Git remotes use HTTPS PATs stored in the OS keyring; SSH is deferred and provider detection is cosmetic only | Accepted |

## Desktop Shell

| ADR | Decision | Status |
|---|---|---|
| [0018](adr/0018-baseline-tauri-plugins-preinstalled.md) | Baseline Tauri plugins pre-installed (fs/sql/log) | Accepted |
| [0019](adr/0019-desktop-window-defaults.md) | Window defaults 1200×800, min 640×480 | Accepted |
| [0156](adr/0156-window-chrome.md) | Platform-native custom window chrome: macOS overlay traffic lights, undecorated Windows/Linux controls, shared drag regions | Accepted |
| [0157](adr/0157-file-tree-drag-ui-and-feedback.md) | File tree drag UI: synchronous flat drag preview pill, pure drop effect validation, deferred source dimming, and hover-to-expand | Accepted |
| [0158](adr/0158-file-tree-context-menu-and-folder-crud.md) | File tree context menu: capture-phase click-away dismissal, keyboard navigation, folder-scoped creation, and transactional folder rename/delete | Accepted |
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
| [0098](adr/0098-embed-iframe-sandbox-permissions.md) | Embeds use fixed minimal sandbox, deny-by-default permissions, and no referrer | Accepted |
| [0099](adr/0099-embed-url-host-restrictions.md) | Embeds allow only validated public HTTP(S) URLs and visibly block local/internal targets | Accepted |
| [0100](adr/0100-embed-click-to-load.md) | Embeds use fixed click-to-load behavior to avoid unsolicited network/code execution | Accepted |
| [0101](adr/0101-embed-placeholder-widget.md) | Iframe blocks reuse the structural HTML widget with a hostname placeholder and activation-only iframe creation | Accepted |
| [0102](adr/0102-youtube-image-embed-forms.md) | Only canonical YouTube watch and youtu.be image URLs convert to the existing iframe path; Shorts and near misses are excluded | Accepted |
| [0103](adr/0103-tweet-static-card.md) | Tweet image syntax uses a click-to-load script-free static oEmbed card, never widgets.js or a tweet iframe | Accepted |
| [0104](adr/0104-embed-web-pages-closeout.md) | Embed Web Pages closeout: security decisions indexed; Canvas web-page cards remain separately scoped | Accepted |
| [0105](adr/0105-youtube-thumbnail-facade.md) | YouTube uses an hqdefault thumbnail facade and click-to-play; generic and tweet embeds keep their existing placeholders | Accepted |
| [0106](adr/0106-youtube-facade-click-activation.md) | YouTube activation suppresses CodeMirror mousedown selection, swaps synchronously on click, and permits autoplay only for explicit facade activation | Accepted |
| [0107](adr/0107-provider-scoped-iframe-sandbox.md) | Remove invalid `allow-presentation`; only validated YouTube embeds receive `allow-same-origin`, arbitrary hosts retain strict `allow-scripts` | Accepted |
| [0108](adr/0108-attachments-provisional-formats.md) | Attachments begin with a centralized provisional common-media/PDF extension allowlist pending the authoritative reference | Provisional |
| [0109](adr/0109-attachments-location-model.md) | Attachment locations use four serializable modes and a pure note-path resolver backed by the existing settings persistence path | Accepted |
| [0110](adr/0110-attachments-filename-collisions.md) | Attachment collisions use numeric suffixes before extensions and writes use an injected native filesystem adapter | Accepted |
| [0111](adr/0111-pasted-attachment-names.md) | Nameless pasted files use MIME-derived `pasted-<timestamp>.<extension>` names; unknown types fail Phase 2 validation | Accepted |
| [0112](adr/0112-shared-attachment-drop-pipeline.md) | Paste and file-drop share ordered per-file processing, partial success, and a token-based drag-over indicator | Accepted |
| [0114](adr/0114-embed-link-ambiguity-and-typed-resolution.md) | Embed links reuse wikilink candidates, classify accepted files, and return explicit ambiguity/broken-heading states | Accepted |
| [0115](adr/0115-attachments-plan-closeout.md) | Attachments Phases 1–7 closeout; watcher/indexer boundary and deferred embed-kind scope recorded | Accepted |
| [0116](adr/0116-sync-via-drive-syncthing-no-owned-backend.md) | Sync uses independent Drive and Syncthing/folder modes; no owned backend | Accepted |
| [0117](adr/0117-manifest-hashing-boundary.md) | Manifest BLAKE3 hashing is supplied by the Rust/platform I/O adapter; shared JS owns manifest policy | Accepted |
| [0118](adr/0118-drive-file-oauth-verification.md) | Drive `drive.file` is non-sensitive; testing and production OAuth rollout requirements | Accepted |
| [0119](adr/0119-manifest-infrastructure-boundaries.md) | Shared manifest model/persistence in `@app/sync-client`; Rust streams BLAKE3 while JS owns manifest policy and fast-path rules | Accepted |
| [0120](adr/0120-drive-oauth-authentication-and-verification.md) | Desktop PKCE Drive auth with `drive.file`, OS-keychain tokens, refresh/sign-out behavior, and verification rollout posture | Accepted |
| [0121](adr/0121-drive-appdata-scope-correction.md) | Add non-sensitive `drive.appdata` alongside `drive.file` for hidden app-scoped manifest storage; explicit amendment to ADR-0120 | Accepted |
| [0122](adr/0122-sync-conflict-resolution-and-safety.md) | Sync Phase 4 conflict resolution: diff3 for .md, atomic copy for .canvas, device-name copy for binaries, edit-wins for delete-vs-edit | Accepted |
| [0123](adr/0123-syncthing-folder-sync-mode-and-watcher-burst-robustness.md) | Syncthing/folder sync mode: zero daemon IPC, parallel IPC pre-fetch for watcher bursts, conflict recognition & SyncConflictsPanel UI | Accepted |
| [0124](adr/0124-sync-settings-asymmetric-framing-and-mode-isolation.md) | Sync settings UI: asymmetric framing for Drive vs Folder, opt-in default, isolated per-mode configuration panels | Accepted |
| [0125](adr/0125-comprehensive-sync-architecture-closeout.md) | Comprehensive Sync Architecture Closeout across Phases 0–7: zero backend, appDataFolder Drive sync, node-diff3 text merge, atomic canvas/binary conflict copies, watcher burst pre-fetch, asymmetric UI | Accepted |
| [0113](adr/0113-attachment-settings-validation.md) | Specified folders validate/create at first use; invalid subfolder drafts stay local with inline validation | Accepted |





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
| [0126](adr/0126-codemirror-vim-package-choice-and-lazy-load-boundary.md) | Vim keybindings: `@replit/codemirror-vim` in `@app/editor` with dynamic `import()` lazy-load boundary | Accepted |
| [0127](adr/0127-vim-keybinding-conflict-resolution-policy.md) | Vim keybindings: precedence policy for normal/insert modes, Mod shortcuts, and autocompletion | Accepted |
| [0128](adr/0128-vim-mode-indicator-and-escape-hatch-command.md) | Vim mode indicator: CodeMirror event subscription, status bar scoping, and stuck-user escape hatch command | Accepted |
| [0129](adr/0129-vim-ex-command-save-and-tab-close-mapping.md) | Vim Ex command save and tab-close mapping: :w flushes debounced save immediately, :q/:wq close tab via canonical path, :qa/:wqa flush all dirty notes before closing tabs | Accepted |
| [0130](adr/0130-vim-keybindings-integration-architecture-closeout.md) | Vim keybindings integration architecture closeout: complete index across phases 1-6, canvas textarea isolation, performance latency validation, and deferred items summary | Accepted |

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
| [0163](adr/0163-public-theme-scrim-token.md) | Public `--color-bg-scrim` token for modal/dialog backdrops; no strong-border token | Accepted |
| [0165](adr/0165-built-in-theme-loading-and-precedence.md) | Lazy built-in theme CSS, app-level restore cache, and built-in-wins ID policy | Accepted |

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

## Plugins & Extensibility

| ADR | Decision | Status |
|---|---|---|
| [0131](adr/0131-plugin-execution-model.md) | Plugin execution: capability-scoped permissions per plugin, not trusted JS, not worker sandboxing | Accepted |
| [0166](adr/0166-plugin-isolation-and-webview-capability-boundary.md) | Plugins execute in a lazy shared plugin-only webview with mediated network/shell RPC and caller-gated sensitive commands | Accepted; supersedes ADR-0131 execution model |
| [0167](adr/0167-plugin-message-protocol-and-declarative-views.md) | Plugin host/runner contract is a serializable RPC protocol with declarative host-rendered views and async editor operations | Accepted |

## AI

| ADR | Decision | Status |
|---|---|---|
| [0132](adr/0132-ai-provider-abstraction-and-lazy-load-boundary.md) | AI uses modality-neutral local/cloud providers and a dynamic-import subsystem boundary | Accepted |
| [0133](adr/0133-local-ai-model-feasibility-gate.md) | Local inference is not a viable full parallel path at launch; defer until measured | Accepted |
| [0134](adr/0134-ai-cloud-consent-flow.md) | Cloud AI requires explicit provider-named, reversible consent before enablement | Accepted |
| [0135](adr/0135-ai-feature-granular-consent.md) | Semantic search, suggest-links, and ask-vault require independent feature consent | Accepted |
| [0136](adr/0136-ai-embedding-chunking-and-model.md) | Heading/paragraph embedding chunks with incremental hashes and a dedicated embedding model | Accepted |
| [0137](adr/0137-ai-vector-storage-fallback.md) | Store embedding Float32 BLOBs in the existing index DB and rank with application-side cosine scan | Accepted |
| [0138](adr/0138-ai-semantic-search-mode.md) | Semantic search is an opt-in, 3-character-minimum mode in the existing content Search dialog | Accepted |
| [0139](adr/0139-ai-suggested-links-policy.md) | Suggested links use top-5/0.78 defaults, embedding-aligned debounce, right-sidebar placement, and canonical editor insertion | Accepted |
| [0140](adr/0140-ai-ask-your-vault-contract-and-blockers.md) | Ask-your-vault requires distinct consent, starts with 8 retrieved chunks, and cites only context actually sent; implementation blocked on prior transport/storage gaps | Proposed - blocked |
| [0141](adr/0141-ai-cloud-transport-and-key-failure-handling.md) | Cloud provider uses native OpenAI-compatible HTTP transport with explicit stable failure mapping and fixed-probe key validation | Accepted with provider-selection assumption |
| [0142](adr/0142-ai-phase5-gap1-closure.md) | Closes ADR-0140 gap 1 with real transport, keychain storage, and persisted granular consent; gaps 2-3 remain | Accepted |
| [0143](adr/0143-ai-cloud-active-indicator.md) | Existing status bar shows persisted `Cloud AI ready` and request-scoped `Cloud AI transmitting` states | Accepted |
| [0144](adr/0144-ai-remediation-a-durable-chunk-text.md) | Remediation A adds durable chunk text in migration v5 and rejects empty-text context for grounded Q&A | Accepted |
| [0145](adr/0145-ai-remediation-c-citation-opener-status.md) | Remediation C citation callback is defined but production source navigation remains blocked pending host wiring | Proposed - blocked |
| [0146](adr/0146-ai-phase7-lazy-boundary-audit.md) | Phase 7 requires zero AI implementation in the initial entry; settings and indicator use conditional dynamic boundaries | Accepted |
| [0147](adr/0147-ai-remediation-c-citation-opener-closed.md) | Citation click-through reuses canonical `openNote` plus the stable editor wrapper's selection boundary; no parallel navigation mechanism | Accepted |
| [0148](adr/0148-sqlite-index-transaction-ownership.md) | Serialize all vault-index writes with `withDbLock`; centralize transaction ownership in `withDbTransaction` and suppress only already-ended rollback failures | Superseded by [0168](adr/0168-vault-index-write-lock-contention-and-universal-lock-discipline.md) |
| [0149](adr/0149-ai-provider-classification-and-provider-specific-consent.md) | Gemini/OpenRouter are cloud; Ollama is local-networked with localhost-only local consent, remote warning, and explicit OpenRouter downstream-routing copy | Accepted |
| [0150](adr/0150-ai-ask-your-vault-host-mount.md) | Mount ask-your-vault as a consent-gated lazy right-sidebar section; load Q&A/provider only when a question is submitted | Accepted |
| [0151](adr/0151-ai-provider-readiness-requires-keychain.md) | A cloud provider is ready only when its persisted status and provider-specific Keychain credential are both present | Accepted |
| [0159](adr/0159-emoji-icons-and-offline-picker.md) | Emoji icon storage and offline picker boundary | Accepted |
| [0160](adr/0160-editor-font-settings-and-self-hosted-fontsource.md) | Vault-scoped editor font settings with self-hosted lazy Fontsource assets | Accepted |
| [0161](adr/0161-external-vault-change-reconciliation.md) | Debounced external vault change reconciliation and dirty-editor conflict policy | Superseded by [0170](adr/0170-save-time-external-change-guard-and-append-merge.md) |
| [0162](adr/0162-unified-custom-window-controls.md) | Custom window controls across macOS, Windows, and Linux | Accepted |
| [0164](adr/0164-public-theme-status-and-shadow-tokens.md) | Public semantic status-tint and shared shadow-ink tokens | Accepted |
| [0168](adr/0168-vault-index-write-lock-contention-and-universal-lock-discipline.md) | Universal `withDbLock` serialization for index reads and writes, batch removals, and unified transaction boundaries | Accepted |
| [0169](adr/0169-ui-decoupling-from-sqlite-index-and-unhandled-rejection-resilience.md) | Decouple UI tab opening from SQLite indexing, capped exponential backoff for SQLITE_BUSY, and error boundaries | Accepted |
| [0170](adr/0170-save-time-external-change-guard-and-append-merge.md) | Save-time external change guard with append-aware merge and conflict copy on exit (supersedes 0161) | Accepted |
| [0171](adr/0171-capture-window-sql-permission-and-quick-search.md) | Capture window SQL permissions and direct indexer quick search with WAL mode and native note activation | Accepted |
| [0172](adr/0172-tray-click-to-capture-popover-and-left-click-setting.md) | Tray left-click popover toggle for quick capture with monitor work area clamping and left-click setting | Accepted; target superseded by [0180](adr/0180-quick-capture-note-creation-and-destination-options.md) |
| [0173](adr/0173-curated-editor-fonts-and-custom-font-input-sanitization.md) | Curated editor fonts and custom font input sanitization with self-hosted font-display swap | Accepted |
| [0174](adr/0174-curated-editor-fonts-and-vim-monospace-mode.md) | Curated editor fonts and vim monospace mode with lazy Latin woff2 assets | Accepted |
| [0175](adr/0175-editor-insert-registry-and-lazy-menu.md) | Immutable editor insert registry, lazy header menu, and CodeMirror snippets | Accepted |
| [0176](adr/0176-editor-slash-menu-trigger-rules-and-shared-recent-store.md) | Editor slash menu trigger exclusions, Vim modal preservation, palette commands, and shared recent store | Accepted |
| [0177](adr/0177-editor-media-insert-items-and-dialogs.md) | Editor media insert items, declarative dialogs, and attachment pipeline integration | Accepted |
| [0178](adr/0178-editor-mermaid-diagram-templates.md) | Editor Mermaid diagram templates, sub-grouping, and lazy preview rendering | Accepted |
| [0179](adr/0179-note-embeds-and-safety-guards.md) | Note embeds (![[Note]] and ![[Note#Heading]]), cycle/depth/size guards, debounced live updates, and insert item (extends 0115) | Accepted |
| [0180](adr/0180-quick-capture-note-creation-and-destination-options.md) | Quick capture note creation with optional filename/folder, unique same-second naming, pure append fallback, and exact anchored popover positioning | Accepted; supersedes capture target of 0172 |
| [0181](adr/0181-recent-vaults-registry-and-switch-lifecycle.md) | App-level recent-vaults registry, auto-open launch behavior, and safe vault-switch lifecycle | Accepted |
| [0182](adr/0182-reminder-syntax-and-storage-model.md) | Reminder syntax, task parsing scope, default 09:00 time, and SQLite index storage | Accepted |
| [0183](adr/0183-rust-reminder-scheduler-and-notifications.md) | Rust reminder scheduler, device-local notification state, and background lifecycle | Accepted |
| [0184](adr/0184-reminder-recurrence-syntax-and-completion-model.md) | Reminder recurrence syntax, due-date anchoring, and in-place completion model | Accepted |

