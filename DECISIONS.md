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
| [0001](adr/0001-use-tauri-v2-not-electron.md) | App shell: Tauri v2, not Electron (desktop + mobile, ~8 MB) | Superseded by [0185](adr/0185-mobile-shell-expo.md) |
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
| [0123](adr/0123-syncthing-folder-sync-mode-and-watcher-burst-robustness.md) | Syncthing/folder sync mode: zero daemon IPC, parallel IPC pre-fetch for watcher bursts, conflict recognition & SyncConflictsPanel UI | Partially superseded by [0198](adr/0198-syncthing-local-rest-api-and-keychain-security.md) |
| [0124](adr/0124-sync-settings-asymmetric-framing-and-mode-isolation.md) | Sync settings UI: asymmetric framing for Drive vs Folder, opt-in default, isolated per-mode configuration panels | Accepted |
| [0125](adr/0125-comprehensive-sync-architecture-closeout.md) | Comprehensive Sync Architecture Closeout across Phases 0–7: zero backend, appDataFolder Drive sync, node-diff3 text merge, atomic canvas/binary conflict copies, watcher burst pre-fetch, asymmetric UI | Accepted |
| [0198](adr/0198-syncthing-local-rest-api-and-keychain-security.md) | Syncthing local REST API integration: automatic config discovery, OS keychain fallback, native loopback confinement, and 0 KB QR proxy | Accepted |
| [0199](adr/0199-syncthing-binary-bundling-and-lifecycle-management.md) | Syncthing binary bundling, 0-dependency process lifecycle, config isolation, random port allocation, and crash recovery | Accepted |
| [0200](adr/0200-syncthing-qr-pairing-payload-and-one-tap-confirmation.md) | Syncthing QR pairing URI payload, 5-minute code window rotation, one-tap accept, and auto-vault sharing | Accepted |
| [0201](adr/0201-expo-mobile-scan-to-sync-orchestration.md) | Expo mobile "Scan to sync" orchestration, strict QR payload validation, SAF storage check, and selective folder pairing | Accepted |
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
| [0185](adr/0185-mobile-shell-expo.md) | Mobile shell: Expo (React Native + Expo Router), CodeMirror 6 in DOM component | Accepted |
| [0186](adr/0186-shared-tokens-per-platform-components.md) | Shared tokens, per-platform components; Radix/SCSS desktop-only | Accepted |
| [0187](adr/0187-mobile-vault-storage-hybrid-sandbox-and-saf.md) | Mobile vault storage: hybrid sandbox by default with SAF fallback | Accepted |
| [0188](adr/0188-mobile-fast-capture-destination-and-attachment-routing.md) | Mobile fast capture: standalone Quick Notes by default, configurable Inbox/Daily, desktop attachment rules | Accepted |
| [0189](adr/0189-sync-conflict-resolution-orchestration-and-safety.md) | Sync conflict resolution orchestration: clean 3-way merge when safe, conflict copies when unsafe, delete-vs-edit edit-wins | Accepted |
| [0190](adr/0190-mobile-suspended-sync-semantics-and-background-limits.md) | Mobile suspended sync semantics: foreground/open priority, best-effort short background tasks, pending changes honesty | Accepted |
| [0191](adr/0191-mobile-theme-safety-and-shell-isolation.md) | Mobile theme safe loader rules: pure-CSS sanitization (no remote url/import/scripts) and native shell isolation | Accepted |
| [0192](adr/0192-mobile-local-graph-rendering-and-node-bounds.md) | Mobile local graph view: react-native-svg (0 KB native overhead), 50-node cap, withDbLock concurrency | Accepted |
| [0193](adr/0193-mobile-readonly-canvas-and-cycle-prevention.md) | Mobile read-only JSON Canvas: lazy webview pan/zoom, ancestor chain cycle detection (max depth 3) | Accepted |
| [0194](adr/0194-mobile-expo-sdk-pin-and-dependency-alignment.md) | Mobile Expo SDK pin and dependency alignment: pinned SDK 57 stable, React version ownership, expo-audio migration | Accepted |
| [0195](adr/0195-mobile-vault-onboarding-and-registry.md) | Mobile vault onboarding, multi-vault registry, and storage selection | Accepted |

## Design System & Tooling

| ADR | Decision | Status |
|---|---|---|
| [0009](adr/0009-obsidian-dark-theme-color-baseline.md) | Obsidian dark theme as token color baseline | Accepted |
| [0010](adr/0010-storybook-10-essentials-in-core.md) | Storybook 10: essentials in core, `storybook/test` imports | Accepted |
| [0015](adr/0015-ignore-tauri-mobile-gen.md) | `.gitignore`: Tauri mobile `gen/` ignored | Accepted |
| [0016](adr/0016-commit-style-dictionary-output.md) | `.gitignore`: Style Dictionary `tokens/dist/` committed | Accepted |
| [0163](adr/0163-public-theme-scrim-token.md) | Public `--color-bg-scrim` token for modal/dialog backdrops; no strong-border token | Accepted |
| [0165](adr/0165-built-in-theme-loading-and-precedence.md) | Lazy built-in theme CSS, app-level restore cache, and built-in-wins ID policy | Accepted |
| [0204](adr/0204-mobile-theme-token-surface-and-dimensions.md) | Mobile theme token surface and layout dimensions | Accepted |

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
| [0172](adr/0172-tray-click-to-capture-popover-and-left-click-setting.md) | Tray left-click popover toggle for quick capture with monitor work area clamping and left-click setting | Accepted; target superseded by [0180](adr/0180-quick-capture-note-creation-and-destination-options.md), window behavior superseded by [0225](adr/0225-native-macos-capture-popover-and-nspanel.md) |
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
| [0224](adr/0224-reminders-page-notification-channels-and-scheduled-messages.md) | Reminders page (`davinci://reminders`), notification channels, OS keychain isolation, and Scheduled Messages | Accepted |
| [0225](adr/0225-native-macos-capture-popover-and-nspanel.md) | Native macOS quick capture popover via non-activating NSPanel, Status level, and fullscreen auxiliary collection behavior | Accepted; supersedes popover window behavior of [0172](adr/0172-tray-click-to-capture-popover-and-left-click-setting.md) |

## Web Clipper (planned)

Draft ADRs for the Web Clipper feature. All are **Proposed** — they need owner
input on the open decisions before implementation is considered settled. Phase 1
(`packages/clipper-core`), Phase 2a (the `apps/web-clipper` capture → payload
pipeline), Phase 2b (the React popup on the design system) and Phase 3 part 1 (the
Rust receiver core — validation, auth, loopback listener, webview handshake; the
listener is inert until a later Settings UI calls `clipper_enable`) are already
implemented against these drafts; none is accepted until the owner answers the open
decisions. Plan: `web-clipper-feature-plan.md`. See ADR-0173 ("Open decisions") for
the list.

| ADR | Decision | Status |
|---|---|---|
| [0173](adr/0173-clipper-transport-extension-to-desktop.md) | Clipper transport: clip payload over loopback with a per-install keychain token (loopback-only bind, exact-Host/Origin checks, 2 MiB cap). **Phase 0 verification: the deep-link leg is deferred** — `tauri-plugin-deep-link` needs Rust ≥ 1.90 against the declared `1.77.2` (2.4.10 is the last 1.77.2-compatible release) and macOS schemes are install-time only, for a launch convenience ADR-0178's queue already covers; loopback-only + manual pairing is the path built. Native Messaging deferred. **Phase 3 part 3 built the extension half**: `postClipToDesktop` posts the payload with the bearer token, maps every refusal to the app's own error vocabulary and never throws; the port+token live in one `clipper.pairing` storage entry read as unpaired when malformed; the extension holds its only host permission, `http://127.0.0.1/*`, so the app needs no CORS handling; the extension's new options page shows and edits the pairing | Accepted |
| [0174](adr/0174-clipper-content-extraction-and-markdown-libraries.md) | Content extraction + HTML→Markdown: Defuddle **core** (MIT, `useAsync:false`, synchronous `parse()`) + Turndown/turndown-plugin-gfm — measured 99.6 KB gzip vs 218 KB for `defuddle/full`, because core has no Markdown converter; Readability+Turndown (~16 KB gzip) is the fallback | Accepted |
| [0175](adr/0175-clipper-extension-framework-and-core-package.md) | Extension at `apps/web-clipper` built with WXT (MV3, Chromium first); shared pure-TS `packages/clipper-core`; new `clipper-core`/`web-clipper` boundaries elements | Accepted |
| [0176](adr/0176-clipper-template-engine-execution-split.md) | Template engine split: extension resolves page variables and renders body/properties; desktop resolves vault context, behavior and paths; templates are data only (no eval); one `ClipPayload` schema | Accepted |
| [0177](adr/0177-clipper-vault-write-path.md) | Clipped notes write through the canonical vault write path — Rust authenticates/validates then the main webview calls `createNoteInVault` for `create` and `appendToNoteInVault(path, body, position)` for append/prepend (which reuses `writeAndIndexNote`, so the clip gets atomicity, the disk tracker, dirty-clearing, `withDbLock`/`withDbTransaction` indexing and history — serialized by `queuePerPath`); no extension-side or Rust-side direct write. Implemented in Phase 3 part 2: `create` takes a numeric suffix rather than overwriting, appends carry the body only (never a second frontmatter block), a `top` insert lands after any leading frontmatter, the note's EOL is preserved and the seam becomes one blank line, an open note's buffer wins and a missing note is created — and an unexpected write failure is reported as `app-busy` so ADR-0178's queue retries it. No cold-start buffer: a clip arriving before the webview listens is `app-busy` too | Accepted |
| [0178](adr/0178-clipper-closed-app-queue.md) | Closed-app clips queue in extension storage (bounded to 200 clips / 5 MiB / 30-day expiry, oldest-first eviction) and drain event-driven (no timers) on startup, install, popup open, and user action. Desktop dedupe ledger (`davinci-clipper-ledger.json`, 500 entries) rejects duplicates on `clipId` or identical `(contentHash, relativePath)` | Accepted |
| [0179](adr/0179-clipper-popup-data-flow.md) | Popup data flow: preparation (`prepareClipContext`: page+mode) split from rendering (`renderClipPayload`: template) so a template change does not re-extract, with the one-shot compositions deleted; edit fields show a raw `ClipDraft` while the written `ClipPayload` is the sanitised result; list-valued properties shown but not editable; `contentHash` untouched by edits | Accepted |
| [0180](adr/0180-clipper-receiver-validation-and-lifecycle.md) | Receiver core: the desktop **re-validates and rejects** rather than re-sanitising (a `folder`/`noteName` that is not already the fixed point of `safeName`/`normalizeFolder` is `invalid-path`); 413/`too-large` for size/count breaches vs 422/`invalid-path`/`invalid-payload` for shape; `Host` must be exactly `127.0.0.1:<port>` and a present `Origin` must be an extension origin (token is the real boundary, no CORS headers); the listener is inert until enabled and stops by waking `accept()` with one throwaway connection (no poll); Rust asks the webview and blocks on a 20 s `clipId`-keyed handshake; `constant_time_eq` + `getrandom` are re-used from the existing tree (zero binary delta) | Accepted |

## Mobile Shell

| ADR | Decision | Status |
|---|---|---|
| [0185](adr/0185-mobile-shell-expo.md) | Mobile shell: Expo SDK 53 + React Native + NativeWind, replacing Tauri v2 mobile | Accepted |
| [0186](adr/0186-shared-tokens-per-platform-components.md) | Design system: shared CSS tokens via NativeWind, platform-specific UI primitives | Accepted |
| [0187](adr/0187-mobile-vault-storage-hybrid-sandbox-and-saf.md) | Mobile vault storage: hybrid app sandbox default + SAF/folder picker | Accepted |
| [0188](adr/0188-mobile-fast-capture-destination-and-attachment-routing.md) | Mobile fast capture: share target, daily note routing, attachment collision handling | Accepted |
| [0189](adr/0189-sync-conflict-resolution-orchestration-and-safety.md) | Sync conflict resolution: orchestration and non-destructive safety | Accepted |
| [0190](adr/0190-mobile-suspended-sync-semantics-and-background-limits.md) | Mobile suspended sync semantics, lifecycle events, and OS background limits | Accepted |
| [0191](adr/0191-mobile-theme-safety-and-shell-isolation.md) | Mobile theme safety, dark-first default, and shell isolation | Accepted |
| [0192](adr/0192-mobile-local-graph-rendering-and-node-bounds.md) | Mobile local graph rendering: SVG-based, node bounding, and zoom/pan | Accepted |
| [0193](adr/0193-mobile-readonly-canvas-and-cycle-prevention.md) | Mobile read-only canvas viewer and cycle prevention | Accepted |
| [0194](adr/0194-mobile-expo-sdk-pin-and-dependency-alignment.md) | Expo SDK pin and strict peer dependency alignment | Accepted |
| [0195](adr/0195-mobile-vault-onboarding-and-registry.md) | Mobile vault onboarding, multi-vault registry, and storage selection | Accepted |
| [0196](adr/0196-mobile-vault-storage-and-flow-remediation.md) | Mobile vault storage and flow remediation: object-based fs seam, atomic overwrite, and UI hardening | Accepted |
| [0197](adr/0197-mobile-note-identity-and-rename-safety.md) | Stable note identity via NoteStore, single-pass atomic write, and safe collision-free rename | Accepted |
| [0198](adr/0198-syncthing-desktop-mobile-sync-verification-and-conflict-isolation.md) | Syncthing desktop-mobile sync verification, non-destructive conflict routing, and transfer isolation | Accepted |
<<<<<<< HEAD
| [0199](adr/0199-syncthing-binary-bundling-and-lifecycle-management.md) | Syncthing binary bundling, port isolation, keychain API key, and graceful desktop lifecycle | Accepted |
| [0200](adr/0200-syncthing-qr-pairing-payload-and-one-tap-confirmation.md) | Syncthing QR pairing payload URI, 5-minute rotation window, and one-tap confirm | Accepted |
| [0201](adr/0201-expo-mobile-scan-to-sync-orchestration.md) | Expo mobile scan-to-sync orchestration, camera permission fallback, and payload validation | Accepted |
| [0202](adr/0202-embedded-android-syncthing-and-foreground-service.md) | Embedded Android Syncthing daemon, jniLibs W^X bypass, dataSync foreground service, and keyless native proxy | Accepted |
=======
| [0204](adr/0204-mobile-theme-token-surface-and-dimensions.md) | Mobile theme token surface and layout dimensions contract | Accepted |
| [0205](adr/0205-mobile-obsidian-parity-navigation-shell.md) | Mobile Obsidian-parity navigation shell, slide-out drawer, and leaf switcher | Accepted |
| [0206](adr/0206-mobile-dynamic-theme-lifecycle-and-webview-bridge.md) | Mobile dynamic theme lifecycle, React context provider, and webview postMessage bridge | Accepted |
| [0207](adr/0207-mobile-information-architecture-and-navigation.md) | Mobile information architecture, minimalist navigation, and universal sheet pattern | Proposed |

## Google Integrations

| ADR | Decision | Status |
|---|---|---|
| [0199](adr/0199-google-calendar-oauth-architecture-and-scope-isolation.md) | Google Calendar read-only OAuth architecture, scope isolation, and OS keychain separation from Drive sync | Accepted |
| [0201](adr/0201-calendar-sqlite-cache-and-synctoken-lifecycle.md) | Calendar event SQLite caching, incremental syncToken lifecycle, and withDbLock serialization | Accepted |
| [0202](adr/0202-calendar-ui-shell-and-obsidian-leaf-integration.md) | Calendar UI shell: IconRail entry, lazy-loaded Obsidian CalendarLeaf, and mutually exclusive navigation state | Accepted |
| [0203](adr/0203-calendar-reminder-alerts-and-tray-integration.md) | Calendar reminder alerts (5-minute heads-up) and menu-bar system tray upcoming meeting integration | Accepted |
| [0223](adr/0223-google-calendar-two-way-sync-and-outbox-architecture.md) | Google Calendar two-way sync, ETag concurrency, and persistent outbox architecture | Accepted |

## Web Shell

| ADR | Decision | Status |
|---|---|---|
| [0204](adr/0204-platform-adapter-layer-and-boundary-enforcement.md) | Platform adapter layer (`@app/platform-adapters`) and `eslint-plugin-boundaries` enforcement across desktop and web | Accepted |
| [0205](adr/0205-hybrid-browser-vault-storage-and-web-sqlite.md) | Hybrid browser vault storage (File System Access API + OPFS fallback) and multi-tab `navigator.locks` + `withWebDbLock` SQLite serialization | Accepted |
| [0206](adr/0206-browser-plugin-iframe-sandbox.md) | Browser plugin sandboxing via null-origin `<iframe sandbox="allow-scripts">` and MessageChannel RPC | Accepted |

## CLI & Terminal

| ADR | Decision | Status |
|---|---|---|
| [0204](adr/0204-davinci-cli-architecture-and-quick-capture.md) | DaVinci Notes CLI architecture: standalone Rust binary (`apps/cli`), zero-SQLite v1, 5-tier vault discovery, and atomic quick capture | Accepted |
| [0205](adr/0205-external-editor-resolution-and-handoff.md) | External editor resolution chain (flag -> config -> $VISUAL -> $EDITOR -> nvim/vim/vi), shell-words parsing, terminal handoff, and file refresh | Accepted |
| [0206](adr/0206-in-process-vim-mode-evaluation.md) | In-process Vim mode evaluation: retention of external handoff, rejection of edtui/tui-textarea, and feature-gating future embedded Neovim | Proposed |

## Kanban

| ADR | Decision | Status |
|---|---|---|
| [0208](adr/0208-obsidian-kanban-format-and-lossless-writeback.md) | Obsidian Kanban format compatibility, line-preserving round-trip, and minimal-diff write-back | Accepted |

## Database Table

| ADR | Decision | Status |
|---|---|---|
| [0209](adr/0209-markdown-database-table-format-and-lossless-writeback.md) | Markdown database table format compatibility, lossless line-preserving round-trip, and minimal-diff row splicing | Accepted |

## Bookmarks

| ADR | Decision | Status |
|---|---|---|
| [0210](adr/0210-bookmarks-storage-identity-and-lifecycle.md) | Bookmarks storage in `.davinci/bookmarks.json`, path-based identity, union-by-path sync merge, and lazy-loaded tab leaf | Accepted |

## AI Agent

| ADR | Decision | Status |
|---|---|---|
| [0211](adr/0211-modality-neutral-tool-calling-and-streaming.md) | Modality-neutral Tool Calling Abstraction & Streaming Runtime in `@app/ai-api` and `@app/ai-runtime` | Accepted |
| [0212](adr/0212-agent-safety-jail-and-untrusted-boundary.md) | Agent Safety Jail, Untrusted Data Boundary & Anti-Injection Architecture in `@app/ai-agent` | Accepted |
| [0213](adr/0213-vault-change-ledger-and-transaction-rollback.md) | Vault Change Ledger (`.davinci/agent/history.json`) and Transaction Rollback | Accepted |
| [0214](adr/0214-dedicated-agent-tab-and-lazy-mounting.md) | Dedicated Agent Tab (`davinci://agent`) and Lazy Subsystem Mounting | Accepted |
| [0215](adr/0215-llm-wiki-synthesis-and-moc-architecture.md) | LLM-Wiki Synthesis Engine and Map of Content (MOC) Architecture | Accepted |
| [0216](adr/0216-web-search-grounding-and-untrusted-content.md) | Web Search Grounding and Untrusted Content Boundaries in `@app/ai-agent` | Accepted |
| [0217](adr/0217-google-calendar-write-scope-upgrade.md) | Google Calendar Write Scope Upgrade and Task Sync in `@app/ai-agent` | Accepted |
| [0218](adr/0218-agent-shortcuts-and-scheduled-tasks-engine.md) | Agent Shortcuts and Scheduled Tasks Engine with Catch-Up Review | Accepted |
| [0219](adr/0219-zero-dependency-schema-validator-for-prompt-understanding.md) | Zero-Dependency Schema Validator for Prompt Understanding in `@app/ai-agent` | Accepted |
| [0220](adr/0220-prompt-understanding-pipeline-architecture.md) | Prompt Understanding Pipeline Architecture & Multi-Stage Execution | Accepted |
| [0221](adr/0221-destructive-action-ui-confirmation-gate.md) | Destructive Action UI Confirmation Gate & Action Constraints in `@app/ai-agent` | Accepted |
| [0222](adr/0222-scoped-intent-prompts-and-tool-gating.md) | Scoped Intent Prompts and Tool Gating for Weak Models in `@app/ai-agent` | Accepted |

## Meeting Recorder & AI Listening

| ADR | Decision | Status |
|---|---|---|
| [0226](adr/0226-native-desktop-dual-channel-audio-loopback-architecture.md) | Native Desktop Dual-Channel Audio Loopback Architecture with `cpal` | Accepted |
| [0227](adr/0227-lazy-loaded-transcription-pipeline-and-sidecar-contract.md) | Lazy-Loaded Transcription Pipeline and Sidecar Contract (Cloud + Local Whisper) | Accepted |
| [0228](adr/0228-dedicated-ai-listening-workspace-page.md) | Dedicated AI Listening Workspace Page (`davinci://listening`) | Accepted |
| [0229](adr/0229-non-destructive-vault-grounding-and-wikilink-suggestion-engine.md) | Non-Destructive Vault Grounding & Wikilink Suggestion Engine with SQLite FTS5 | Accepted |
| [0230](adr/0230-meeting-note-markdown-schema-and-canonical-vault-persistence.md) | Meeting Note Markdown Schema & Canonical Vault Persistence | Accepted |
| [0231](adr/0231-calendar-event-proximity-detection-and-note-taking-prompt.md) | Calendar Event Proximity Detection & Note-Taking Prompt | Accepted |

## Git Manager

| ADR | Decision | Status |
|---|---|---|
| [0232](adr/0232-git-manager-phase-0-audit-and-capabilities.md) | Git Manager Phase 0 Verification Audit, System Git CLI Baseline & Capabilities | Accepted |
| [0233](adr/0233-git-manager-settings-and-lazy-boundary.md) | Git Manager Activation Setting and Lazy-Loaded Monorepo Boundary | Accepted |
| [0234](adr/0234-git-manager-status-engine-and-porcelain-v2.md) | Git Manager Status Engine and Porcelain v2 Parsing | Accepted |
| [0235](adr/0235-git-manager-staging-discard-and-commits.md) | Git Manager Staging, Discard, and Commit Operations | Accepted |
| [0236](adr/0236-git-manager-diff-viewer-and-hunk-staging.md) | Git Manager Diff Viewer and Hunk Staging | Accepted |
| [0237](adr/0237-git-manager-history-graph-and-commit-detail.md) | Git Manager History Graph and Commit Detail | Accepted |
| [0238](adr/0238-git-manager-branch-management-and-dirty-tree-guard.md) | Git Manager Branch Management and Dirty Tree Guard | Accepted |
| [0239](adr/0239-git-manager-remote-sync-and-keychain-credentials.md) | Git Manager Remote Sync and Keychain Credentials | Accepted |
| [0240](adr/0240-git-manager-conflict-resolution-and-merge-lifecycle.md) | Git Manager Conflict Resolution and Merge Lifecycle | Accepted |
| [0241](adr/0241-git-manager-stabilization-perf-and-close-out.md) | Git Manager Stabilization, Performance Budget Verification and Close-Out | Accepted |

## Release Management & Distribution

| ADR | Decision | Status |
|---|---|---|
| [0242](adr/0242-release-versioning-and-manifest-synchronization.md) | Release Versioning, Single Source of Truth, and Manifest Synchronization | Accepted |




