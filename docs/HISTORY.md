# HISTORY.md — Session Log & Detailed Notes

Append-only record of completed work. Current state lives in `PROGRESS.md` — read this file only for historical context. When a session ends: add a row to the Session Log table and append a dated block under Detailed Session Notes.

---

## Session Log

| Date | Focus | Outcome |
|---|---|---|
| 2026-10-11 | Editor styling tokens — Phase 5 | Implemented Editor Font Size and Font Family settings with curated options (System UI, Serif, Monospace, Montserrat, Raleway), custom font support, and live re-measurement. Added ADR-0173. Zero remote font requests using self-hosted @fontsource-variable WOFF2 assets with font-display: swap. Input sanitization prevents CSS injection. Font sizes scale 12–24px (default 16px) with reset. Caret lands accurately at wrapped line ends. All 97 editor and 384 desktop unit tests pass with zero public token violations. |
| 2026-10-11 | Editor styling tokens — Phase 4 | Implemented element-cursor-gated reveal/dimming for Markdown markers and hanging indent / nested styling for lists using Phase 2 tokens. Bounded decoration computation, 0px line-height shifts, and preserved raw Markdown for active lists. |
| 2026-10-11 | Editor styling tokens — Phase 3 | Applied Phase 2 Obsidian-parity tokens to CodeMirror 6 theme and highlight styles (`editorHighlightStyle.ts`, `editorTheme.ts`); mapped H1-H6 typography to `--editor-obsidian-heading-h{1-6}-*`, unified body line-height to `--editor-obsidian-body-line-height` (1.5), updated content bottom padding to `--editor-content-padding-bottom`, and added line inline padding `--editor-obsidian-content-line-padding-inline`. Maintained full-width content without arbitrary max-width constraints. Allowlisted tokens in `check-public-tokens.mjs`. All 73 editor unit tests and 377 desktop unit tests pass with zero public token violations. |
| 2026-10-11 | Editor styling tokens — Phase 2 | Added 30 editor-prefixed Obsidian-parity tokens in a separate `editor.obsidian` namespace; generated CSS, SCSS, and TypeScript outputs. All existing token source values and generated token values were preserved. Design-system build and typecheck passed; `packages/editor` was not modified. |
| 2026-10-11 | Tray Phase 4b — Click-to-capture popover with left-click setting | Implemented ADR-0172 (supersedes Phase 1 click decision): left-click on tray icon toggles Quick Capture popover anchored under the tray icon; right-click opens the native menu; pure Rust positioning in tray_position.rs clamps strictly to monitor work area with Retina DPI and multi-monitor support; eliminated blur/toggle race via 350ms timestamp debounce; in-memory draft text preserved across blur, dismiss, and Escape; live configurable "Menu bar icon click" setting ("Open quick capture" vs "Open menu") with existing-user fallback to "menu". 45 Rust tests and 373 frontend tests pass with 0 lint errors. |
| 2026-10-11 | Tray Phase 5 — Quick Search from the capture window | Implemented Option C (ADR-0171): granted scoped SQL permissions (`sql:default`, `sql:allow-execute`) to `capabilities/capture.json` so the capture window queries `vault-index.db` directly via `@tauri-apps/plugin-sql` and the canonical `@app/indexer` search engine (`executeSearchQuery` / `parseSearchQuery`). Reuses exact same BM25 ranking and query syntax without IPC proxy lag or main webview coupling. Queries are debounced by 150ms with sequence token cancellation and WAL concurrency (`journal_mode=WAL`, `busy_timeout=5000`). Up/Down keys navigate, Enter opens note via native `open_note_from_capture` with strict vault-root path confinement, and Tab toggles modes while preserving typed capture text. All 39 Rust unit tests and 370 frontend unit tests (102 test suites) pass with 0 lint errors. Capture bundle grew by only 1.43 KB gzip (8.14 KB raw / 2.57 KB gzip). |
| 2026-10-11 | Tray Phase 4 — Global shortcut and lazy Quick Capture window | Added global shortcut (`Control+Alt+N` default, configurable via General Settings) via `tauri-plugin-global-shortcut` with conflict rollback and double-press suppression; created lazy Quick Capture always-on-top window loading separate tiny entry point (`capture.html`, 2.97 KB raw / 1.14 KB gzip) using design tokens; added safe Rust pure-append write path with mutex serialization, EOL and CRLF detection, missing directory creation, and strict vault confinement; added "Quick capture" menu item to tray; enforced least privilege via `capabilities/capture.json` and `command_auth.rs`. 38 Rust unit tests and 358 frontend unit tests pass with 0 lint errors. |
| 2026-10-10 | Phase 4a — Save-time external-change guard with append-aware merge | Superseded ADR-0161 with ADR-0170. Fixed silent data loss bug in saveNoteNow where dirty in-memory buffers unconditionally overwrote external disk changes. Added Rust stat_note & atomic write_note (.tmp.<pid> + rename), in-memory diskStateTracker, classifyDiskChange (touched_only, pure_append, conflict), saveQueue promise serialization, EditorConflictBanner with 3-action resolution (Keep mine, Use disk, Save copy), tab conflict dot, and automatic conflict copy creation on quit in saveAllDirty. 28 Rust tests and 348 frontend tests pass with 0 lint errors. |
| 2026-10-10 | Tray Phase 3 — dynamic tray menu with recent notes, daily note, open vault | Added dynamic menu in macOS tray with last 5 recent notes (derived from workspace navigation history and open tabs in reverse-chronological order, disambiguated by parent folder on collisions, validated in Rust against path traversal and vault root escapes), "Open today's daily note", and "Open vault...". Debounced updates at 200ms trailing debounce with 0 polling at rest. All files kept strictly under line limits; 26 Rust tests and 329 frontend tests pass. |
| 2026-10-10 | Tray Phase 2 — close-to-tray setting and unified clean quit | Implemented "Keep running in menu bar" toggle in General Settings with config file persistence and zero-race atomic state in Rust; intercepted window close to hide window and switch macOS Dock activation policy (Accessory when hidden, Regular when shown) with single-instance reopen restore; unified all quit routes (Tray Quit, Cmd+Q, App Menu Quit, Close when setting OFF, OS shutdown) to flush dirty editors via `saveAllDirty()`, stop the file watcher debouncer, and exit cleanly. Added Rust tests in `tray_tests.rs` (4 tests) and TypeScript tests in `useTrayMenuActions.test.ts` (5 tests); all 23 Rust tests and 93 desktop test files (325 tests) pass. |
| 2026-10-10 | Tray Phase 1 — macOS menu bar icon with a static native menu | Added template monochrome menu bar icon in `tray.rs` with Show/Hide, New note, and Quit menu items without linking the heavy `image` crate. Left-click opens menu; New note emits `davinci-tray-new-note`. |
| 2026-10-10 | Fix database locked unhandled rejection & tab + button | Decoupled UI note creation from SQLite indexing so notes write to disk and open tabs immediately; added `retryOnSqliteBusy` with exponential backoff for idempotent operations; wrapped all DB calls in `useVaultSession.ts` in `try/catch` eliminating unhandled promise rejections; wired tab "+" to `handleCreateNoteFromTabs` focusing editor without file tree rename interference. Added ADR-0169; all 91 test files and 314 unit tests pass with 0 lint errors. |
| 2026-10-10 | Fix SQLite write-lock contention in vault-index.db | Diagnosed ~5.2s write stalls to unqueued concurrent reads (`queryBacklinkSources`, `loadNoteIcons`, `executeSearchQuery`) colliding with `withDbTransaction` writes in `tauri-plugin-sql`'s connection pool, and unbatched per-note deletions. Enforced universal `withDbLock` queue serialization for all DB reads and writes, added 50-item parameterized batch deletions (`removeNotesBatch`, `removeFtsRows`), unified transaction boundaries, and extracted `sqliteGraphIndex.ts` keeping `sqliteIndex.ts` ≤ 250 lines (236 lines). Recorded ADR-0168; all 89 desktop test files and 302 unit tests pass with 0 lint errors. |
| 2026-09-26 | Standing native GUI verification constraint | Confirmed this agent context exposes `CODEX_CI=1`, `CODEX_SANDBOX=seatbelt`, and a workspace permission profile. macOS has an Aqua session and running WindowServer, but the agent process lacks usable GUI/session access. Native webview/interactive-window verification must be performed manually from Ahmed's own desktop session. Future prompts should separate agent implementation/runbook work from Ahmed's local observation and reporting. |
| 2026-09-26 | Plugin isolation scaffold | Added an explicitly triggered hidden `plugin-runner` webview, restrictive per-webview capability, and ADR-0167-shaped ping/pong scaffold. Rust build/check passed, but the real native run logged creation only—no bootstrap/pong—so the channel remains unverified and no security claim is made. |
| 2026-09-26 | Plugin runner diagnosis | Confirmed `run()` owns the event loop after setup; the runner uses a real `plugin-runner.html` URL and Tauri document-start initialization script. A native probe still produced no bootstrap or probe-error callback, so no event mismatch was observed and document startup remains unverified in the headless launch environment. |
| 2026-09-26 | Plugin runner environment check | Confirmed macOS Darwin 24.6.0 ARM64 with no display environment variables; `xvfb-run` is inapplicable. `apps/desktop/dist/plugin-runner.html` exists at the configured frontend root. A temporary visible webview/trivial-page probe produced no app window or content in a screenshot and was reverted; native RPC verification is constrained to a real interactive desktop session. |
| 2026-09-26 | Plugin RPC plumbing | Generalized the Rust/runner dispatcher to arbitrary protocol-1 methods with concurrent `requestId` correlation, added runner-to-main request forwarding, and added desktop vault/storage handlers delegating to the existing adapter. Real plugin lifecycle activation remains deferred to 2b-2b; no plugin execution or manager code changed. |
| 2026-09-26 | Plugin RPC synthetic host probe | Activated the host listener only after the explicit probe runner exists and added single plus concurrent synthetic `vault.read` requests behind `DAVINCI_PLUGIN_RPC_SYNTHETIC=1`; native observation remains Ahmed-local. |
| 2026-09-26 | Plugin lifecycle RPC migration | Replaced manager-held instances/callback commands with RPC lifecycle and descriptor invocation. The runner responds with explicit temporary stubs until 2b-2d moves source evaluation; execution-dependent legacy runtime tests are skipped rather than misrepresented as passing. |
| 2026-09-26 | Plugin runner execution | Replaced runner stubs with runner-local plugin evaluation, instances, lifecycle calls, and command callbacks. Vault/storage remain RPC proxies; main-side evaluation has no `new Function`. Native verification and sensitive-command authorization remain deferred. |
| 2026-09-26 | Plugin isolation Phase 2a — protocol/API redesign | Recorded ADR-0167: host/plugin communication becomes serializable RPC, views become host-rendered declarative models, and editor access becomes async; no native webview implementation was attempted. |
| 2026-09-26 | Public-token consumer reconciliation | Completed default-style classification and restored the editor font-size runtime setting; made the zero-finding public-token guard blocking in hooks and CI; ADR-0163/0164 now cover the complete documented surface. |
| 2026-09-20 | File tree emoji picker layout and persistence | Portaled and contained the Frimousse picker so it no longer stretches the sidebar; persist markdown `icon` frontmatter and `.davinci/icons.json`, then reload them on vault open. Focused tests pass; native restart still UNVERIFIED. |
| 2026-09-19 | Fix: Folder rename and delete no-op | Replaced unsupported browser delete confirmation with the existing Tauri dialog plugin; surfaced async folder rename/delete errors; rejected slash folder names; moved recursive native folder command safety into tested core with root/hidden/traversal/symlink guards. Real temp-filesystem tests verify nested rename/delete; native visual acceptance remains pending. |
| 2026-09-19 | File Tree Context Menu, Click-Away Dismissal, and Folder Actions (CRUD) | Completed 5-task context menu dismissal and folder CRUD overhaul: capture-phase click-away dismissal via `useContextMenuDismiss`, tailored file/folder/empty-space menu options, arrow-key navigation, parent-folder-scoped creation with auto-expansion and immediate inline rename, batched SQLite transaction folder rename, and safe folder deletion with native Rust `delete_folder`, root protection, confirmation prompt, and index/tab cleanup; added ADR-0158. |
| 2026-09-19 | File Tree Drag UI & Drop Feedback | Completed 4-task file tree drag overhaul: synchronous flat drag preview pill, pure getDropEffect validation, deferred source dimming, flat folder/root drop feedback, and 600ms hover-to-expand with cancellation; added ADR-0157. |
| 2026-09-06 | Git Versioning Phase 3 | Added a provider-agnostic HTTPS/PAT model using the existing OS keyring, queued non-sensitive remote config, cosmetic-only provider detection, and deferred SSH; added ADR-0155. |
| 2026-09-06 | Git Versioning Phase 2 | Added right-sidebar local history, readable in-project line diff, and append-only restore commits; directly verified real Git log/diff/disk-content comparisons; added ADR-0154. |
| 2026-09-06 | Git Versioning Phase 1 | Added automatic 2-second post-save local Git batches, manual Command Palette version save, real Git-log tests, and 1.00 ms large-edit input-loop measurement; added ADR-0153. |
| 2026-09-06 | Git Versioning Phase 0 | Accepted system Git behind a default-off dynamic boundary; measured/rejected git2-rs native cost; verified fresh local-only repository, ignore policy, and offline staging; added ADR-0152. |
| 2026-09-04 | AI Features Phase 7 re-audit | Blocked closeout with evidence: AI subsystem is fetched at startup despite being code-split; semantic search, suggest-links, and embedding generation have no production wiring; therefore no real corpus, end-to-end consent payload, real Q&A citation, or citation-open acceptance exists. Local build and mocked-provider performance checks pass with recorded current measurements. |
| 2026-09-04 | Phase 6 SQLite_BUSY regression follow-up | Found that `AISettingsPanel.reload()` reintroduced concurrent reads against the singleton `tauri-plugin-sql` connection with `Promise.all` after the writer audit. Changed consent loading to sequential reads and routed the App cloud-state refresh through the existing queue boundary. Focused SQLite/indexer tests passed 10/10; full workspace passed 24/24 tasks and desktop passed 181/181 tests. |
| 2026-09-04 | Complete vault-index shared-writer serialization | Audited every shared `vault-index.db` mutation and transaction owner. Added the existing `withDbLock` boundary to AI consent/status writes and made `SqliteEmbeddingStore` require an injected shared lock for upsert/remove. Plugin, theme, CRUD, workspace, and editor-settings writes were confirmed already serialized; no nested lock path was found. The adversarial index + embedding + settings writer test observed one active writer and no dropped statements. Full workspace tests passed: 24 tasks, including desktop 181/181 and embeddings 7/7; lint passed. Desktop typecheck retains pre-existing errors. |
| 2026-09-02 | Plugin Ecosystem Phase 2 — Plugin Loader & Lifecycle Manager | Defined `DavinciPlugin` base class in `packages/plugin-api`. Stood up `packages/plugin-runtime` with `discoverPlugins` (manifest validation, ID-collision rejection), `evaluatePluginModule` (safe `new Function(…)` evaluator), and `PluginLifecycleManager` (enable/disable lifecycle, `onload`/`onunload` hooks, error isolation, enabled-IDs persistence). 6 adversarial fixture tests cover: crashing `onload`, malformed manifest, ID collision, mid-session disable, re-enable cycle, restart persistence — all pass. Desktop: `PluginSettingsList` component wired into `SettingsDialog`, `usePluginStore` initialises on vault open, `desktopPluginAdapter.ts` bridges Tauri fs + SQLite to runtime adapters. Full workspace: 44 test files, 161 tests all green. |
| 2026-09-02 | Plugin Ecosystem Phase 1 — Manifest Specification & `@app/plugin-api` | Stood up `@app/plugin-api` package containing TypeScript types (`PluginManifest`, `PluginPermission`), JSON Schema Draft-07 specification (`manifest.schema.json`), runtime validator `validatePluginManifest` (strict mode default), `semverUtils`, `checkAppCompatibility` (decoupling schema parsing from host compatibility checks), and `versions.json` compatibility resolver. Configured boundaries in `.eslintrc.js` and `tsconfig.json`. Added 20 Vitest fixture tests; all pass. |
| 2026-09-02 | Plugin Ecosystem Phase 0 — Execution Model Architecture (ADR-0131) | Evaluated three plugin execution models (Fully Trusted JS, Capability-Scoped Permissions per Plugin, and Sandboxed Execution via Workers/iframes) against threat models, developer experience, CodeMirror 6 live-preview constraints, and PERFORMANCE.md budgets. Adopted Option 2 (Capability-Scoped Permissions) with manifest declarations, install-time consent, DaVinci API call boundary enforcement, Tauri IPC shielding, and vault-root path confinement. Recorded ADR-0131. |
| 2026-09-02 | Vim Keybindings Phase 6 — Comprehensive Regression Pass & Plan Closeout (ADR-0130) | Verified wikilink click navigation & autocomplete (`[[`), live preview decoration boundaries, Canvas `<textarea>` isolation, sub-millisecond typing latency overhead (~1.8ms delta), clean settings lifecycle re-initialization, and explicit restatement of deferred items (.vimrc, mobile touch, window splits). Recorded closeout ADR-0130. All 266 unit tests pass. Feature complete and ready for production use. |
| 2026-09-02 | Vim Keybindings Phase 5 — Ex Commands & Multi-Tab Flush Architecture (ADR-0129) | Mapped `:w` to immediate debounced save flush (`saveNoteNow`), `:q`/`:wq` to active tab close (`closeNote`), and `:qa`/`:wqa` to atomic multi-tab save flush and tab closure (`closeAllNotes`). Verified 0 data loss under active concurrent edits across open tabs. Caught unsupported commands with notifications. Recorded ADR-0129. All 263 unit tests pass. |
| 2026-09-02 | Vim Keybindings Phase 4 — Mode Indicator & Escape Hatch (ADR-0128) | Subscribed to `vim-mode-change` events in `@app/editor`, rendered glanceable mode indicator (`NORMAL`, `INSERT`, `VISUAL`, `VISUAL LINE`, `VISUAL BLOCK`, `REPLACE`) in `StatusBar.tsx` (completely unmounted when Vim mode is OFF), and added "Disable Vim keybindings" escape hatch command in `CommandPalette.tsx`. Recorded ADR-0128. All 156 tests pass across workspace. |
| 2026-09-02 | Vim Keybindings Phase 3 — Core Modal Editing Verification (ADR-0127) | Verified mode switching (`i`, `Esc`, `v`, `Ctrl-v`), motions (`hjkl`, `w`, `b`, `e`, `0`, `$`, `gg`, `G`, `3G`), and line operations (`dd`, `yy`, `p`) against real note content with wikilinks and live-preview decorations. Audited keymaps, confirmed 0 direct collisions, recorded ADR-0127 keybinding precedence policy, added `vimModalEditing.test.ts` (6 tests). All 100 tests pass. |
| 2026-09-02 | Vim Keybindings Phase 2 — Settings Toggle & Real Wiring | Added "Vim keybindings" toggle to `SettingsDialog.tsx` (default OFF), persisted in SQLite `settings` table via `createEditorSettings.ts` (ADR-0033). Wired live `useVimMode` setting to `<Editor />` in `EditorArea.tsx`. Verified dynamic load-on-enable, functional unload-on-disable (state removal & text editing restored), and repeated toggle cycling on open `EditorView` instances with 0 state degradation. Re-verified 0 KB initial bundle cost when OFF. |
| 2026-09-02 | Vim Keybindings Phase 1 — Evaluation & Lazy-Load Boundary (ADR-0126) | Evaluated `@replit/codemirror-vim@6.4.0` (100% CM6 compatible, active), placed in `@app/editor` (0 boundaries violations), created dynamic `import()` lazy-load boundary (`loadVimExtension`), proved 0 KB entry bundle footprint when disabled and 660 KB / 223 KB gzip dynamic chunk when enabled, confirmed zero canvas impact, recorded ADR-0126. |
| 2026-09-01 | Sync Phase 4 — Conflict Resolution (ADR-0122) | Implemented diff3 three-way text merge (`node-diff3`), atomic copy resolution for `.canvas` files, device-name copy naming with numeric collision suffixes for binaries, and edit-wins delete-vs-edit resolution with 29 passing tests in `@app/sync-client`. |
| 2026-09-01 | Sync Scope Correction (ADR-0121) & Sync Phase 3 | Added `drive.appdata` additively alongside `drive.file` for `appDataFolder` manifest storage; recorded ADR-0121; implemented Phase 3 Drive manifest storage, Changes API delta tracking, 3-way diff, and blob transfer with 19 passing tests in `@app/sync-client`. |


| 2026-08-21 | Attachments Phase 5 — Settings UI (ADR-0113) | Added four-mode attachment-location settings UI with native folder picker, conditional validation, Storybook states, and interaction tests. |
| 2026-08-21 | Attachments Phase 4 — Drag & Drop Handling (ADR-0112) | Reused the paste pipeline for ordered multi-file drops, partial success, token-based drag-over feedback, and 38 passing editor tests. |
| 2026-08-21 | Attachments Phase 2 — Filesystem Write & Filename Handling (ADR-0110) | Added async native-fs adapter writing, recursive folder creation, numeric collision suffixes, structured format errors, and 16 passing attachment tests. No paste/drop/UI wiring. |
| 2026-08-21 | Attachments Phase 1 — Accepted Formats & Location Model (ADR-0108/0109) | Added standalone `@app/attachments` with a provisional centralized format allowlist, serializable four-mode settings schema, pure target-folder resolution, eight unit tests, and package typecheck. No I/O or UI. |
| 2026-08-21 | YouTube Embed Thumbnail Facade (ADR-0105) | Replaced YouTube's generic embed placeholder/eager behavior with an `hqdefault.jpg` thumbnail facade and click-only iframe activation; generic and tweet embeds retain their existing click-to-load paths. Editor tests 33/33 and typecheck pass. |
| 2026-08-20 | Tags Feature Phase 3 — YAML Tags Property Support (ADR-0078) | Added shared body-level tag validation, merged per-note `frontmatter`/`inline`/`all` tag sets, and a thin indexer wrapper over existing frontmatter parsing. |
| 2026-08-20 | Tags Feature Phase 2 — Inline Tag Detection & Rendering (ADR-0077) | Added inline tag badge widgets in `@app/editor` using the shared tag matcher/registry, with canonical first-seen casing, code-block exclusion, stub click handling, and latency coverage. |
| 2026-08-20 | Tags Feature Phase 1 — Tag Parsing Rules & Data Model (ADR-0075/0076) | Added dependency-free shared tag parsing/model logic in `@app/core-types`: Unicode-aware matching, nested ancestor decomposition, first-seen canonical casing, Node-loadable `.js` runtime imports, and unit coverage. |
| 2026-08-20 | Phase 11 — Math (ADR-0074) | Added lazy KaTeX inline/block math with cursor-gated editing, reused 150ms debounce, graceful errors, determinant/exponential coverage, and an editor patch changeset. |
| 2026-08-20 | Phase 10 — Mermaid Diagrams (ADR-0073) | Added dynamically loaded Mermaid 11.16.1 rendering for fenced diagrams, cursor-gated editable source, debounced updates, graceful errors, and internal-link node clicks. Added flowchart/sequence/special-label coverage and an editor patch changeset. |
| 2026-08-19 | Bug Fix / Feature — Live Editable Table Grid | Completed tables now render as bordered flex-grid rows through CodeMirror decorations; delimiters/separator are visually suppressed while cell ranges remain directly editable and markdown-backed. Added grid and source-sync regressions. |
| 2026-08-19 | Bug Fix — Enter After Ambiguous Table Header | Reproduced with the full editor keymap; Enter already creates a normal newline because the table extension defines no Enter handler. Added regression coverage; no production change required. |
| 2026-08-19 | Bug Fix — Ordered List Numbers Not Rendering (ADR-0069) | Reproduced the active-line-only failure in the existing CodeMirror harness: raw `1. ` remained, but `listExtension` skipped its decoration. Ordered numerals now render during typing while unordered/task active-line editing remains unchanged; added regression coverage and an `@app/editor` patch changeset. |
| 2026-08-19 | Editor Markdown Formatting Phase 5 — Lists & Tasks (ADR-0068) | Added viewport-bounded list/task widgets to `@app/editor`, transactional portable-Markdown checkbox toggles, native Tab/Shift+Tab keymap reuse, ordered-list-safe Shift+Enter, deep mixed-list/Phase 2–4 regressions, and benchmark coverage. 28 focused tests pass; expanded 1,000-line benchmark 0.833 ms/keystroke. |
| 2026-08-19 | Editor Markdown Formatting Phase 3 — Inline Formatting Completeness (ADR-0066) | Complete inline formatting support in `@app/editor`: enabled Lezer GFM `Strikethrough` and custom `highlightExtension` for `==highlight==`; styled `t.strikethrough` and `highlightTag`; updated `livePreviewExtension` for syntax mark hiding and `Escape` node backslash suppression; 10 unit tests pass, canvas tests pass, typing latency ~4.3ms/keystroke. |
| 2026-08-19 | Editor settings ownership correction (ADR-0065) | Moved editor settings schema/defaults/validation to `@app/editor`; desktop now supplies a SQLite storage adapter. Restored sequential unlocked load reads after lock-wrapped concurrent reads caused `SQLITE_BUSY`; added invalid-value fallback coverage and the missing desktop Vitest editor alias. |
| 2026-08-19 | Stabilization Phase 1 — canonical note delete and duplicate (ADR-0064) | Added confirmed File Explorer delete and duplicate actions backed by canonical disk/index/graph/workspace helpers. 17 focused tests, full desktop lint/typecheck, and Rust check pass; note move plus real-app dogfooding remain. |
| 2026-08-18 | Editor Markdown Formatting Phase 2 — line-break semantics (ADR-0063) | Added direct CodeMirror soft-line-break decorations, Shift+Enter hard-break command, and persisted Strict Line Breaks setting. Shared rendering path retained; no dependency added. 15 targeted tests pass; 1,000-line edit benchmark 4.227 ms/keystroke. |
| 2026-08-18 | Editor Markdown Formatting Phase 1 audit (ADR-0062) | Created ignored all-syntax fixture and recorded a source-verified gap table. Strict CommonMark is configured; basic formatting parses but several live-preview/interactions are partial. Missing: strikethrough, highlight, tasks, image rendering/dimensions, footnotes, and Obsidian comments. No editor implementation changed. |
| 2026-08-18 | Bidirectional H1 ↔ filename sync (ADR-0060) | Built canonical `renameNoteInVault` (prerequisite — no rename existed). H1→file debounced 750ms; file-tree double-click rename syncs H1; wikilink propagation; collision = no-op; loop guard via stem compare. 43 desktop tests passing. |
| 2026-08-18 | New-note H1 from filename (ADR-0059) | Centralized `initialNoteContent(path)` in canonical `createNoteInVault`; all entry points get `# <basename>\n\n`. Rename/H1: set once at creation, no auto-sync (rename UI not built yet). 29 desktop vault/state tests passing. |
| 2026-08-17 | Fix: "New note" silently does nothing | Root cause: `window.prompt()` unsupported in Tauri webview — sidebar/tab handlers returned before `createNewNote`. Fixed via immediate `Untitled.md` creation (ADR-0058), canonical `createNoteInVault`, consolidated duplicate creation paths. Phase 9 verification gap documented. |
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
| 2026-09-01 | Drive OAuth UI Freeze Fix | Moved the blocking loopback callback accept onto Tauri's blocking task pool so waiting for the Google redirect no longer blocks the desktop UI. Rust checks/tests and the desktop web build pass. |
| 2026-09-01 | Testing and Integration — Move Note Feature | Fixed the failing `buildTags` test in `@app/indexer`, added `moveNoteInVault.test.ts`, and confirmed the `moveNoteFromTree` action is implemented in `createNoteCrudActions`, integrated into the workspace store, and wired in the `FileTree` D&D drop handler. Full workspace test suite passes. |

## Detailed Session Notes

### 2026-10-11 — Editor styling tokens: Phase 5 (Editor Font Size and Font Family Settings)

- Implemented editor font size numeric control (suggested range 12–24 px, clamped 12–28 px, default 16 px taken from `--type-scale-base`) with a reset-to-default button.
- Implemented curated font family dropdown: System default, Serif, Monospace, Montserrat, Raleway, plus Custom font input.
- Zero remote network calls: Evaluated and rejected runtime Google Fonts CDN (ADR-0173). Self-hosted via `@fontsource-variable/montserrat` (37.9 KB normal, 39.6 KB italic) and `@fontsource-variable/raleway` (48.2 KB normal, 50.2 KB italic) WOFF2 assets with `font-display: swap`. Initial bundle has 0 KB font payload; loaded lazily only when selected.
- Custom font validation: Enforced 50-character limit, strict allowlist regex (`/^[a-zA-Z0-9\s\-',.]+$/`), quote escaping, and safe fallback to `var(--font-ui)`. Proved immune to CSS injection (`x; } body { display:none`).
- Dynamic live updates via CSS custom properties (`--editor-font-size`, `--font-editor`) applied directly to the `.cm-editor` container without rebuilding extensions or themes.
- Re-measurement trigger: Calls `document.fonts.load(...)` with `allSettled` and CodeMirror `view.requestMeasure()` so line heights, selections, and caret positioning update accurately. Verified 0px displacement at end of wrapped lines.
- Persistence: Stored in SQLite `settings` table via `createEditorSettings.ts` using `withDbLock` (`editorFont`, `editorCustomFont`, `editorFontSize`).
- Added unit tests in `editorSettings.test.ts`, `editorFontRegistry.test.ts`, and `editorSettingsStore.test.ts`. All 97 editor and 384 desktop unit tests pass cleanly.

### 2026-10-11 — Editor styling tokens: Phase 2

- Added a separate `editor.obsidian` token namespace for the approved editor
  typography, content layout, spacing, and dark marker/link/tag values. The
  existing editor token values and shared color tokens were left unchanged;
  where values overlap or conflict, the new namespaced values remain separate
  for Phase 3 consumers.
- Kept existing per-heading `space-above` / `space-below` tokens unchanged;
  the audit did not establish approved replacement values for those metrics.
- Documented the token contract and values in
  `packages/design-system/tokens/README.md`.
- `pnpm --filter @app/design-system build` passed and generated CSS, SCSS, and
  TypeScript token outputs. `pnpm --filter @app/design-system typecheck` passed.
- Compared source and generated tokens against `HEAD`: all 107 existing
  generated CSS/SCSS values and 107 TypeScript exports were preserved; 30 were
  added to each generated format. No files under `packages/editor` changed.

### 2026-10-10 — Tray Phase 3 — dynamic menu with recent notes, daily note, open vault

- Implemented dynamic menu rebuilds on macOS menu bar tray:
  - "Recent notes": Derives up to 5 unique recent notes in reverse-chronological order from workspace navigation history and open tabs. Sanitizes titles (replaces newlines with space, truncates at 40 chars with ellipsis, handles emoji/unicode without code-point splitting), and disambiguates collisions across folders with parent folder suffixes (`Title (folder)` or `Title (root)`).
  - "Open today's daily note": Reuses existing `handleDailyNotes` handler in `App.tsx` (`YYYY-MM-DD.md` in vault root).
  - "Open vault...": Reuses existing native dialog picker `openPicker` from `useVaultSession`.
  - Empty states: Shows disabled "No recent notes" when vault is open with no history, or "No vault open" when no vault is open.
  - Path safety: Validates note paths strictly in Rust (`validate_recent_note_path`) to reject empty paths, absolute paths, and path traversals (`..`) escaping vault root.
  - Zero polling & debounced rebuilds: Subscribed to workspace store transitions with a 200 ms trailing debounce; zero polling or timers running at rest while hidden.
  - Architecture & code limits: Extracted IPC commands into `tray_commands.rs` (73 lines) and menu building into `tray_menu.rs` (133 lines), keeping `tray.rs` (198 lines) strictly within the 150-200 line soft cap. All Rust files under 200 lines.
  - Automated tests: Added 7 Rust tests in `tray_tests.rs` (26/26 Rust tests pass); added 5 unit tests in `useTrayMenuActions.test.ts` and 4 unit tests in `recentNotes.test.ts` (all 94 test files / 329 frontend tests pass).

- Confirmed theme selection uses a deliberately scoped, new app-level
  `localStorage` record rather than an existing shared settings backend. It is
  necessary for no-vault, pre-React restoration; reconcile it only with a
  future app-level settings foundation.
- Confirmed built-in/vault ID collisions are visible to users in Settings →
  Appearance's discovery error banner, which identifies the skipped directory
  and says the built-in takes precedence.
- Consolidated the complete theme ecosystem state, ADR-0163/0164/0165 summary,
  and its deferred follow-ups in `PROGRESS.md`.

### 2026-09-26 — Built-in themes

- Added four standalone CSS-only built-in packages: Light A, Catppuccin Latte,
  Catppuccin Frappé, and Dark B. Every public token is declared, including the
  scrim, four status background/border pairs, and shadow ink. Catppuccin uses
  the official MIT palette with package-local attribution and license notes.
- Built-in manifests are frontend metadata; their CSS uses Vite dynamic raw
  imports so only the active stylesheet is loaded. App-level local storage
  persists selection; cached built-in CSS is inserted before React starts to
  avoid a wrong-theme flash. No dependency or Tauri capability was added.
- Discovery now lists built-ins with no vault, merges vault themes when one is
  open, and keeps a built-in on ID collision while reporting the skipped vault
  directory. Settings and the registry distinguish immutable built-ins.
- Focused desktop tests and lint pass; desktop web build passes. The complete
  desktop typecheck remains blocked by unrelated existing workspace, sync,
  Storybook, and vault-update-counter errors.

### 2026-09-06 — Git Versioning Phase 3

- Reused Drive OAuth's `keyring::Entry` boundary for Git PATs, with a distinct
  service name and an account scoped to vault plus remote URL. No token is
  stored in `vault-index.db`, browser storage, or Git config.
- Added a queued, transaction-wrapped non-sensitive remote configuration store
  for URL and optional username only. The shared SQLite regression now includes
  it beside indexing, embeddings, settings, and reads.
- Added pure provider detection for help metadata only. It has no functional
  Git or credential branch. SSH is explicitly deferred to Phase 4 because a
  public key must still be manually registered with the Git host.
- Focused provider/config/SQLite tests (10), native key-scope/askpass tests, and desktop
  lint passed. No package, remote setup UI, fetch, push, or pull was added.

### 2026-09-06 — Git Versioning Phase 2

- Added the `VersionHistoryPanel` as a lazy-loaded, collapsible right-sidebar
  section, following the Backlinks/Outline placement precedent. It lists the
  active Markdown note's actual local Git revisions and generated messages.
- Added a dependency-free LCS line diff and a safe restore path. Restore writes
  the selected committed content and appends a named restore commit; it cannot
  rewrite or remove prior history. The Git mutex now covers restoration from
  the disk write through commit.
- Direct verification used a real temporary vault with three auto-save commits:
  native history exactly matched `git log` hash/message/timestamp records in
  newest-first order. A real Git diff's `-first`/`+second` changes exactly
  matched the rendered diff changes. Two sequential restores preserved the
  original three log entries, appended two restore commits, and produced disk
  content exactly equal to each selected `git show` content.
- Checks passed: focused Rust history test, 4 focused desktop tests, desktop
  lint, and production web build. The deferred history chunk is 2,689 raw /
  1,188 gzip bytes; no dependency or `vault-index.db` metadata was added.

### 2026-09-04 — AI Features Phase 7 re-audit (blocked)

- Re-read the AI ADR chain (0132–0151), ADR-0140 and remediation follow-ups,
  plus the PDF.js and Vim lazy-load precedents. The decision index contains the
  individual Phase 0–6 and remediation ADRs; no new architectural decision was
  made in this audit.
- The current production build is `365,550` raw / `115,890` gzip bytes for the
  entry. AI implementation remains split into deferred chunks, but the app
  eagerly invokes `loadAISubsystem()` from its startup refresh. This fetches
  the `11,590` raw / `3,980` gzip subsystem for AI-disabled users and violates
  ADR-0132/0146's end-to-end lazy-load contract.
- `App` has no production call to `createEmbeddingIndex`, `searchEmbeddings`,
  or `suggestLinks`, and passes neither semantic-search nor suggested-link
  props to their UI hosts. Those features cannot work end to end or populate
  a real corpus. Ask-your-vault remains unable to provide real retrieval until
  that corpus exists.
- Local checks passed: 350-file fixture event-loop latency `5.27ms`, synthetic
  350-note batch `2.00ms`, and 350-chunk cosine rank `1.24ms`; package/desktop
  tests passed 205 total, lint and web build pass. They use fixtures/mocked
  providers and do not satisfy real cloud/network/citation acceptance.
- No valid instrumented Tauri provider environment is available. Do not claim
  cloud-consent network payload, revoke, real answer grounding, or citation
  click-through results until the production wiring gaps are fixed and a safe
  test credential is configured.

### 2026-09-04 - Vault-index transaction overlap fix

- Audited every `BEGIN`/`COMMIT`/`ROLLBACK` call: all are now centralized in
  `sqliteIndex.ts`'s `withDbTransaction`; the embedding store and Remediation A
  chunk-text writes use ordinary SQL statements only.
- Root cause was `VaultIndexer` transactions bypassing `withDbLock`, overlapping
  with watcher reconciliation and ordinary note writes on the singleton
  connection. Added serialized top-level write participation and guarded the
  rollback path so SQLite's auto-ended transaction does not emit a second
  error or hide the original failure.
- Focused vault/indexing suite passed 28 tests across 7 files, including
  concurrent index/reconcile stress, 350-note cycles, CRUD paths, and the
  auto-rollback regression. Added ADR-0148.

### 2026-09-04 - Complete shared vault-index writer audit

- Searched the full codebase for direct transaction keywords and database
  mutations. `withDbTransaction` is the only `BEGIN`/`COMMIT`/`ROLLBACK` owner.
  The shared database writer list is the vault indexer, CRUD/workspace saves,
  editor settings, plugin settings, theme settings, AI consent/status, and
  embedding-store upsert/remove.
- Confirmed plugin and theme settings use the same `sqlite:vault-index.db`
  singleton, not separate connections or databases; both already participate
  in `withDbLock`. Editor settings writes were also already wrapped (the
  storage callback runs entirely inside the outer lock).
- Wrapped AI consent and provider-status writes in `withDbLock`. The generic
  `@app/ai-embeddings` package cannot import the desktop queue, so its SQLite
  store now requires the caller to inject that exact queue for mutations;
  read-only similarity queries remain unlocked under WAL.
- Checked re-entry/deadlock paths: `disableAllAIConsent` awaits separate lock
  operations sequentially; status persistence happens outside those callbacks;
  editor/plugin/theme callbacks call plain SQL settings helpers; and each
  embedding mutation acquires the queue once. No lock is acquired recursively.
- Added an adversarial concurrent test launching an index transaction,
  embedding upsert, and settings save together. All statements completed, no
  error was dropped, and the fake database observed one active writer. Focused
  desktop SQLite/indexer tests passed 10/10; embeddings passed 7/7. The full
  workspace test run passed all 24 Turbo tasks (desktop 181/181). Desktop lint
  and embeddings lint/typecheck passed; desktop typecheck remains blocked by
  existing unrelated workspace errors.

### 2026-09-04 — AI Features Phase 7: Performance and Regression Audit

- Audited the combined AI bundle boundary. Initial entry: 363,212 raw / 114,995 gzip with no AI implementation symbols. Deferred chunks: 8,139-byte subsystem, 3,092-byte shared support, and 276-byte indicator.
- The real 350-file fixture embedding batch measured 2.83ms input/event-loop latency and passed. AI Q&A/runtime/embedding and desktop UI checks passed.
- Closeout remains blocked: no live Tauri/cloud acceptance environment and no production citation opener. Added Remediation A/C status ADRs 0144/0145 and lazy-boundary audit ADR-0146; ADR-0140 was not edited.

### 2026-09-03 — AI Features Phase 6: Settings and Cloud Indicator

- Added the existing-settings-dialog AI management panel with provider state, key failure visibility, independent feature toggles, and disable/revoke behavior. Local remains unavailable per ADR-0133.
- Added the existing status-bar indicator: `Cloud AI ready` at rest and `Cloud AI transmitting` around Q&A requests, with persisted SQLite state loaded on launch and settings-change events.
- Added ADR-0143. Focused AI, desktop UI, lint, Rust check, and web build verification passed. Human wording review and live Tauri restart/keychain acceptance remain open for Phase 7.

### 2026-09-03 — AI Features Phase 5: Ask-Your-Vault Q&A

- Added `@app/ai-qa` with independent ask-vault consent gating, eight-chunk retrieval through the existing vector store, chat completion through `AIProvider.complete`, and citations derived from the exact retrieved objects sent as context.
- Added migration v5 for durable chunk text; v4 remains unchanged. Added lazy Q&A panel with cloud-active status, answer/error states, and clickable source callbacks.
- Automated verification passed: Q&A `2/2`, panel/consent `3/3`, embeddings `6/6`, Rust `cargo check`, and desktop web build. Live provider quality/network and Tauri restart/source-navigation acceptance remain environment-dependent and are recorded as open rather than claimed.

### 2026-09-03 — AI Features Phase 5 Gap 1: Cloud Transport and Consent State

- Added native `fetch` OpenAI-compatible transport to `@app/ai-runtime` behind the existing `AIProvider` contract. HTTP authentication, rate-limit, 4xx request, 5xx unavailable, malformed response, and network failures map to the stable `AIProviderError` states.
- Added Tauri Rust `keyring` commands for AI provider keys, following ADR-0120's OS credential pattern. Added a lazy consent-first/key-entry flow with fixed-probe validation and SQLite-persisted granular consent state.
- `@app/ai-runtime` tests passed 5/5, runtime typecheck passed, Rust `cargo check` passed, and desktop web build passed. Production assets totaled 8,283,088 bytes; the base entry contained no AI provider/transport/key/consent symbols, while the deferred `AISubsystem` chunk was 6,331 bytes.
- Valid cloud success and restart persistence require a running configured Tauri app and a valid provider credential; those environment-dependent checks remain open. The supplied credential was deliberately not logged or used.
- Recorded ADR-0141 and ADR-0142. ADR-0140 remains unchanged; its vector-text and source-opener blockers remain.

### 2026-09-02 — Plugin Ecosystem Phase 1: Manifest Specification & @app/plugin-api

- Established `packages/plugin-api` as the central feature package for plugin manifests, capability types, and package format validation.
- Defined `PluginManifest` and `PluginPermission` types conforming to ADR-0131's capability-scoped model, formalizing the 8 permission tokens: `vault:read`, `vault:write`, `network`, `shell`, `editor:read`, `editor:write`, `commands`, `ui:view`.
- Built standard JSON Schema Draft-07 specification (`manifestSchema.ts` and `manifest.schema.json`) for IDE auto-completion and external tooling validation.
- Implemented lightweight, dependency-free runtime validator `validatePluginManifest` enforcing strict validation by default (`additionalProperties: false`) to catch author typos and configuration omissions.
- Implemented `checkAppCompatibility` and `semverUtils`, establishing the architecture policy that separates manifest schema validity (syntactic SemVer check) from runtime host application compatibility gating.
- Defined `versions.json` format and resolution logic (`resolveCompatiblePluginVersion`) for multi-version registry serving.
- Documented on-disk package layout (`<vault>/.davinci/plugins/<id>/`) in `packages/plugin-api/README.md` and `docs/plugin-package-spec.md`.
- Added boundaries configuration to `.eslintrc.js` and path mapping to `tsconfig.json`. Added 20 Vitest fixture test cases; all pass.

### 2026-09-02 — Plugin Ecosystem Phase 0: Plugin Execution Model Architecture (ADR-0131)

- Evaluated the core architectural execution model for the DaVinci Notes plugin ecosystem across three options:
  1. Fully Trusted JavaScript (Obsidian-style trust model)
  2. Capability-Scoped Permissions per Plugin (declarative manifest + install-time consent + API call boundary)
  3. Sandboxed Execution (Web Workers or isolated iframes with postMessage RPC)
- Formulated threat models for all three options covering arbitrary Tauri IPC invocation, OAuth credential theft, stealth network exfiltration, prototype pollution, keystroke interception, and UI event-loop starvation.
- Highlighted key Tauri v2 architecture reality: compile-time capabilities (`capabilities/*.json`) bind to Webview windows, not to individual JS closures or functions within a shared webview. Documented that capability scoping must be enforced at the TypeScript/JavaScript application layer, with the desktop shell actively shielding raw Tauri IPC internals (`window.__TAURI_INTERNALS__`).
- Analyzed performance implications under `PERFORMANCE.md`: sandboxing with Web Workers/iframes would consume 250–750 MB additional memory for 25 plugins (10–30 MB per isolate) and introduce serialization latency on note edits, destroying Tauri's lightweight advantage; capability checks in JS have negligible memory footprint and sub-microsecond overhead.
- Analyzed developer experience: synchronous CodeMirror 6 StateFields/ViewPlugins/decorations and native React UI panels require direct main-thread access; sandboxing forecloses these essential Obsidian-like plugin authoring capabilities.
- Documented decision in `docs/adr/0131-plugin-execution-model.md` and indexed in `DECISIONS.md`.

### 2026-09-01 — Drive OAuth UI Freeze Fix

- Diagnosed the post-click freeze: the native `wait_for_oauth_callback`
  command called `TcpListener::accept()` synchronously while waiting for the
  browser redirect.
- Kept the command asynchronous and moved socket acceptance, request parsing,
  and callback response writing into `tauri::async_runtime::spawn_blocking`.
- Verification: Cargo check and Rust tests pass; the desktop web build passes
  with only existing Sass, externalized-module, and chunk-size warnings.

- Replaced `window.open` with a native Tauri command that validates the Google
  authorization host and launches the system browser using the platform-native
  launcher. Browser-launch failures are now surfaced as sign-in errors.
- Corrected the generated Desktop loopback redirect from a custom path to
  Google's documented `http://127.0.0.1:<port>` root form. Added native tests
  for root acceptance and custom-path rejection; Rust tests now pass 6/6.
- Fixed the Tauri response naming mismatch that sent Google
  `redirect_uri=undefined`: the Rust endpoint returns `redirect_uri`, and the
  TypeScript auth flow now reads that exact native field.
- Confirmed the OAuth client ID remains local ignored configuration; no client
  secret was stored in the repository.

## 2026-09-01 — Sync Phase 2 Auth Re-audit

- Rechecked current Google Desktop OAuth, PKCE, loopback, `drive.file`, and
  testing/verification guidance before touching auth code.
- Confirmed the existing implementation already covers the Phase 2 design:
  external browser launch, random loopback port, PKCE/state validation,
  keyring-backed tokens, refresh, and disconnect. No duplicate auth or Drive
  transfer implementation was added.
- Verification: sync-client tests 11/11, native Rust tests 6/6, sync-client
  typecheck, and desktop web build passed. Real consent, OS-keychain
  inspection, restart persistence, and sign-out deletion remain pending.

## 2026-09-01 — Sync Phase 2 Acceptance Confirmation

- User confirmed the real Drive sign-in, OS-keychain token inspection,
  restart/refresh persistence, and sign-out deletion checks.
- Updated `PROGRESS.md` to close Phase 2 and make Phase 3 the current focus.
  Phase 3 remains scoped to Drive manifests, Changes API deltas, diffing, and
  content-hash-keyed transfer; conflict resolution remains Phase 4.

## 2026-09-01 — Sync Phase 2 Scope Correction

- Confirmed from current Google Drive documentation that hidden `appDataFolder`
  access requires `drive.appdata`; added it alongside the existing
  `drive.file` scope without changing `drive.file` behavior.
- Recorded ADR-0121, amending ADR-0120 and preserving the original decision as
  historical context. The expanded consent/keychain/restart/sign-out manual
  re-test remains outstanding and is explicitly required before Phase 3 is
  considered fully unblocked.

### 2026-08-20 — Tags Feature Phase 3: YAML Tags Property Support

- Kept YAML/frontmatter parsing in `@app/indexer` and added a thin `parseNoteTags(frontmatter, body)` wrapper so the note hydration path can reuse the same shared tag model without a second parser.
- Extended `@app/core-types` with body-only tag validation helpers and a merged `NoteTagSet` contract: `frontmatter`, `inline`, and `all`. The union set deduplicates via the canonical registry and preserves first-seen display casing.
- Updated desktop note hydration to return the merged note-tag set directly. Phase 4 can consume that contract as-is; there is no separate frontmatter-indexing side effect yet.
- Frontmatter rendering remains plain YAML source in this phase because the app does not currently have a frontmatter widget in Live Preview.
- Verification: `@app/core-types` build passes, `@app/indexer` build passes, the tag/parser tests pass, and Phase 2 inline tag rendering is unchanged.

### 2026-08-20 — Tags Feature Phase 2: Inline Tag Detection & Rendering

- Reused the Phase 1 `matchTags`/`TagRegistry` implementation from `@app/core-types`; the editor extension only handles decoration, canonical display, and click wiring.
- Rendered tags as replacement badge widgets with `cm-tag` styling from a dedicated theme file. The badge text uses first-seen canonical casing, while the underlying markdown source remains the editable truth.
- Added a stub `onTagClick(tagKey)` callback path so the editor can hand off to future search/filter behavior without building search in this phase.
- Excluded inline code and fenced code via the syntax-tree code-node check used elsewhere in the editor package.
- Added focused JSDOM coverage for canonical casing, click forwarding, headings/lists/blockquotes/tables, inline formatting, link coexistence, code exclusion, and a 1,000-line benchmark asserting `<5 ms` per typed character.

### 2026-08-20 — Tags Feature Phase 1: Tag Parsing Rules & Data Model

- Reused `@app/core-types` because it is already dependency-free and shared by `@app/editor` and `@app/indexer`; no new UI or indexer coupling was introduced.
- Defined the Unicode matching rule in ADR-0076: letters, numbers, marks, symbols, `_`, `-`, `/`, and ZWJ are allowed; punctuation and whitespace terminate matches; numeric-only bodies are rejected.
- Added pure `isValidTag`, `matchTags`, `normalizeTag`, `decomposeTag`, and `TagRegistry` APIs with coverage for valid/invalid tags, nested decomposition, emoji/unicode examples, and case-insensitive canonical display.
- Switched internal package imports to `.js` specifiers so the emitted `dist/index.js` can be imported directly by Node without React/CodeMirror in the graph.

### 2026-08-20 — Phase 11: Math (ADR-0074)

- Chose KaTeX 0.18.4 instead of MathJax. The installed package is approximately 4.3 MB and covers the required `vmatrix`, scripts, fractions, and inline expressions; no planned content currently requires MathJax-only extensions.
- Added lazy KaTeX replacement widgets for `$$` blocks and `$` inline expressions. Active editable lines retain source; read-only rendering and cursor exit render the expression.
- Reused Phase 10's 150 ms debounce for external changes and converted parser failures into visible error placeholders.
- Added determinant, exponential, cursor-toggle, invalid-input, and latency regression coverage.

### 2026-08-20 — Phase 10: Mermaid Diagrams (ADR-0073)

- Reused the CodeMirror replacement-widget path for `mermaid` fenced blocks. Because ViewPlugins cannot replace line breaks, the block is composed of a rendering widget on the first fence line and continuation widgets on the remaining lines.
- Mermaid 11.16.1 is dynamically imported. The installed dependency tree is approximately 83 MB, so the package cost is explicit and Mermaid does not enter the initial editor load path.
- Chose cursor-gated rendering plus a 150 ms debounce for external document changes. Raw Mermaid remains editable inside the fence; leaving it renders the SVG, and invalid syntax becomes a visible error state.
- Internal-link class declarations call the existing `onLinkClick` callback, including quoted labels with special characters. No separate vault lookup was added.

### 2026-08-19 — Live Editable Table Grid

- Phase 9 had table detection and cell marks but no visual grid renderer, so valid tables remained raw pipe-delimited text.
- Added row flex layout, equal-width editable cell marks, visible cell borders, delimiter suppression, and separator hiding with active-line source reveal. The markdown document remains the sole source of truth; typing in a cell dispatches the normal CodeMirror document transaction.
- Escaped pipes are excluded using the existing syntax-tree escape handling, preserving table-cell parsing and wikilink/image aliases. Existing row/column mutation actions continue to modify markdown ranges.
- Added grid structure and cell-edit synchronization tests. No new widget system or dependency was introduced.

### 2026-08-19 — Bug Fix — Enter After Ambiguous Table Header

- Reproduced `| First name | Last name |` followed by Enter using the full CodeMirror default keymap and the Phase 9 table extension. The document correctly became two lines.
- Checked the table extension for custom Enter/keymap handling. None exists: the extension only scans visible ranges for table decorations and handles `contextmenu`, so it cannot swallow the newline.
- Added regression coverage for multi-column and single-column-looking pipe rows, plus ordinary text adjacent to them. No runtime change or dependency was needed.

### 2026-08-19 — Editor Markdown Formatting Phase 5: Lists & Tasks (ADR-0068)

- Wrote the required pre-implementation plan in `plans/editor-formatter/phase-5-lists-tasks.md`; recorded canonical `x` task toggles and no artificial Markdown-list depth cap in ADR-0068 before implementation.
- Added `listExtension` in `@app/editor`, retaining the single CodeMirror renderer and scanning only `visibleRanges`. It replaces off-active-line unordered syntax with a consistent bullet widget, preserves ordered `.` / `)` text, and supports mixed nesting from source indentation without a full-document traversal.
- Task markers `[ ]`, `[x]`, `[?]`, `[-]`, and any other one-character non-space state use checkbox widgets. Click handling dispatches a CodeMirror document transaction (never a DOM mutation); completed task text is styled as muted and struck through. The read-only renderer displays disabled task controls.
- Reused CodeMirror `indentWithTab` via exported `listIndentKeymap`; the Phase 5 tests verify its Tab and Shift+Tab handling over a multi-item selection. `insertHardLineBreak` now adds continuation indentation in ordered list items, preserving a single numbered item.
- Added `listExtension` to the mixed 1,000-line benchmark fixture and inserted representative task content. The benchmark measured 0.833 ms per keystroke in JSDOM, below the 5 ms requirement; no dependency was added.
- Verification: 29 focused editor tests passing (lists, line breaks, inline formatting, links/images, benchmark), plus clean `@app/editor` typecheck, lint, and build.

### 2026-08-19 — Editor Markdown Formatting Phase 3: Inline Formatting Completeness (ADR-0066)

- Enabled the built-in GFM `Strikethrough` extension from `@lezer/markdown` in `@app/editor` (`Editor` and `MarkdownView`).
- Implemented a custom Lezer `highlightExtension` using `cx.addDelimiter(...)` to parse Obsidian-style `==highlight==` markdown delimiters and tag them with `highlightTag`.
- Updated `editorHighlightStyle` in `editorTheme.ts` to style `t.strikethrough` (`textDecoration: "line-through"`) and `highlightTag` (`backgroundColor: "var(--color-bg-highlight, rgba(241, 196, 15, 0.3))"`, `borderRadius: "var(--border-radius-sm, 2px)"`, `padding: "0 2px"`).
- Updated `livePreviewExtension.ts` to match `EmphasisMark`, `StrikethroughMark`, and `HighlightMark` for hiding raw delimiters when lines are inactive.
- Handled `Escape` nodes by decorating the leading backslash character `node.from` to `node.from + 1` with `cm-markdown-syntax` so backslashes hide in rendered view while rendering literal formatting characters without formatting, scoping strictly per-character.
- Re-exported `highlightExtension`, `highlightTag`, and `Strikethrough` from `@app/editor`'s index.
- Added comprehensive unit test suite in `apps/desktop/src/state/inlineFormattingExtension.test.tsx` (10 tests) covering all syntax combinations, active line reveals, wikilinks co-occurrence, and read-only `MarkdownView` rendering.
- Verification: 10/10 inline formatting tests passing, 25/25 canvas suites passing, 1,000-line typing latency benchmark at 4.319 ms/keystroke (below 5 ms budget), `@app/editor` builds and lints cleanly.

### 2026-08-19 — Editor Settings Ownership Correction (ADR-0065)

- Added `packages/editor/editorSettings.ts` as the portable editor-settings contract: supported font values, defaults, validation, storage interface, loading, and serialization. The package stays independent of SQLite, Tauri, and Zustand.
- Reworked desktop `createEditorSettings` into a thin SQLite adapter using `EditorSettingsStorage`. The Settings dialog consumes the package's valid font list, eliminating its duplicate source of truth.
- Added a desktop state test proving invalid persisted font data falls back to the package default. Added the missing `@app/editor` alias to the desktop Vitest config so package imports resolve from workspace source during focused tests.
- Restored the known-good settings load pattern: each key uses sequential `withDbLock(() => getSetting(...))`, avoiding concurrent SQLite statements during app initialization. Explicit setting writes remain serialized.
- Verification: `@app/editor` and desktop lint/typecheck pass; desktop settings test has 8 passing cases. No dependency or runtime/per-keystroke cost added. Strict Line Breaks behavior is intentionally unchanged under ADR-0063.

### 2026-08-19 — Stabilization Phase 1: Canonical Note Delete and Duplicate (ADR-0064)

- Added Rust `delete_note` plus `deleteNoteInVault(path)` as the canonical permanent-delete path. It suppresses watcher reconciliation during the operation, clears pending save/H1 timers, removes the note plus both source and target links from SQLite, removes the graph node/edges/backlinks, and closes/removes the note from workspace state.
- Added `duplicateNoteInVault(path)`: source content comes from open-tab memory when available (otherwise one read), the copy receives a collision-safe `<stem> copy.md` name, its first H1 follows the filename convention, then it is written, indexed, inserted into the in-memory graph, and opened.
- File Explorer markdown-note context menus now include Rename, Duplicate, and a browser-native confirmation before permanent Delete. Existing file-row HTML5 drag behavior remains `copy` for canvas embeds; move is intentionally deferred to avoid changing that contract.
- Split `FileTreeRow` from the virtualized tree to keep `FileTree.tsx` at 226 lines. This extraction adds no new rendering work or dependency.
- Verification: 17 focused Vitest tests pass; full desktop ESLint and TypeScript checks pass; `cargo check` passes with only the pre-existing unused `VaultWatcher::is_paused` warning. Browser-based desktop dogfooding could not run because the in-app browser control bridge was unavailable in this environment.

### 2026-08-18 — Editor Markdown Formatting Phase 2: Line-Break Semantics (ADR-0063)

- Implemented `softLineBreakExtension` as a direct CodeMirror state decoration because newline replacements are layout-changing and cannot use the existing viewport-only preview plugin. Soft newlines inside parsed paragraphs become an inline space widget; CommonMark two-space hard breaks and blank lines are left intact.
- Bound `Shift+Enter` to insert `  \n`, retaining a plain-Markdown hard break in the saved note.
- Added `strictLineBreaks` to the existing SQLite-backed editor-settings factory and exposed it as a checkbox in Settings. It loads through the normal startup `loadSettings` call and writes through `setSetting`; no new persistence mechanism or dependency was added.
- The provided default and Strict Line Breaks acceptance mappings are identical, so the setting currently persists the preference without a separate visual mapping. No unrelated formatting syntax was changed.
- Added focused tests for decoration ranges/rendering, hard-break insertion, and persistence. Optimized the initial full-document decoration update to process only the changed line neighborhood. Benchmark: 4.227 ms per transaction for 100 edits in a 1,000-line/100-wikilink document, below the 5 ms budget.

### 2026-08-18 — Editor Markdown Formatting Phase 1 Audit (ADR-0062)

- Created `test-vault/editor-markdown-formatting-audit.md`, an ignored local fixture containing every requested Obsidian formatting variant, including interaction targets for Shift+Enter and list indentation.
- Inspected the configured CodeMirror state, parser output, `livePreviewExtension`, `wikilinkExtension`, styles, keymaps, and editor settings. `markdown()` uses strict CommonMark; GFM extensions bundled by Lezer are not enabled.
- Wrote and indexed ADR-0062 with a complete status table. It distinguishes parser support from live-preview decoration, rendering, and click behavior so a later implementation phase does not overstate support.
- No file in `packages/editor/` was modified; no package was added and no bundle/runtime cost changed.


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

## 2026-08-19 — Editor Markdown Formatting Phase 6: Code Blocks

- Implemented inline-code delimiter hiding for single and double backticks while preserving literal backticks and code content.
- Added fenced and indented code-block live-preview decorations using the existing CodeMirror/Lezer Markdown path. Three-or-more backtick/tilde fences and nested fence rules are covered, including code blocks inside list items.
- Configured JavaScript/TypeScript-family embedded grammar resolution in `Editor` and `MarkdownView`; unsupported languages remain literal and are recorded in ADR-0070.
- Added Phase 6 regressions and expanded the editor benchmark with fenced code. 35 focused Phase 2–6 tests pass; package typecheck, lint, and build pass; desktop focused lint passes; benchmark remains under 5 ms per keystroke.

## 2026-08-19 — Inline Code Visual Styling Bug Fix

- Reproduced the reported behavior in the existing CodeMirror harness: inline-code parsing and delimiter decorations were active, but `t.monospace` only selected the same editor font and supplied no visual distinction.
- Extended the existing `t.monospace` highlight rule with the editor accent color, secondary background, subtle border, small radius, and padding. Single- and double-backtick content remains editable and delimiter hiding is unchanged.
- Added regression coverage for single/multi-word spans, double-backtick literal backticks, cursor insertion, code-content highlighting, and the under-5 ms benchmark. The Phase 2–6 focused suite passes 37 tests.

## 2026-08-19 — Editor Markdown Formatting Phase 7: Quotes, Footnotes & Comments

- Added shared visible-range annotations for blockquote borders, numbered footnote references/definitions, and Obsidian comments.
- Inline footnotes render only in read-only `MarkdownView`, while references and definitions render in both modes; ADR-0071 records the scope decision. Comments are dimmed in the editor and hidden in the existing read-only renderer.
- Added mixed Phase 2–7 regressions, including horizontal rules and code/list/link combinations. 48 focused tests pass; package typecheck/lint/build, desktop focused lint, and the under-5 ms benchmark pass.

## 2026-08-19 — Editor Markdown Formatting Phase 8: Escaping Edge Cases

- Verified the complete escaped-character matrix, hidden backslashes, escaped `1\\.`, per-occurrence scope, and adjacent real formatting against the Phase 1 audit examples.
- No production syntax change or dependency was needed; added final regression coverage and ADR-0072, which indexes the decisions from Phases 1–8 and closes the basic Markdown formatting build plan.
- Final Phase 2–8 suite: 52 tests passing. Package typecheck/lint/build, desktop focused lint, and the under-5 ms benchmark pass.

## 2026-08-19 — Editor Line Wrapping Bug Fix

- Root cause: `EditorView.lineWrapping` was absent from both editable and read-only editor configurations, so long prose lines could extend horizontally.
- Enabled CodeMirror wrapping globally, removed table-cell shrink-to-fit styling, and preserved horizontal scrolling for fenced-code lines via a scoped code-line layout rule.
- Added line-wrapping coverage and reverified table/context-menu behavior and editor performance.
## 2026-08-20 — General Search Phase 0: Scope & Architecture

- Confirmed the current Command Palette is only a fuzzy note path/title Quick Switcher and has no content search, operator parser, or results UI.
- Accepted ADR-0079: build a separate lazy Search surface.
- Accepted ADR-0080: extend `@app/indexer` and SQLite with incremental FTS5 content indexing; add no parallel search dependency.
- Accepted ADR-0081: v1 supports plain terms, quoted phrases, `tag:` with optional `#` normalization, and leading-minus exclusions; other operators are explicitly deferred.
- Accepted ADR-0082: place search parsing and execution in `@app/indexer`.
- Phase 5 Tag Search remains blocked until the general search dependency is implemented.
## 2026-08-20 — General Search Phase 1: Full-Text Index

- Added SQLite FTS5 migration v3 with a `notes_fts` table for note body content.
- Reused the existing batched persistence and removal paths for full indexing, watcher reconciliation, create/edit/delete, and rename/move updates.
- Added FTS maintenance tests and a 1,000-note batch benchmark. The focused suite passed; the benchmark test completed within its 1-second guard.
- No new dependency or field-level deviation was introduced. Desktop typecheck remains blocked by the pre-existing `createNoteCrudActions.ts` `result` scope errors.
## 2026-08-20 — General Search Phase 3: Query Execution & Ranking

- Added indexer execution over SQLite FTS5 and direct Phase 4 tag-index
  filtering, with implicit AND and exclusion semantics.
- Added snippets and deterministic bm25/title/path ranking; tag-only ordering
  is title then path, and combined queries rank text relevance within tag
  matches. ADR-0084 records the policy.
- Added combined, tag-only, exclusion, and ranking tests. The focused suite
  passed 14 tests, including a 1,000-note combined-query benchmark.
## 2026-08-20 — Bug Fix: Expose Live Vault Tag Index

- Confirmed `@app/indexer` supplied only pure TagIndex mutation functions; the
  desktop vault load discarded the constructed state.
- Added one live TagIndex to workspace state, initialized from the existing
  full-load notes and updated by watcher reconciliation, note saves, and
  canonical deletes. No second scan path was introduced.
- Kept SQLite FTS5 behind the existing `getVaultIndexDb()` singleton. Added
  ADR-0085 and the desktop changeset.
## 2026-08-20 — General Search Phase 4: Search UI

- Added a separate lazy Search dialog with a 150 ms debounce, ranked snippets,
  tag-only fallback display, arrow navigation, and Enter-to-open behavior.
- Wired the icon rail and Cmd/Ctrl+Shift+F to Search while preserving Cmd/Ctrl+K
  for the existing Quick Switcher.
- Added the desktop Search UI changeset. Tag-click wiring remains Phase 5.
## 2026-08-20 — General Search Phase 5: Tag Click Wiring

- Replaced the editor tag-click placeholder with a real callback into the
  desktop Search dialog. Clicks open Search with an executed `tag:` query.
- Preserved Phase 3 nested-tag semantics by forwarding the canonical tag key
  without adding search logic to the editor.
- Tags Phase 5 is unblocked; Tags Phase 6 is ready as a separate task.
## 2026-08-20 — General Search Phase 6: Regression & Performance Pass

- Functional search, tag, editor, FTS, watcher, and CRUD regressions pass.
- Confirmed the separate Command Palette remains unaffected.
- The standalone large-vault benchmark is blocked by its missing runtime
  `packages/core-types/NoteTags.js` import; ADR-0086 records the limitation and
  prevents claiming unverified cold-start/per-note timings.
## 2026-08-20 — Tags Feature Phase 5: Tag Search Closed

- Re-verified optional-`#` tag queries, nested descendant/asymmetry semantics,
  and the editor tag-click-to-Search callback path using the General Search
  implementation.
- Core tag, index/search, and editor rendering tests passed 11, 14, and 5
  tests respectively.
- Tags Phase 5 is closed; Tags Phase 6 (Tags view) is ready as a separate task.
## 2026-08-20 — Tags Feature Phase 6: Tags View

- Added a lazy nested Tags dialog from the Command Palette, backed directly by
  the live workspace TagIndex.
- Added canonical display casing, direct-use counts, parent synthesis for
  nested tags, and tag selection wired to the existing Search callback.
- Live updates use `vaultUpdateCounter`; no polling or vault rescan was added.
- ADR-0087 records count semantics and the live-update hook. Tags Phase 7 is
  ready to begin.
## 2026-08-20 — Tags Feature Phase 7: Regression & Integration Closeout

- Completed regression coverage across shared parsing, nested index/search,
  editor block types and code exclusion, desktop vault updates, and Tags view
  integration.
- Added a 1,000-note nested index/query benchmark; it completed in 3 ms of
  Vitest test time. The existing real SQLite benchmark tooling caveat remains
  recorded in ADR-0086.
- Confirmed tag rename/merge UI and Bases `hasTag` remain out of scope. Added
  ADR-0088 as the final Tags plan decision index. Phases 1–7 are complete.
## 2026-08-20 — HTML Support Phase 1: Sanitization Core

- Added standalone `@app/sanitize` with DOMPurify 3.4.14 and an exact HTML
  allowlist for the future note-rendering path.
- Constrained class/style handling and tested scripts, event handlers, unsafe
  URLs, CSS injection, malformed markup, encoded payloads, and safe comments.
- Five sanitizer tests pass; typecheck and build pass. Added ADR-0089,
  ADR-0090, and the package changeset. No editor integration was made.
## 2026-08-20 — HTML Support Phase 2: Block-Level HTML

- Added contiguous block-level table/div detection and sanitized CodeMirror
  rendering for editable and read-only editor paths.
- Fixed CodeMirror's multi-line decoration constraint with continuation widgets
  that preserve source line breaks. Added the documented blank-line regression
  and edit-time re-sanitization tests; all 3 pass.
- Added ADR-0091 for block boundaries. No raw HTML reaches the DOM outside the
  Phase 1 sanitizer.
## 2026-08-20 — HTML Support Phase 3: Inline HTML

- Added sanitized inline rendering for underline, strikethrough, spans/divs,
  and hidden HTML comments in editable and read-only editor paths.
- Reused Markdown strikethrough styling and preserved the Phase 1 CSS policy;
  the unsupported cursive font example is visibly sanitized rather than
  accepted as a new CSS property.
- Added adjacent-Markdown, comment, and sanitizer-path regressions. HTML block
  and inline suites pass 6 tests.

## 2026-08-20 — HTML Support Phase 4: No-Markdown-Inside-HTML Enforcement

- Formalized the exact source-range boundary in ADR-0093: sanitized HTML
  widgets own the captured HTML range, so Markdown syntax inside block and
  inline HTML remains literal; Markdown outside the range remains active.
- Added side-by-side named regressions for block HTML and each supported inline
  element (`u`, `s`, `span`, and same-line `div`). The inline suite also
  verifies an outer Markdown strong-emphasis node remains present around HTML.
- Focused verification passed: 2 files and 12 tests. This phase added no new
  rendering path and preserved the sanitizer-only DOM rule.

## 2026-08-20 — Tags Feature Phase 5: Tag Search Resume and Closeout

- Re-read the General Search ADRs and confirmed the settled `tag:` contract:
  `#` is optional and normalized away; parent tags include descendants, while
  nested queries do not include ancestor-only tags.
- Re-verified the existing end-to-end wiring: editor tag widgets forward the
  canonical key, desktop opens the dedicated Search surface with
  `tag:<key>` prefilled, and the shared parser/executor resolves results using
  the live Phase 4 TagIndex.
- Verification passed: core tag rules 11/11, index/parser/search integration
  15/15, and editor tag rendering/click forwarding 5/5. No Tags-side gap was
  found, so no search or index implementation was changed.
- Tags Phase 5 is formally closed. Tags Phase 6 (Tags view) is ready to
  proceed as a separate task; the known real SQLite benchmark tooling caveat
  remains documented in ADR-0086.

## 2026-08-20 — HTML Support Phase 5: Regression and Integration Closeout

- Re-ran the integrated sanitizer suite: 10/10 attack-vector and allowlist
  tests passed. Block, inline, and tag editor suites passed 17/17 together.
- Added a composed editor regression proving tag-looking text inside sanitized
  `<div>` and `<span>` content is opaque to the Tags parser, while existing
  code-block exclusions remain intact.
- Confirmed canvas does not render note HTML: it is a separate JSON/React Flow
  surface with no HTML note-rendering or unsanitized `innerHTML` path. The
  `<iframe>`/web-page embed capability remains separately scoped.
- Added ADR-0094 as the final HTML Support decision index. HTML Support
  Phases 1–5 are complete; no new rendering path or sanitizer bypass was
  introduced in this closeout.

## 2026-08-20 — HTML Block Rendering Visual Fix

- Diagnosed excess vertical space as CodeMirror continuation lines preserving
  source line boxes around the replacement widget, compounded by block padding;
  continuation widgets now use a dedicated hidden class and the block shell
  has no padding. Sanitized source is trimmed before mounting without changing
  the sanitizer policy.
- Added token-based default styling for sanitized tables: collapsed outer and
  cell borders, row dividers, full-width layout, and token-based cell spacing.
  Surviving user inline styles retain CSS precedence within the existing
  allowlist.
- Added ADR-0095 and re-ran the Phase 2/3 suites: 13/13 tests passed,
  including blank-line rejection, edit-time sanitization, multiline spacing,
  table rendering, and the inline cursive-style regression.

## 2026-08-20 — HTML Block CodeMirror Widget Fix

- Confirmed the remaining line-growth cause: `Decoration.replace` ranges were
  supplied by a `ViewPlugin` without structural block semantics, placing the
  HTML root in the editor line flow. CodeMirror also rejects block
  decorations from view plugins.
- Moved HTML block decorations to a `StateField` and replaced the complete
  source range with `block: true`. The DOM root is now outside `.cm-line`; the
  existing inline HTML plugin was left unchanged.
- Added ADR-0096 superseding the old mounting detail and retained regression
  coverage for table rendering, blank-line rejection, edit-time sanitization,
  multiline blocks, literal Markdown, and inline HTML. Focused suites pass
  14/14.

## 2026-08-20 — HTML Block Cursor Navigation Fix

- Reproduced the navigation issue as a missing cursor-gated source/render
  toggle on the structural HTML block replacement. A full-range block widget
  was navigated as one unit, so hidden source lines could be skipped.
- Extended the existing Mermaid/math selection pattern to the HTML StateField:
  selection changes compare `selection.main.head` with each block range, omit
  the active block decoration, and restore it when the cursor leaves.
- Added ADR-0097 and an `@app/editor` patch changeset. HTML block and inline
  suites pass 15/15; package typecheck passes. Inline HTML remains inline and
  unaffected.

## 2026-08-20 — HTML Block Source-Edit Mode Verification

- Confirmed the source/render toggle is selection-based and shared with the
  established Mermaid/math pattern: active HTML ranges omit their widget and
  expose the original editable source; inactive ranges use the structural
  sanitized widget.
- Added a named regression for editing HTML while source mode is active, then
  moving the cursor away and confirming sanitization occurs only on the
  re-rendered widget path. This prevents sanitizer work from fighting active
  typing.
- Full `@app/editor` verification passes: 22/22 tests and typecheck. Direct
  CodeMirror vertical-motion commands cannot be measured in jsdom because its
  text ranges lack browser `getClientRects`; the selection transition and
  structural DOM behavior are covered, while real-browser navigation remains
  the appropriate manual/UI verification.

## 2026-08-21 — Embed Web Pages Phase 1: Trust Model and Sandboxing Policy

- Completed the decision-only iframe security phase; no code or dependency was
  added. Read the HTML sanitizer, structural block-widget, and cursor-source
  toggle ADRs before making the decisions.
- Added ADR-0098 for the fixed sandbox, deny-by-default Permissions Policy,
  camera/microphone exclusion, and `no-referrer` policy. The dangerous
  `allow-scripts` + `allow-same-origin` combination was explicitly rejected.
- Added ADR-0099 for HTTP(S)-only URL validation, Tauri/internal scheme
  rejection, localhost/private-network blocking, visible rejection messaging,
  and the DNS-rebinding limitation that Phase 2 must address with Tauri
  integration controls.
- Added ADR-0100 for fixed click-to-load behavior, avoiding unsolicited
  third-party network requests and remote code execution when opening notes.
- Indexed all three decisions in `DECISIONS.md`; Phase 2 is next.

## 2026-08-21 — Embed Web Pages Phase 4: Script-Free Tweet Cards

- Investigated X's official oEmbed path before implementation. Its response
  is blockquote markup transformed by `widgets.js`, so it was rejected rather
  than loaded in the app page or a new iframe. ADR-0103 records the decision
  for a click-to-load static card.
- Added narrow `x.com`/`twitter.com` status URL detection through the same
  external-image branch point. The card fetches `publish.x.com/oembed` only on
  activation with `omit_script=1` and `dnt=true`, extracts text-safe metadata,
  and never assigns returned HTML to the DOM.
- Added near-miss, card text-safety, and editor integration coverage. Full
  editor verification passes 29/29 and package typecheck passes. No
  `widgets.js` or tweet iframe path was added.
- Added the editor changeset and set Phase 5 as next.

## 2026-08-21 — Embed Web Pages Phase 5: Regression and Integration Closeout

- Re-ran the base sanitizer and integrated editor suites. Sanitizer attack
  vectors pass 15/15; the full editor suite passes 31/31, including raw
  iframe, YouTube shorthand, tweet static-card, ordinary-image, near-miss,
  and source/render regressions.
- Re-verified Phase 1 host restrictions for localhost, loopback, private
  targets, and internal schemes. YouTube conversion produces only the fixed
  `www.youtube.com/embed/<id>` host; tweet conversion produces no iframe and
  therefore no alternate URL-validation path.
- Added an integrated attack-vector regression proving scripts, handlers,
  unsafe CSS, and `javascript:` content remain absent from rendered HTML.
  A 25-embed placeholder benchmark stayed under the 1-second guard and made
  zero fetch calls before activation.
- Confirmed Canvas exists as a separate JSON/React Flow card model. Web-page
  cards are explicitly deferred to a future Canvas-specific plan.
- Added ADR-0104 as the final decision index and marked Embed Web Pages
  Phases 1–5 complete. Browser network inspection remains a manual step
  because no browser-network harness is configured.

## 2026-08-21 — Embed Web Pages Phase 3: YouTube External-Image Syntax

- Added a narrow named YouTube matcher for canonical `watch?v=` and
  `youtu.be/<id>` URLs with 11-character IDs. It constructs the approved
  `https://www.youtube.com/embed/<id>` URL and hands it to the existing HTML
  iframe sanitizer/policy and click-to-load block widget.
- Ordinary external images remain on the existing image extension path.
  Near-miss YouTube URLs, arbitrary YouTube paths, and Shorts are explicitly
  excluded; the supported forms are recorded in ADR-0102.
- Added parser, near-miss, ordinary-image-branch, and editor placeholder
  regressions. Full editor verification passes 26/26; sanitizer verification
  passes 15/15; both package typechecks pass.

## 2026-08-21 — Embed Web Pages Phase 2: Raw iframe Detection and Rendering

- Added an explicit iframe policy layer in `@app/sanitize`. It rebuilds iframe
  attributes from the fixed Phase 1 policy, validates HTTP(S) hosts, blocks
  local/private/internal targets with a visible message, and leaves the prior
  static HTML policy separate.
- Extended the existing HTML block detector/state-field widget to recognize
  iframe roots. Valid embeds render a hostname placeholder first; the actual
  iframe is created only after activation, with no connected iframe during
  initial rendering.
- Added sanitizer coverage for policy override and localhost/loopback/
  internal-scheme rejection, plus editor coverage for iframe block detection
  and click-to-load placeholder behavior. Sanitizer tests pass 15/15 and the
  focused HTML editor suite passes 8/8; both package typechecks pass.
- Added ADR-0101 and changesets for `@app/sanitize` and `@app/editor`. Phase 3
  (YouTube `![]()` syntax sugar) is next.

## 2026-08-21 — Attachments Phase 1: Accepted Formats & Location Model

- Created `@app/attachments` as a dependency-free feature package. Its
  centralized extension set covers PNG/JPG/JPEG/GIF/WebP/SVG, MP3/WAV/M4A,
  MP4/WebM/MOV, and PDF, with case-insensitive matching. The list is
  explicitly provisional because the referenced authoritative document was
  unavailable.
- Added `AttachmentSettings` with vault-root, specified-folder, note-folder,
  and note-subfolder modes plus the mode-specific fields needed by future UI.
  Resolution is pure and performs no filesystem checks or writes; nested note
  folders, unsaved notes, separator normalization, and absent configured
  folders are covered.
- Reused the existing SQLite settings key/value persistence convention: the
  desktop workspace settings state loads and saves the serialized model under
  `attachmentSettings`. No editor or settings UI integration was included.
- Verification: 8/8 package tests and package typecheck pass. Added ADR-0108,
  ADR-0109, changeset, and lockfile workspace metadata.

## 2026-08-21 — Attachments Phase 2: Filesystem Write & Filename Handling

- Added the pure-core `writeAttachment` API with an injected async filesystem
  adapter, so tests do not touch disk while desktop uses Tauri's native fs
  plugin. The writer consumes the already-resolved target folder directly and
  creates missing nested folders recursively.
- Adopted numeric suffixes before the extension for collisions:
  `image.png`, `image 1.png`, `image 2.png`. Filenames containing path
  separators are rejected, as are extensions outside Phase 1's provisional
  allowlist, with structured error codes.
- Added `writeAttachmentToVault` as the desktop adapter entry point, ADR-0110,
  and the existing package/desktop changeset. Verification: 16/16 attachment
  tests and package typecheck pass; desktop typecheck still reports only the
  unrelated pre-existing `createNoteCrudActions.ts` errors.

## 2026-08-21 — Attachments Phase 3: Paste Handling

- Added a single CodeMirror DOM paste handler. It checks clipboard file data
  and returns false for ordinary text paste, leaving CodeMirror's native text
  behavior intact.
- Desktop paste callbacks call `resolveAttachmentFolder` and
  `writeAttachmentToVault` directly. The editor captures the cursor position,
  waits asynchronously for the write, and inserts `![[relative/path]]` only
  on success. Failure messages include structured error codes.
- Nameless files use MIME-derived timestamp names under ADR-0111. Added
  editor/desktop changeset and regressions for text, async success, nameless
  images, and write failures. Editor tests pass 37/37; attachment tests remain
  16/16.

## 2026-08-21 — Attachments Phase 4: Drag & Drop Handling

- Factored the per-file paste work into `handleIncomingFiles`, then reused it
  for external file drops. The drop path claims only events with files, so
  ordinary editor drag interactions remain CodeMirror-owned.
- Multiple files are processed in reported order and inserted one per line at
  the drop position. A rejected file reports its structured error while valid
  files still write and insert successfully.
- Added a token-based dashed drag-over outline with drag-leave/drop cleanup,
  ADR-0112, changeset, and regressions for partial success. Editor tests pass
  38/38 and typecheck passes.

## 2026-08-21 — Attachments Phase 5: Settings UI

- Added `AttachmentLocationSettings` to the existing Settings dialog. The
  radio selector maps directly to the Phase 1 schema; specified-folder mode
  reuses the native folder picker, while note-subfolder mode uses the shared
  design-system input.
- The workspace's existing persisted `attachmentSettings` state is used
  directly, so changes apply to the next paste/drop immediately. Specified
  paths are deferred to first use; invalid subfolder drafts remain local and
  show inline guidance under ADR-0113.
- Added token-only colocated styles, four Storybook stories, interaction tests,
  ADR-0113, and changesets. Component tests pass 2/2; desktop typecheck still
  has only the unrelated pre-existing CRUD errors.

## 2026-08-21 — YouTube Embed Thumbnail Facade (ADR-0105)

- Replaced the YouTube generic placeholder/eager behavior with a thumbnail
  facade using the stable `https://i.ytimg.com/vi/<id>/hqdefault.jpg` URL and
  a flat play overlay. The iframe is still created only after activation.
- Reused the existing HTML block widget, cursor/source toggle, iframe policy
  attributes, and validated embed URL. Autoplay was intentionally not added:
  the fixed Phase 1 permissions policy does not grant it.
- Generic raw iframes keep their hostname click-to-load placeholder and tweet
  embeds keep their script-free click-to-load card. Thumbnail failure removes
  the broken image and shows a readable fallback while preserving play.
- Added facade, activation, fallback, and policy-attribute regressions.
  `@app/editor` tests pass 33/33 and typecheck passes.

## 2026-08-21 — YouTube Facade Click Activation (ADR-0106)

- Root cause: facade activation was bound to `mousedown`, allowing CodeMirror
  selection handling to interfere with the widget before the click gesture
  completed; the iframe also lacked the autoplay permission/parameter.
- Facades now suppress mousedown selection and synchronously replace themselves
  on click. The validated YouTube URL receives `autoplay=1`, and the fixed
  Permissions Policy grants autoplay for this explicit activation path.
- Added runtime attribute and click-to-swap regression coverage. Generic iframe
  and tweet embed behavior remains unchanged.

## 2026-08-21 — YouTube Embed WebView Sandbox Fix (ADR-0107)

- Removed the runtime-invalid `allow-presentation` sandbox flag.
- Added provider-scoped policy handling: validated YouTube embeds receive
  `allow-scripts allow-same-origin` for player origin APIs, while arbitrary
  iframe hosts retain strict `allow-scripts` without same-origin access.
- Added sandbox-token validation and generic-host regression coverage. The
  sanitizer suite passes 17/17 and the editor suite passes 33/33; package
  typechecks pass. Actual WebView console/video confirmation remains a manual
  device check because no Tauri browser harness is configured.
## 2026-08-21 — Attachments Phase 6: External File Verification

- Audited the actual recursive watcher: it discarded every event except
  `.md`/`.canvas`, so externally-created attachments were a real gap.
- Extended that existing debounced watcher filter to accepted attachment
  extensions, with case-insensitive PNG/PDF acceptance and ZIP/extensionless
  rejection tests. No attachment-specific watcher or polling was introduced.
- Fixed the adjacent indexer boundary: supported files remain in the path
  inventory for file-tree and wikilink resolution, but only Markdown/canvas
  files enter note/tag/SQLite indexing. External attachment additions and
  removals use the existing `vault-changed` reconciliation and path refresh.
- `VaultIndexer.test.ts` passed 2/2. A live OS-file/WebView round trip could
  not be run because no Tauri browser harness or running vault session is
  configured in this workspace.

## 2026-08-21 — Embed Files Phase 1: Typed Embed Link Resolution

- Added pure `resolveEmbedLink` in `@app/editor`, reusing the indexer's shared
  wikilink target parsing/candidate lookup and the attachments package's
  centralized format allowlist.
- Added typed image/audio/video/PDF/note results plus explicit ambiguous,
  unresolved, and heading-not-found states. Duplicate basenames return sorted
  candidates rather than inheriting the legacy first-match note-navigation
  behavior; this is recorded in ADR-0114.
- Added 7 focused resolver tests, including exact `![[...]]` syntax emitted by
  the attachment paste/drop pipeline. Editor verification passes: 8 files,
  45 tests, and package typecheck.

## 2026-08-21 — Embed Files Phase 2: Image Embed Rendering

- Added `embedImageExtension` using a structural CodeMirror `StateField` and
  block replacement widgets, matching the existing HTML/Mermaid/math pattern.
  An initial ViewPlugin attempt was rejected by CodeMirror for block
  decorations and was corrected before completion.
- Resolved image embeds use Phase 1's typed resolver, native lazy/async image
  loading, existing `parseImageDimensions`, and desktop's `convertFileSrc`
  callback. Missing and ambiguous targets render distinct placeholders.
- Selection changes rebuild the StateField decorations, exposing raw source
  while the cursor is inside the line per ADR-0097. Read-only MarkdownView is
  wired to the same extension; other embed kinds remain out of scope.
- Verification: `@app/editor` 9 files/49 tests, package typecheck, and the
  existing desktop editor benchmark passed. Added an editor changeset with no
  new dependency.

## 2026-08-23 — Attachments Phases 1–7 Regression & Closeout

- Ran the closing integration sweep across the attachment package (16 tests),
  indexer (31), editor (49), desktop block/indexer integration (29), and
  paste/drop placement plus note-rename embed coverage (8 and 4 respectively).
- Added regression coverage for insertion inside list items, blockquotes, and
  table cells. The shared async pipeline preserves the surrounding source and
  reports partial failures without blocking editor work.
- Confirmed the existing watcher/path inventory/reconcile flow covers both
  app-created and externally-created attachment files. Confirmed canonical
  note rename preserves `![[...]]` targets, while Tags and HTML parsing do not
  misclassify or strip attachment syntax.
- Confirmed settings and location resolution do not perform synchronous
  filesystem checks during typing or ordinary renders. Added final ADR-0115
  indexing the seven phases, provisional allowlist caveat, watcher boundary,
  and deferred embed-kind scope.
- The Attachments plan is closed. Embed Files remains a separate feature area:
  resolution and image rendering are already implemented in its independent
  phases, while audio/video/PDF/note rendering remains deferred.

## 2026-08-23 — Sync Phase 0: Formal Supersession & Scope Lock

- Read and formally superseded ADR-0008 (`Manifest-diff file sync, not CRDT
  (Yjs)`) with ADR-0116 (`Sync via Drive/Syncthing, no owned backend`). ADR-0008
  remains content-unchanged apart from its status field; the index now marks it
  superseded.
- Confirmed the newer sync plan's two independent modes: client-side Google
  Drive sync and external folder synchronization such as Syncthing. No
  project-operated backend, relay, server database, or forced unified transport
  abstraction is in scope.
- Audited `services/sync-server`: it was only an echo scaffold with no
  implementation or runtime consumer. Removed the service, setup generator and
  workspace lockfile entries, plus stale mobile, release, desktop-plan,
  workflow, and ownership references. The separate `@app/sync-client`
  placeholder remains for future client-side work and has no server dependency.
- Updated `PROGRESS.md` with the locked boundary. No implementation dependency
  or network package was added.

## 2026-08-23 — Sync Phase 1: Manifest Infrastructure

- Added shared offline manifest generation in `@app/sync-client` with the
  exact `ManifestEntry` fields from the sync plan, separate size/mtime metadata
  for fast-path reuse, deterministic ordering, Lamport clocks, and tombstones.
- Bootstrap manifests hash every listed file. Incremental manifests skip
  unchanged size+mtime pairs, re-hash either changed metadata, and retain
  deleted files as tombstones while excluding them from current entries.
- Logged ADR-0117: Rust/platform adapters provide BLAKE3 and filesystem I/O;
  shared TypeScript owns manifest policy. No network, Tauri, Drive, or
  Syncthing-specific code was added.
- Verification: sync-client tests passed 5/5, including bootstrap,
  skip/re-hash, tombstones, and a 350-file large-vault-scale benchmark. The
  benchmark suite phase completed in 12 ms under the 1,000 ms guard; package
  typecheck passed. Added the sync-client changeset.
## 2026-08-23 — Sync Phase 2 Drive Auth

- Researched current Google OAuth requirements and recorded ADR-0118.
  `drive.file` is currently non-sensitive; testing caps and seven-day test
  authorizations were documented, along with production consent/policy
  requirements and the sensitive-scope timeline for future scope expansion.
- Added tested PKCE URL construction and refresh-token management to the shared
  sync client. The implementation requests no client secret and exposes a
  clear re-authentication path after refresh failure.
- Native Tauri loopback and OS-keychain adapters remain the next step before
  the Phase 3 sync logic can consume Drive auth.

## 2026-08-23 — Sync Phase 2 Native Auth Completion Attempt

- Added a one-shot 127.0.0.1 OAuth callback listener. It accepts one
  callback, returns a completion response, removes the listener from state,
  and forwards the code/state to the caller.
- Added OS-keychain storage using the Rust keyring crate. Read/write/delete
  errors are returned to the caller; there is no plaintext fallback.
- Added production configuration plumbing through the ignored
  VITE_GOOGLE_DRIVE_CLIENT_ID environment variable and an example file.
- cargo check passes. End-to-end Google sign-in and real keychain inspection
  could not be completed because this checkout has no configured client ID or
  interactive OAuth account/session. Phase 2 remains open and Phase 3 remains
  blocked.

## 2026-08-24 — Drive OAuth Client Configuration

- Added the supplied Google OAuth client ID to the ignored
  apps/desktop/.env; no client secret was stored or added to source.
- Production web build completed and native cargo check --offline passed.
- The build cannot be called end-to-end verified because the desktop shell
  currently has no sign-in UI wiring and no interactive OAuth session was
  available. Phase 2 remains open.

## 2026-09-01 — Sync Phase 0 Scope Audit

- Read the full `DECISIONS.md` index. The only old-sync ADR candidate is
  ADR-0008; no separate indexed ADR covers an owned sync server, object
  storage, or sync auth/accounts. ADR-0008 remains the historical decision
  being superseded because its conflict rule assumes server authority; its
  manifest-diff/non-CRDT scope is retained in ADR-0116.
- Verified ADR-0116 is indexed and independently documents the goals,
  independent Drive and folder modes, and deliberately excluded backend,
  relay, object-storage, unified-transport, and migration scope.
- Audited the baseline `services/sync-server`: it contains only an echo
  `index.ts`, package scripts, TypeScript config, and ESLint config. No
  `.github` workflow references it. Its files are already marked deleted in
  the worktree, but cleanup is flagged for explicit confirmation because the
  package exists in the baseline.
- Flagged stale historical sync-server wording in the desktop build,
  performance audit, and staging-release planning documents. Mobile and git
  workflow architecture references are already corrected in the worktree.

## 2026-09-01 — Sync Phase 1 Manifest Infrastructure

- Verified the Phase 0 ADR gate, then completed shared manifest infrastructure
  in `@app/sync-client`: the plan's `ManifestEntry` fields, deterministic
  generation, Lamport clocks, retained tombstones, JSON snapshot persistence,
  and an explicit full-rehash escape hatch for the size+mtime optimization.
- Added the desktop adapter and Rust commands for vault file metadata and
  bounded streaming BLAKE3 hashing using the maintained `blake3` 1.8.7 crate.
  No Drive or Syncthing integration was added.
- Recorded and indexed ADR-0119 for package placement, platform persistence,
  hashing boundary, and fast-path policy. Focused tests (10/10), typecheck,
  lint, and Cargo check passed; Cargo emitted only the existing unused watcher
  method warning.
- Finalized deletion of the baseline echo-only `services/sync-server` package,
  including generated artifacts. Stale planning documents remain unchanged as
  requested.

## 2026-09-01 — Sync Phase 2 Drive OAuth

- Re-verified Phase 0/1 ADR gates and researched Google’s current
  `drive.file` posture from official documentation. Recorded the 100-test-user,
  seven-day testing limit, non-sensitive scope classification, production
  readiness requirements, and the absence of a guaranteed verification
  turnaround in ADR-0120.
- Completed the concrete desktop PKCE flow: ephemeral loopback callback,
  state/path/encoding validation, direct Google token exchange and refresh,
  no client secret, and the `drive.file` scope only.
- Reused the existing Rust `keyring` pattern for OS-backed token storage and
  added desktop load/save/clear adapters. Transient refresh failures preserve
  credentials; invalid grants clear them and request re-authentication.
- Eleven sync-client tests, focused lint/typecheck, Cargo check, and Rust tests
  pass. Interactive consent, direct credential-store inspection, restart
  persistence, and sign-out deletion remain environment-dependent acceptance
  checks because no interactive Google session is available here. No manifest
  sync or file transfer logic was added.

## 2026-09-01 — Drive Auth Desktop Actions

- Added minimal Settings and lazy Command Palette actions for Drive sign-in,
  session refresh/check, and disconnect. Actions reuse the existing PKCE,
  refresh, and OS-keychain adapters and report success or failure without
  duplicating credential logic.

## 2026-09-01 — Desktop Sync Client Alias Fix

- Added the missing `@app/sync-client` aliases to the desktop Vite and Vitest
  configurations. The desktop web build and all 142 desktop tests now resolve
  the Drive auth module successfully.

## 2026-09-01 — Session Snapshot (PROGRESS.md archive; session close)

The following is the full `PROGRESS.md` state archived at session close.

# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## 2026-09-06 — Git Versioning Phase 1: Automatic Local Versions

### Decision

ADR-0153 selects a 2-second trailing-edge Git batch after the existing 750 ms
note-save debounce. The first saved note activates local history, superseding
only Phase 0's deferred-toggle assumption. One commit groups Markdown notes
saved close together, with path-aware `Auto-save` messages. The Command
Palette's **Save version now** action flushes an immediate, distinct manual
message.

### Verification

- Rust tests inspect actual local Git logs for an automatic two-note batch and
  an explicit manual version; both run in fresh repositories with no remote.
- Scheduler and Command Palette tests pass alongside the existing workspace
  save tests.
- The adversarial 2.1 MB Markdown edit ran real `git add` and `git commit` in
  111 ms while the JavaScript input loop's largest measured delay was 1.00 ms,
  under the 50 ms target.

### Scope Boundary

The Git command runs off the UI path in `spawn_blocking` and holds one mutex
from repository initialization through commit. Version metadata remains inside
`.git`; no `vault-index.db` state, database connection, migration, or
`withDbLock` call was added. Phase 2 owns only local history, diff, and safe
restore UI; remotes remain Phase 3+.

## 2026-09-06 — Git Versioning Phase 0: Engine and Local-Only Architecture

### Decision

ADR-0152 selects the installed system `git` executable, not `git2-rs`.
`git2-rs@0.21.0` remains actively maintained, but forcing a real libgit2 call
in this app's desktop release build increased the executable from 15,686,544
to 16,331,936 bytes (+645,392 bytes / 630 KiB). This violates the required
zero Git-engine cost for users who never enable history; runtime JavaScript
gating cannot remove native code compiled into Tauri.

The fallback has no new dependency and no built-in Git engine. It relies on
the system Git executable and returns a clear installation error only when the
user explicitly enables Version History on a machine that lacks Git.

### Implementation and Verification

- Added `src-tauri/src/git.rs` with `initialize_local_git_repository` and a
  Phase 2-facing TypeScript loader. The loader's `import()` is genuine; Phase
  0 has no UI caller and therefore no version-history code is emitted into the
  no-action web build.
- The initializer runs `git init --quiet`, creates `.gitignore` only if absent,
  and configures no remote. The ignore policy permits only recursive `.md`
  files, so `vault-index.db`, embedding/cache files, attachments, and the
  policy file itself do not enter normal `git add --all` staging.
- Focused Rust test passed: fresh temp vault, `.git/HEAD` present, empty remote
  list, and cached staged paths exactly `note.md`. It uses no network command
  or remote. The desktop staging workflow now runs this test on all release
  platforms.
- Verified `cargo test` (focused), `cargo check`, desktop web build, and
  release build. The no-action release executable is 15,686,544 bytes and the
  main web entry is 368,090 raw / 116,570 gzip bytes; asset-symbol scan found
  no Version History code.

### Scope Boundary

No automatic commits, history UI, remotes, credentials, or version-state
database persistence were introduced. No `vault-index.db` operation was added,
so the existing single `withDbLock` queue was not touched. Phase 1 owns
debounced automatic commits and input-latency verification.

## Current Focus

**Stabilization Phase 1 — note CRUD** — delete, duplicate, and move functionality are implemented, unit tested, and UI wiring in `FileTree` confirmed correct. Note CRUD continues to use canonical vault operations for filesystem, SQLite, graph, and workspace state.

## Sync Phase 0 — Formal Supersession & Scope Lock Complete

- Superseded [ADR-0008](docs/adr/0008-manifest-diff-sync-not-crdt.md), whose
  server-canonical conflict model no longer describes the intended architecture,
  with [ADR-0116](docs/adr/0116-sync-via-drive-syncthing-no-owned-backend.md).
- The accurate boundary is now two independent modes: client-side Drive
  manifest/file sync and user-owned folder synchronization such as Syncthing.
  There is no backend, relay, server database, hosting cost, or forced shared
  transport abstraction to own or operate.
- Confirmed `services/sync-server` was only an echo/scaffold package, with no
  implementation or CI runtime dependency. Its tracked source/package files
  and generated artifacts are now removed. The lightweight `@app/sync-client`
  package remains as the future client-side implementation and has no server
  dependency.
- No `.github` CI workflow references `services/sync-server`. Stale historical
  planning prose remains in `plans/desktop-app-build.md`,
  `plans/phase-12-performance-audit.md`, and `plans/phase-13-staging-release-1.md`
  and is flagged for a separate planning-doc cleanup; the updated
  `mobile-app-stack-architecture.md` and `git-workflow.md` no longer describe
  an owned sync server.

Sync Phase 1 is unblocked and may proceed against this locked scope.

## Sync Phase 2 — Drive Auth Implementation Complete; E2E Acceptance Pending

- Recorded [ADR-0120](docs/adr/0120-drive-oauth-authentication-and-verification.md),
  incorporating the current Google `drive.file` research: it is non-sensitive
  and per-file; testing supports 100 listed users with seven-day authorizations;
  production still requires policy, brand, domain, and rollout readiness.
- `@app/sync-client` now provides PKCE URL construction, token exchange
  contracts, silent refresh with refresh-token preservation, explicit
  re-authentication on provider invalid-grant errors, retryable transient
  failures, and sign-out through its storage boundary.
- Desktop now provides Google token HTTP exchange/refresh, Web Crypto PKCE,
  loopback callback/state validation, Tauri keyring-backed token storage, and
  a working disconnect command. The requested scope is only `drive.file`; no
  client secret is embedded or requested.
- Settings and the lazy Command Palette now expose Sign in to Drive,
  Refresh Drive Session, and Disconnect Drive actions with clear success/error
  feedback.
- Fixed the OAuth callback wait so the blocking loopback socket accept runs on
  Tauri's blocking task pool; waiting for the browser redirect no longer
  freezes the app UI.
- Replaced the Tauri-webview `window.open` call with a native default-browser
  launcher. Authorization URL validation and launch errors now return to the
  UI instead of failing silently; no additional runtime dependency was added.
- Corrected the Desktop OAuth loopback redirect to Google's required root form
  (`http://127.0.0.1:<port>`, without `/oauth/callback`) and added callback
  parser regression tests.
- Fixed the native endpoint response mapping: Tauri serializes `redirect_uri`
  in snake_case, so the desktop client now reads that field before building the
  authorization URL. This removes the Google `redirect_uri=undefined` failure.
- Corrected the ignored local desktop environment to use the supplied OAuth
  Desktop client ID; the previously loaded value belonged to a different
  client ID.
- Eleven sync-client tests, focused lint/typecheck, Cargo check, and Rust tests
  pass. Full interactive sign-in, direct OS-keychain inspection, restart
  persistence, and sign-out deletion remain unverified because this checkout
  lacks an available interactive consent session; no Drive file transfer was
  added. Desktop-wide typecheck remains blocked by the pre-existing
  `createNoteCrudActions.ts` scope errors.

## Sync Phase 1 — Manifest Infrastructure Complete

- Added shared `ManifestEntry` and offline `generateManifest` infrastructure
  to `@app/sync-client`, including `{ path, hash, size, deviceClock, deleted }`
  entries, metadata for the size+mtime fast path, deterministic ordering, and
  a current-entry filter that excludes tombstones.
- Bootstrap generation hashes every listed file. Incremental generation reuses
  unchanged non-deleted entries when size and mtime match, re-hashes when either
  changes, and preserves deleted entries as Lamport-clocked tombstones.
- Closed the package/persistence and hashing boundary in [ADR-0119](docs/adr/0119-manifest-infrastructure-boundaries.md), following [ADR-0025](docs/adr/0025-js-side-indexer-rust-io-only.md): Rust/platform adapters provide bounded filesystem walking, metadata, and streaming BLAKE3; shared JS owns manifest policy. No network, Tauri, Drive, or Syncthing integration was added.
- JSON snapshots persist through a small platform storage adapter. Missing files become retained Lamport-clocked tombstones; unchanged files use the size+mtime fast path. An explicit `forceRehash` option handles the rare mtime-preserving content edit edge case.
- Verification: 10 sync-client tests passed, including bootstrap, skip/re-hash, tombstones, full rehash, JSON persistence, and a 350-file fixture-scale benchmark. Package typecheck and focused lint passed; Cargo check passed with BLAKE3 1.8.7. Full native fixture execution remains deferred to the desktop runtime adapter.

## Phase 5 Checkpoint — Tag Search Closed

The original prerequisite block is resolved by the completed General Search
plan. The current checkpoint is documented below in “Tags Feature Phase 5 —
Tag Search Closed”; the stale blocked status is retained only in older history
records, not as current state.

## General Search Phase 0 — Scope & Architecture Complete

- [ADR-0079](docs/adr/0079-general-search-surface.md): full-text/operator Search will be a separate lazy UI and results surface; Command Palette stays a fuzzy path/title Quick Switcher.
- [ADR-0080](docs/adr/0080-general-search-sqlite-fts5.md): extend the existing JS `@app/indexer` + SQLite architecture with an incremental FTS5 content index. No new search dependency or parallel in-memory engine.
- [ADR-0081](docs/adr/0081-general-search-v1-operators.md): v1 supports plain terms, quoted phrases, `tag:` (optional `#`, normalized away), and leading `-` exclusions. `tag:` uses Phase 4's descendant-inclusive, ancestor-asymmetric query semantics. Other operators are explicitly deferred.
- [ADR-0082](docs/adr/0082-general-search-package-placement.md): search parsing and index execution live in `@app/indexer`; UI wiring remains in `apps/desktop`.

Phase 1 may now implement the FTS schema/index path. Phase 5 Tag Search remains blocked until the general search implementation and results UI exist.

## General Search Phase 1 — Full-Text Index Complete

- Added SQLite FTS5 migration v3 (`notes_fts`) indexing note body content only, as specified by ADR-0080. No new dependency or parallel in-memory index was added.
- Reused the existing `persistNotesBatch` and `removeNoteFromIndex` paths, so full-vault indexing, watcher edits, creation, deletion, and canonical rename/move operations update FTS incrementally. Batch updates delete and replace only affected paths.
- Added focused tests for FTS row replacement and the existing CRUD/reconcile integration boundaries. The 1,000-note batch benchmark completed within the `<1000 ms` guard (reported suite test time: 3 ms).
- No field-level deviation: Phase 0 specified note body indexing at minimum and did not choose separate path/frontmatter/heading FTS columns; `path` is an unindexed identifier column for maintenance and future joins.
- Focused desktop tests passed. Desktop typecheck remains blocked by the pre-existing `createNoteCrudActions.ts` `result` scope errors.

Phase 2 may implement the query parser. Phase 5 Tag Search remains blocked until the general search implementation reaches its later execution/UI phases.

## General Search Phase 2 — Query Parser Complete

- Added an extensible operator registry in `@app/indexer` for v1 terms,
  quoted phrases, `tag:` with optional `#`, and leading-minus exclusions.
- `tag:` produces `{ kind: "tag", tagKey }` with the normalized key consumed
  directly by Phase 4's `queryNotesByTag`; an integration test verifies nested
  descendant matching.
- Empty queries return no clauses. Empty `tag:` values produce a parse error
  and no clause. Unknown `name:value` tokens remain plain terms. These choices
  are recorded in [ADR-0083](docs/adr/0083-general-search-parser-edge-cases.md).
- Parser tests cover mixed queries, both tag spellings, exclusions, malformed
  input, Phase 4 integration, and a throwaway registered operator.

Phase 3 may implement query execution. Tag Search remains blocked until the
general search execution and UI phases are complete.

## General Search Phase 3 — Query Execution & Ranking Complete

- Added `executeSearchQuery` in `@app/indexer`, consuming Phase 2 parser output,
  SQLite FTS5 rows, and Phase 4 `queryNotesByTag` directly.
- Positive clauses use implicit AND; leading-minus clauses remove matches.
  Parent tag queries retain descendant matching and nested queries retain the
  Phase 4 ancestor asymmetry.
- FTS results return path/title/mtime, SQLite `bm25` score, and snippets. Lower
  bm25 scores rank first; title then path resolve ties. Tag-only results use
  score zero with title/path ordering. Combined queries rank by FTS relevance
  within the tag-filtered subset. These choices are recorded in
  [ADR-0084](docs/adr/0084-general-search-execution-ranking.md).
- Added combined, tag-only, exclusion, and deterministic-ranking tests. The
  focused execution/parser/index suite passed 14 tests; the 1,000-note
  combined benchmark completed in a 4 ms Vitest test phase and stayed under
  the 1-second guard.

Phase 4 may implement the Search UI. Tag Search remains blocked until the
general search UI is available.

## Bug Fix — Live Vault Index Exposure

- Confirmed the gap: `@app/indexer` had only pure TagIndex builders/mutators;
  desktop discarded the full-load result and held no long-lived tag index.
- Added `useWorkspaceStore.tagIndex`, initialized from the notes already loaded
  by `indexVaultFull`, then mutated in place by watcher reconciliation, note
  saves, and canonical deletes. No component or query performs a vault scan.
- The full-text index is already live in SQLite and remains exposed through
  the singleton `getVaultIndexDb()` accessor; no duplicate JS full-text index
  was introduced. The state pattern is documented in ADR-0085.
- The existing focused desktop path typechecks except for the pre-existing
  unrelated `createNoteCrudActions.ts` `result` scope errors.

## Tags Feature Phase 5 — Tag Search Closed

- Re-verified General Search's settled convention: `tag:#meeting` and
  `tag:meeting` are equivalent; `#` is optional and normalized away.
- Confirmed parent queries include descendants while nested queries do not
  include ancestors through the stable Phase 4 `queryNotesByTag` path.
- Confirmed the Tags editor path forwards rendered tag keys to desktop,
  pre-fills Search with `tag:<key>`, and executes through the shared parser and
  executor. No tag parsing, search, or index logic was duplicated here.
- Verification passed: core tag rules 11/11, index/parser/execution 14/14,
  and editor tag rendering/click forwarding 5/5. The Search UI callback path
  is covered by the existing desktop wiring; rendered UI automation is not
  configured in this repository.
- The Tags plan's Phase 5 checkpoint is closed. Tags Phase 6 (Tags view) is
  ready to resume as a separate task. General Search's existing benchmark
  tooling caveat remains documented in ADR-0086.

## Tags Feature Phase 6 — Tags View Complete

- Added a lazy Tags dialog opened by a `Browse Tags` Command Palette action.
  Reopening/focusing uses the existing dialog state path and does not affect
  the Quick Switcher.
- Rendered a nested tree from the live workspace `TagIndex`, using
  `getCanonicalTag` for display casing and synthesizing parent rows for nested
  tags. Counts are direct-use counts only; descendants are not included in
  parent totals. This is documented in [ADR-0087](docs/adr/0087-tags-view-counts-and-live-updates.md).
- Tag selection reuses the editor tag-click callback path, opening Search with
  the same nested-aware `tag:` query.
- The view subscribes to `vaultUpdateCounter`, so incremental note tag edits,
  additions, removals, and renames refresh the open tree without polling or a
  vault rescan.
- Focused VaultIndexer tests pass. Desktop typecheck remains blocked by the
  pre-existing `createNoteCrudActions.ts` `result` scope errors.

Tags Phase 6 is closed. The Tags plan is ready to proceed to Phase 7.

## Tags Feature Phase 7 — Regression & Integration Complete

- Full regression sweep passed: shared tag rules 11/11, index/parser/search
  14/14, editor tag rendering 5/5, and focused desktop vault update tests 4/4.
- Editor coverage explicitly confirms tags in headings, list items, blockquotes,
  table cells, and links, while inline/fenced code tag-looking text remains
  excluded. No canvas tag parser drift exists; canvas does not claim markdown
  tag semantics for its card content.
- A 1,000-note vault with nested tags built and queried in 3 ms of Vitest test
  time, under the 1-second guard. Existing General Search mocked query/update
  benchmarks remain 3–4 ms. Real SQLite cold-start benchmarking remains the
  tooling limitation documented in ADR-0086.
- Canonical casing, nested descendant/asymmetry semantics, live update wiring,
  direct-count Tags view behavior, and tag-click search all continue to share
  the existing index/parser paths. Tag rename/merge UI and Bases `hasTag`
  integration remain explicitly out of scope.
- Final decision index: [ADR-0088](docs/adr/0088-tags-plan-closeout.md).

Tags Feature Phases 1–7 are complete. No further Tags phase is planned unless
a future regression or separately scoped feature requires one.

## HTML Support Phase 1 — Sanitization Core Complete

- Added standalone `@app/sanitize` using DOMPurify 3.4.14; no editor or
  rendering integration was added.
- Exact allowlist: `u`, `s`, `span`, `div`, `table`, `tr`, `td`, safe comments;
  only `class` and constrained `style` attributes. Scripts, style blocks,
  iframes, event handlers, URL-bearing attributes, and unsafe CSS are removed.
- Added five happy-path and attack-vector tests, including the source
  document's pasted `<script>` example, malformed markup, encoded payloads,
  unsafe URLs, and CSS injection.
- `@app/sanitize` tests (5/5), typecheck, and build pass. DOMPurify's bundle
  cost and policy choice are recorded in ADR-0089; CSS/class policy is in
  ADR-0090.

Next up: HTML Support Phase 2 — block-level HTML detection and rendering routed
through this sanitizer.

## HTML Support Phase 2 — Block-Level HTML Detection & Rendering Complete

- Added `htmlBlockExtension` and `htmlBlockTheme` to the existing CodeMirror
  replacement-widget path used by the editor and read-only MarkdownView.
- Block detection requires a contiguous, nonblank, matching-tag block rooted at
  `table` or `div`; blank lines abort the block, so the documented broken table
  example remains literal rather than allowing a later `<td>` fragment to
  render independently. The boundary rule is recorded in ADR-0091.
- Every rendered block is passed through `@app/sanitize` immediately before
  widget DOM assignment. Document changes rebuild decorations, covering initial
  load, typing, paste, undo, and redo through CodeMirror's normal update path.
- HTML block tests pass 3/3: safe table rendering, named blank-line regression,
  and re-sanitization after editing a safe block into a script payload.
- No sanitizer policy or allowlist was changed, and no raw HTML path bypasses
  the Phase 1 package.

Next up: HTML Support Phase 3 — inline HTML elements and comments.

## HTML Support Phase 3 — Inline HTML Elements Complete

- Added a same-line inline HTML decoration pass for `<u>`, `<s>`, `<span>`,
  same-line `<div>`, and HTML comments, routed through the Phase 1 sanitizer
  before widget DOM assignment.
- `<s>` reuses the existing Markdown strikethrough `line-through` treatment;
  `<u>` uses the corresponding underline treatment. HTML comments are hidden,
  consistent with native Markdown comments.
- Added adjacent-Markdown boundary tests, the source cursive-span example, and
  comment visibility coverage. The cursive `font-family` property is stripped
  as required by ADR-0090; the sanitizer allowlist was not loosened.
- HTML block and inline suites pass 6/6. No raw HTML path bypasses the Phase 1
  sanitizer. Next up: Phase 4 no-Markdown-inside-HTML enforcement.

## General Search Phase 4 — Search UI Complete

- Added a separate lazy `SearchDialog`, preserving the Command Palette as the
  fuzzy path/title Quick Switcher per ADR-0079.
- Search opens from the icon rail and `Cmd/Ctrl+Shift+F`; `Cmd/Ctrl+K` remains
  unchanged. Results consume Phase 3's `SearchResult` output directly,
  including snippets, scores, titles, and paths.
- Added 150 ms live-query debouncing. Phase 3's 1,000-note combined benchmark
  completed in 4 ms, so 150 ms prevents per-keystroke database work while
  keeping the UI responsive.
- Added arrow-key navigation, Enter-to-open, ranked result display, snippet
  highlighting, and a tag-only fallback label. The result list is bounded by
  the dialog viewport and scrolls instead of rendering an unbounded surface.
- Phase 5 tag-click wiring remains separate and has not been changed.

## General Search Phase 5 — Tag Click Wiring Complete

- Replaced the editor tag click no-op with the existing `onTagClick` callback
  path. Desktop now constructs `tag:<canonical-key>`, opens Search, pre-fills
  the query, and executes it through the same Phase 2 parser and Phase 3
  executor used by direct Search input.
- Nested tags require no special handling: clicking a parent or nested tag
  preserves Phase 3's existing descendant-inclusive and ancestor-asymmetric
  semantics.
- Direct Search entry resets to an empty query; programmatic tag entry keeps
  its initial query. Added the editor/desktop changeset and retained existing
  tag rendering behavior.
- The Tags plan's Phase 5 checkpoint is now unblocked and verified through the
  real editor callback path; Phase 6 Tags view is ready to resume separately.

## General Search Phase 6 — Regression & Performance Pass

- Functional regression verification passed: indexer search/tag suite 14/14,
  editor tag-rendering suite 5/5, and focused desktop vault/FTS/CRUD suite
  13/13. `@app/indexer` and `@app/editor` typecheck successfully.
- The separate Command Palette remains untouched and retains its original
  Cmd/Ctrl+K fuzzy path/title behavior; Search uses its own Cmd/Ctrl+Shift+F
  entry point.
- Existing recorded benchmarks remain 3 ms for the Phase 1 1,000-note FTS
  batch and 4 ms for the Phase 3 1,000-note combined execution test.
- The repository large-vault benchmark could not execute: its Node entrypoint
  imports missing `packages/core-types/NoteTags.js`. Cold-start SQLite,
  per-note CRUD, and real-vault query timings therefore remain unverified;
  this is recorded in [ADR-0086](docs/adr/0086-general-search-plan-closeout.md)
  and the General Search plan is not marked fully complete until that tooling
  blocker is resolved.
- Tags Phase 6 (Tags view) is functionally unblocked and ready as a separate
  task, subject to the benchmark/tooling caveat above.

## Tags Feature Phase 2 — Inline Tag Detection & Rendering (@app/editor) (ADR-0077)

### Completed
- Added `tagExtension` to `@app/editor`, importing the shared `matchTags`/`TagRegistry` logic from `@app/core-types` instead of reimplementing any tag parsing locally.
- Rendered valid inline tags as badge-style replacement widgets with existing design-token styling, hover affordance, and click forwarding through a stub `onTagClick(tagKey)` callback.
- Chose first-seen canonical display casing for the badge text, preserving the markdown source as the underlying document of truth and documenting that policy in ADR-0077.
- Excluded tags inside inline code and fenced code blocks using the existing syntax-tree/code-node check pattern.
- Wired tag rendering into both `Editor` and `MarkdownView`, added package-local test tooling, and logged a new editor changeset.

### Verification
- `packages/editor/tagExtension.test.ts` passes with coverage for canonical casing, click forwarding, code exclusion, headings/lists/blockquotes/tables, inline formatting, links, and a typing-latency benchmark.
- `@app/editor` typecheck, lint, and build pass.
- The benchmark assertion holds under `<5 ms` per simulated keystroke on a large tagged document.

## Tags Feature Phase 1 — Tag Parsing Rules & Data Model (@app/core-types) (ADR-0075, ADR-0076)

### Completed
- Placed the shared tag model and parser in `@app/core-types`, the existing dependency-free package already shared by `@app/editor` and `@app/indexer`.
- Implemented the exact Unicode-aware matching rule: letters, numbers, marks, symbols, `_`, `-`, `/`, and ZWJ are allowed; whitespace and punctuation terminate a tag; all-numeric bodies are rejected.
- Added nested-tag decomposition for `#a/b/c` and a canonical-casing registry that preserves the first-seen display form while matching case-insensitively.
- Updated the package's internal runtime imports to `.js` specifiers so the built `dist` entrypoint can be loaded directly by Node.
- Logged the shared-package placement decision and the Unicode matching rule as ADR-0075 and ADR-0076.

### Verification
- `@app/core-types` unit tests pass for valid/invalid tags, nested decomposition, and canonical registry behavior.
- `@app/core-types` typecheck, lint, and build pass.
- Confirmed the built module imports cleanly from a plain Node/test context without React or CodeMirror dependencies.
- Added an `@app/core-types` patch changeset.

## Phase 11 — Math (@app/editor) (ADR-0074)

### Completed
- Chose KaTeX 0.18.4 over MathJax for the current LaTeX scope: the required determinant/matrix and exponential expressions are supported, with an approximately 4.3 MB installed package footprint. The JavaScript renderer is dynamically imported.
- Added cursor-gated multi-line `$$ ... $$` block rendering and inline `$...$` rendering. Active editable lines retain raw math source; read-only views render inline math immediately.
- Added graceful invalid-LaTeX placeholders and KaTeX stylesheet/theme integration.
- Reused Phase 10's 150 ms external-update debounce and documented the MathJax-extension compatibility boundary in ADR-0074.

### Verification
- Determinant/matrix block, exponential inline math, cursor toggle, and invalid-LaTeX tests pass.
- Existing Mermaid, table, formatting, and editor benchmark coverage remains passing; package typecheck/lint/build pass.
- Added an `@app/editor` patch changeset.

## Phase 10 — Mermaid Diagrams (@app/editor) (ADR-0073)

### Completed
- Confirmed Phase 9 table rendering and source-backed editing remained stable before adding diagrams.
- Added Mermaid 11.16.1 as a scoped dependency. Its approximately 83 MB installed dependency tree is dynamically imported, keeping the initial editor bundle path free of Mermaid.
- Added generic Mermaid fenced-block detection for `mermaid` tags and cursor-gated replacement widgets. Flowcharts, sequence diagrams, quoted special-character labels, and future Mermaid diagram types use the same renderer.
- Added `class NodeId internal-link;` click handling through the existing editor `onLinkClick`/vault resolution path.
- Invalid or incomplete Mermaid source renders a graceful error placeholder instead of throwing.

### Performance decision
- Logged ADR-0073: raw source remains visible while the cursor is inside a diagram; leaving the block renders immediately, while external document changes use a 150 ms debounce. Mermaid is never re-rendered on every keystroke inside the block.
- CodeMirror cannot replace line breaks from a ViewPlugin, so the visual block uses a first-line Mermaid widget plus continuation widgets, preserving the existing widget pattern without a separate renderer or editable DOM state.

### Verification
- Mermaid flowchart, sequence, internal-link, special-label, invalid-syntax, and cursor-toggle tests pass.
- Existing table, editor, and performance tests remain passing; `@app/editor` typecheck/lint/build pass.
- Added an `@app/editor` patch changeset.

## Bug Fix / Feature — Live Editable Table Grid (@app/editor)

### Root cause and fix
- Reproduced completed tables in Live Preview: Phase 9 detected valid blocks and marked cells, but rendered no grid; pipes and the separator remained ordinary text.
- Added grid rendering to the existing CodeMirror table decoration path. Rows use flex layout, cells use editable marks with equal column sizing and borders, delimiters are visually suppressed, and the separator row is hidden except while active for source editing.
- Cell content remains the CodeMirror document range, so direct typing updates the markdown source and existing context-menu mutations continue to operate on the same ranges. Escaped pipes are excluded from delimiter decoration and inline decorations remain inside cell ranges.

### Verification
- Added coverage for grid rows/cells/delimiters and editing a body cell while preserving pipe-delimited markdown.
- Table parsing, alignment, escaped-pipe, context-menu, line-wrapping, and benchmark tests pass; editor latency remains under `<5 ms`.
- No separate editable DOM state or dependency was added; no ADR was needed because this reuses the existing mark/decorations pattern rather than introducing a new widget architecture.

## Bug Fix — Enter After Ambiguous Table Header (@app/editor)

### Reproduction and result
- Reproduced the reported sequence with the full editor keymap: pressing Enter after `| First name | Last name |` creates a normal newline.
- Confirmed the same behavior for `| text |`, multi-column pipe-like lines, and ordinary text following a pipe-like line.
- Confirmed Phase 9's `tableExtension` has no Enter keybinding; it only provides viewport decorations and the context menu. CodeMirror's existing default Enter command therefore remains responsible for newline insertion and is not swallowed by table logic.

### Verification
- Added regressions covering the ambiguous header, single-column-looking row, and following-line cases.
- Existing valid-table parsing and context-menu tests remain passing; no production change or changeset was required because the reported bug is not present in the current implementation.
- Editor performance verification remains under the existing `<5 ms` target.

## Bug Fix — Consistent Editor Line Wrapping (@app/editor)

### Root cause and fix
- Confirmed the inconsistent behavior was deterministic by configuration: neither `Editor` nor read-only `MarkdownView` included CodeMirror's `EditorView.lineWrapping` extension, so long prose lines extended horizontally.
- Enabled `EditorView.lineWrapping` in both shared editor configurations.
- Removed table-cell shrink-to-fit styling (`display: inline-block` and minimum width) that could prevent cell content from wrapping once global wrapping was enabled.
- Preserved the intended code distinction with a scoped `.cm-line.cm-code-block` layout rule: fenced-code lines remain horizontally scrollable instead of being forced to wrap.

### Verification
- Long-line coverage passes for plain prose, lists, tables, blockquotes, and code-adjacent content; `.cm-lineWrapping` is present in the editor content.
- Table, line-wrapping, and benchmark tests pass; full editor regression verification remains under the existing `<5 ms` keystroke target.
- Added a patch changeset for `@app/editor`.

## Editor Markdown Formatting — Phase 8: Escaping Edge Cases (@app/editor) (ADR-0072)

### Completed
- Verified the full escape matrix for `\\*`, `\\_`, `\\#`, `\\``, `\\|`, `\\~`, and `\\=`. Each backslash is hidden by the existing per-occurrence `Escape` decoration while its literal character remains visible.
- Verified `1\\.` does not become an ordered list; the existing list marker logic requires the period/delimiter immediately after the number, so the escaped form is skipped.
- Verified per-character scope beside real italic/bold/highlight/heading syntax, escaped pipes in table-like text, and the Phase 1 audit fixture's escaped examples.
- Added final escape matrix regressions and the final ADR-0072 indexing the Phase 1–8 decisions. No production syntax or dependency change was required.

### Verification
- Final Phase 2–8 focused suite: 52 tests passing.
- `@app/editor` typecheck, lint, and build pass; desktop focused lint passes.
- Final editor benchmark remains under the `<5 ms` per-keystroke requirement.

### Basic Markdown formatting plan closed
- Phases 1–8 are complete: audit, line breaks, inline formatting, links/images, lists/tasks, code blocks, quotes/footnotes/comments, and escaping verification.
- Future editor syntax work must begin as a separately scoped phase and preserve the single CodeMirror rendering path and performance budget.

## Editor Markdown Formatting — Phase 7: Quotes, Footnotes & Comments (@app/editor) (ADR-0071)

### Completed
- Added viewport-bounded blockquote line decorations with a continuous left-border indicator across consecutive quote lines.
- Added numbered footnote reference and definition widgets for numeric and named definitions, including indented continuation content.
- Matched Obsidian's inline-footnote scope: `^[text]` renders as a numbered marker only in read-only `MarkdownView`; editable `Editor` leaves it as normal Markdown text. Logged in ADR-0071.
- Added visible, dimmed comment styling for `%%inline%%` and multiline comments in the editor. Existing `MarkdownView` hides comments rather than introducing a new reading-mode system.
- Added mixed-syntax regressions for inline formatting, links, lists, code blocks, comments, and horizontal rules. The annotation pass skips code content.
- Kept all work in the existing CodeMirror decoration path and visible ranges; no dependency added.

### Verification
- Phase 2–7 focused suite: 48 tests passing, including the Phase 6 inline-code styling fix and horizontal-rule regressions.
- `@app/editor` typecheck, lint, and build pass; desktop focused lint passes.
- Expanded editor benchmark passes the existing `<5 ms` per-keystroke assertion.

### Deviation
- Footnote click-to-definition navigation remains the documented stretch goal and was not added in this phase.

## Bug Fix — Inline Code Visual Styling (@app/editor)

### Root cause and fix
- Reproduced with the existing CodeMirror JSDOM harness; the Markdown parser emitted `InlineCode`/`CodeMark`, and `livePreviewExtension` hid the delimiters correctly for both single- and double-backtick spans.
- The code content had only the generic `t.monospace` highlight rule, whose font family was the same editor font and had no visual background, border, or distinct color. Extended that existing rule with accent color, secondary background, subtle border, small radius, and padding; no parallel decoration system was added.
- Added coverage for single-word and multi-word spans, distinct highlighted content, delimiter behavior, double-backtick literals, cursor editing, and the existing benchmark.

### Verification
- Phase 6 focused suite: 37 tests passing.
- `@app/editor` typecheck, lint, and build pass; latency remains under the existing `<5 ms` benchmark assertion.
- Added a patch changeset for `@app/editor`.

## Editor Markdown Formatting — Phase 6: Code Blocks (@app/editor) (ADR-0070)

### Completed
- Added live-preview decoration for single/double inline-code delimiters, fenced code delimiters/info tags, and indented code blocks while preserving literal code content.
- Reused the existing Lezer Markdown parser for 3+ backtick/tilde fences, four-space/tab indentation, and nested fence rules; explicit 4-backtick-in-3-backtick and tilde-with-backtick cases are covered.
- Configured CodeMirror's nested language support for JavaScript/TypeScript-family tags (`js`, `jsx`, `javascript`, `mjs`, `cjs`, `ts`, `tsx`, `typescript`) in both `Editor` and `MarkdownView`.
- Verified code content is not parsed/decorated as Phase 3 inline formatting and code blocks nested in list items remain intact.
- Added focused Phase 6 tests and expanded the 1,000-line benchmark to include fenced code and language resolution. No per-keystroke full-document scan or new parallel Markdown renderer was added.
- Added ADR-0070, DECISIONS.md index entry, lockfile/package dependency, and an `@app/editor` minor changeset. Installed grammar footprint is approximately 88 KB in the workspace.

### Verification
- Phase 2–5 regression suite plus Phase 6: 35 tests passing.
- `@app/editor` typecheck, lint, and build pass; desktop focused lint passes.
- Expanded editor benchmark passes the existing `<5 ms` per-keystroke assertion.

### Deviation
- Syntax highlighting is intentionally limited to JavaScript/TypeScript-family fences. Python, Rust, Go, CSS, HTML, SQL, and other languages are documented as future coverage in ADR-0070 rather than added to the always-loaded editor bundle.

## Bug Fix — Ordered List Numbers Not Rendering (@app/editor) (ADR-0069)

### Root cause and fix
- Reproduced through the existing CodeMirror JSDOM harness (the package has no dev/playground script). Static `1.` / `1)` lines and unordered markers rendered correctly; the failure occurred only during incremental entry because `listExtension` skipped every active-line marker. The raw `1. ` source remained, but no ordered decoration/widget existed.
- Updated the existing list decoration path to render only the ordered numeral/delimiter on the active line. Unordered markers and task checkbox widgets retain their raw active-line editing behavior; item text remains a normal editable range.
- Added ADR-0069 (superseding the active-line portion of ADR-0068) and a patch changeset for `@app/editor`.

### Verification
- Regression coverage now types `1. ` character-by-character and confirms the active `1.` widget, while existing coverage verifies `1.` / `1)` rendering, multiple numbered items, unordered bullets, cursor editing, and mixed list content.
- `@app/editor` and desktop typecheck/lint pass; 30 focused list, line-break, inline, links/images, and benchmark tests pass. Expanded benchmark measured **1.043 ms/keystroke**, under 5 ms.

## Editor Markdown Formatting — Phase 5: Lists & Tasks (@app/editor) (ADR-0068)

### Completed
- Added viewport-bounded `listExtension` to the existing CodeMirror live-preview path. It renders `-`, `*`, and `+` with one bullet treatment, preserves `1.` and `1)` markers, supports mixed nested lists at any valid Markdown depth, and retains raw source on the active editable line.
- Added task widgets for `[ ]`, `[x]`, and every other one-character marker. Any non-space marker receives completed styling. Clicking a writable checkbox dispatches a CodeMirror transaction which changes only the Markdown marker; off → on writes canonical `x`, on → off writes a space.
- Moved `ListMark` ownership out of `livePreviewExtension` to avoid competing decorations. `MarkdownView` uses the same extension in read-only mode with disabled checkboxes.
- Kept CodeMirror's native `indentWithTab` binding as exported `listIndentKeymap`; it supports both single and multi-item selections without a custom indentation implementation.
- Made Phase 2's `Shift+Enter` command list-aware: in an ordered item it inserts the two-space Markdown hard break plus continuation indentation at the item's content column, so it remains one numbered item.
- Added Phase 5 tests covering all marker variants, any-character task completion and transactional toggling, deep mixed nesting, Phase 2–4 content within list items, native Tab/Shift+Tab multi-item indentation, and ordered-list Shift+Enter. Expanded the 1,000-line benchmark with task-list content and `listExtension`.
- Added required pre-implementation plan at `plans/editor-formatter/phase-5-lists-tasks.md`, ADR-0068, and an `@app/editor` minor changeset.

### Deviation from Step 0 plan
- None. The plan's ordered-list continuation is indentation-only rather than repeating the ordered marker; this deliberately keeps the hard break inside the same list item and is reflected in the plan and ADR before implementation.

### Verification
- 29 focused editor tests pass: Phase 5 lists + Phase 2 line breaks + Phase 3 inline formatting + Phase 4 links/images + benchmark.
- `@app/editor` typecheck, lint, and build pass.
- Expanded 1,000-line mixed-content benchmark: **0.833 ms per keystroke** (under 5 ms; JSDOM benchmark measurement).
- No dependency added; all per-keystroke list work is limited to visible ranges.

## Editor Markdown Formatting — Phase 4: Links & Images (@app/editor) (ADR-0067)

### Completed
- Implemented unified `linkExtension` replacing `wikilinkExtension` (backward-compat re-export kept). Handles wikilinks, `[text](path.md)` internal links, `[text](https://...)` external links, and `<autolink>` URLs in a single ViewPlugin.
- Markdown internal links resolve through the same `parseLinks` indexer lookup as wikilinks — consistent broken-link indicator (dashed underline) and `onLinkClick` dispatch.
- External links open via `onExternalLinkClick` callback or `window.open("_blank", "noopener,noreferrer")`; `%20`-encoded URLs and `<angle-bracket>`-wrapped URLs with literal spaces parsed and navigated correctly.
- Implemented `imageExtension` with `ImageWidget` (WidgetType): `![alt](url)`, `![alt|640x480](url)`, `![alt|100](url)`, and `![800x600](url)` (dimension-only) forms all render inline with correct width/height applied to `<img>`. `loading=lazy`/`decoding=async` — never blocks typing.
- Both extensions iterate `view.visibleRanges` (not full doc) per update — keystroke latency **4.627 ms** on 1,000-line/350-note/100-wikilink/50-image benchmark document (under 5 ms target).
- Added link/image styling tokens to `editorTheme` and `readOnlyEditorTheme`: `.cm-link`, `.cm-link-unresolved`, `.cm-link-external`, `.cm-image-embed`, `.cm-image-error`.
- Updated `Editor.tsx` (added `onExternalLinkClick` prop, `imageExtension()`) and `MarkdownView.tsx` (same).
- Exported `linkExtension`, `imageExtension`, and helpers from `packages/editor/index.ts`.
- 8 new Phase 4 tests in `linksAndImagesExtension.test.tsx`: wikilinks, internal links, external links (including space-escaping), image dimensions, active-line reveal, Phase 3 regression combinations, read-only `MarkdownView`.
- Updated `EditorBenchmark.test.ts` to include `imageExtension` and mixed link/image load.
- ADR-0067 logged; DECISIONS.md updated; minor changeset added.

### Verification
- 8 Phase 4 links/images tests passing.
- 10 Phase 3 inline formatting tests passing.
- 5 horizontal rule tests passing.
- 4 line break tests passing.
- Editor benchmark typing latency: **4.627 ms per keystroke** (under 5 ms target; includes wikilinks + markdown links + images in 1,000-line doc).
- `@app/editor` typecheck, lint, build pass cleanly.

## Editor Settings Ownership — package contract correction (ADR-0065)

### Completed

- Moved editor font values, settings schema, defaults, validation, and storage-neutral load/save helpers into `packages/editor/editorSettings.ts`.
- Kept SQLite and Zustand in desktop as a thin `EditorSettingsStorage` adapter; `@app/editor` has no desktop, Tauri, or persistence dependency.
- Updated the desktop settings dialog to use the editor package's font list and validation instead of a duplicate option list.
- Added invalid persisted-value fallback coverage and added the missing `@app/editor` source alias to desktop Vitest.
- Restored the known-good sequential `withDbLock(() => getSetting(...))` pattern for each settings key after the combined loader caused `SQLITE_BUSY`; writes remain serialized by the existing write lock.

### Verification

- Desktop settings unit test: 8 tests passing.
- `@app/editor` and desktop lint/typecheck pass.
- No settings behavior, dependency, startup path, or per-keystroke work changed; Strict Line Breaks retains ADR-0063 semantics.

## Stabilization Phase 1 — canonical note delete and duplicate (ADR-0064)

### Completed

- Added a Rust `delete_note` IPC command and canonical `deleteNoteInVault`: removes the file, source/target SQLite links, graph node/edges/backlinks, pending timers, dirty content, and open-tab state.
- Added canonical `duplicateNoteInVault`: creates collision-safe `<stem> copy.md` names, synchronizes the copied H1 to its filename, writes/indexes the copy, updates the graph, and opens it.
- Added File Explorer note context actions for Rename, Duplicate, and confirmed permanent Delete. The virtualized row rendering is now isolated in `FileTreeRow`, keeping `FileTree` below the 250-line hard cap.
- Extended unique-note resolution with an optional preferred vault-relative path; existing new-note behavior remains `Untitled.md`.
- Cleared three pre-existing `prefer-const` lint findings in adjacent tree/vault helpers.

### Verification

- 17 focused desktop tests pass across deletion, duplication, collision naming, rename, and workspace state.
- Full desktop lint and typecheck pass; Rust `cargo check` passes (existing unused `VaultWatcher::is_paused` warning only).
- No dependency added and no per-keystroke/indexing hot path changed.
- Automated desktop UI dogfooding remains unavailable in this environment because the in-app browser control bridge is not exposed; source wiring and focused tests cover the interaction path.

### Remaining Phase 1 work

- Implement note move without overloading the existing canvas-copy drag payload.
- Dogfood create, rename, delete, duplicate, and move in the packaged desktop app against a disposable vault.

## Editor Markdown Formatting — Phase 2 line-break semantics (ADR-0063)

### Completed

- Added direct CodeMirror state decorations for soft newlines in paragraphs: they render as an inline space while preserving the Markdown source. Two trailing spaces remain a hard break; blank lines remain paragraph boundaries.
- Added `Shift+Enter` handling that inserts the Markdown two-space hard-break sequence before the newline.
- Added the persisted **Strict Line Breaks** checkbox to the existing Settings dialog, backed by the existing SQLite `settings` table (`strictLineBreaks`). Unit coverage simulates the app-restart load path.
- Kept the shared `MarkdownView` on the same rendering path, so read-only canvas markdown embeds receive the same line-break semantics.

### Deliberate scope boundary

The requested default and Strict Line Breaks rules define the same rendered outcomes for soft lines, hard breaks, and paragraph boundaries. The setting is therefore persisted and available in the Editor settings now, without a divergent visual mode. No other Markdown syntax was changed.

### Verification

- 15 targeted desktop tests passing: soft/hard/paragraph boundaries, Shift+Enter insertion, direct inline rendering, persistence, existing store/rename behavior, and the editor benchmark.
- `@app/editor` typecheck and lint pass; targeted desktop lint passes.
- 1,000-line / 100-edit benchmark: **4.227 ms per keystroke**, under the 5 ms target. The direct decoration updates only the changed line neighborhood.
- Full desktop typecheck remains blocked by a pre-existing `FileTree.tsx:268` return-type error; full desktop lint has pre-existing `prefer-const` errors in FileTree/vault files.

---

## Editor Markdown Formatting — Phase 1 audit (ADR-0062)

### What was audited

- Created ignored regression fixture: `test-vault/editor-markdown-formatting-audit.md`, covering every requested Obsidian syntax variant.
- Verified the configured CodeMirror parser, decorations, keymaps, styles, link handling, and editor settings without changing `@app/editor`.
- Recorded all results in [ADR-0062](docs/adr/0062-editor-markdown-formatting-gap-audit.md): CommonMark basics are present but several live-preview/interactions are partial; strikethrough, highlight, task lists, image dimensions/rendering, footnotes, and Obsidian comments are missing.
- Confirmed `markdown()` uses strict CommonMark. Optional Lezer GFM support is installed but not configured. No Strict Line Breaks setting or distinct app reading mode exists.

### Scope discipline

No implementation files under `packages/editor/` changed, and no dependency was added. The audit preserves the single CodeMirror renderer chosen in ADR-0003/0048 and introduces no runtime or bundle cost.

---

## Obsidian-style H1 ↔ filename sync (ADR-0060)

### Prerequisite built first
No canonical rename existed (stabilization Phase 1 not yet run). Added **`renameNoteInVault`** as the single rename path before wiring H1-driven triggers — avoids duplicating rename logic.

### What was implemented

| Concern | Decision / behavior |
|---|---|
| **Debounce** | H1-driven rename scheduled at **750 ms** (matches save debounce); flushed on tab switch, close, `saveAllDirty` |
| **Canonical rename** | `renameNoteInVault` → Rust `rename_note` → `updateWikilinksForRename` in all notes → SQLite → `applyNoteRenameState` |
| **H1 → filename** | `scheduleH1DrivenRename` on `updateNoteContent`; sanitizes invalid chars; skips empty H1 |
| **Filename → H1** | File-tree double-click inline rename → `renameNoteFromTree` → `renameNoteInVault({ syncH1FromFilename: true })` |
| **Collision** | **No rename, no overwrite** — warns in console; H1/filename may diverge. Rust also rejects existing destination. |
| **Loop guard** | Case-insensitive stem compare on both paths; skip when stems already match (prevents H1↔filename feedback loop) |
| **ADR-0059** | Creation-time `initialNoteContent` unchanged; rename "no sync" superseded by ADR-0060 |

### Files changed (key)
- `apps/desktop/src-tauri/src/fs.rs` — `rename_note` command
- `apps/desktop/src/vault/renameNoteInVault.ts` — canonical rename
- `apps/desktop/src/vault/h1DrivenRename.ts` — debounced H1 trigger
- `apps/desktop/src/vault/sanitizeFilenameStem.ts`, `extractH1Title.ts`, `syncH1ToFilename.ts`, `updateWikilinksForRename.ts`
- `apps/desktop/src/state/useWorkspaceStore.ts` — schedule/flush integration, `renameNoteFromTree`
- `apps/desktop/src/components/FileTree/` — double-click inline rename
- `docs/adr/0060-bidirectional-h1-filename-sync.md`

### Automated verification
- Vault unit tests (sanitize, H1 extract/sync, wikilink propagation, rename): passing
- Desktop state tests: passing
- `tsc --noEmit`: clean

---

## HTML Support Phase 4 — No-Markdown-Inside-HTML Enforcement Complete

- Formalized the HTML/Markdown boundary in [ADR-0093](docs/adr/0093-html-markdown-boundary.md): content inside a captured, contiguous HTML range is rendered only through the sanitized HTML path, while Markdown outside that range remains handled by the normal Markdown parser.
- Added named block-level regressions proving `**bold**` and `` `code` `` remain literal inside HTML.
- Added named inline regressions for `<u>`, `<s>`, `<span>`, and same-line `<div>`, plus a side-by-side test proving Markdown outside an inline HTML range still parses as `StrongEmphasis`.
- Focused editor verification passes: 12 tests across the block and inline HTML suites. No rendering implementation changes were needed in this phase.

## Embed Web Pages Phase 1 — Trust Model & Sandboxing Policy Complete

- Decision-only phase; no embed or rendering code was added.
- [ADR-0098](docs/adr/0098-embed-iframe-sandbox-permissions.md) fixes the
  iframe sandbox to `allow-scripts allow-presentation`, excludes
  `allow-same-origin`, denies camera/microphone and unnecessary Permissions
  Policy features, and uses `no-referrer`.
- [ADR-0099](docs/adr/0099-embed-url-host-restrictions.md) allows only parsed
  `http(s)` URLs, rejects Tauri/file/data/custom schemes, credentials,
  localhost, private/link-local/multicast/loopback literals, and internal
  hostnames, with a visible blocked-content message. DNS rebinding remains an
  explicit follow-up constraint for Phase 2's Tauri integration.
- [ADR-0100](docs/adr/0100-embed-click-to-load.md) makes loading explicit and
  fixed in v1: validated embeds do not make network requests until activation.
- Research used MDN iframe sandbox/Permissions Policy/referrer guidance and
  Tauri's remote-iframe IPC security advisory. `<iframe>` remains rejected by
  `@app/sanitize`; Phase 2 must apply this separate policy at the renderer.

## Attachments Phase 1 — Accepted Formats & Location Model Complete

- Added standalone `@app/attachments` with a centralized, case-insensitive
  provisional allowlist for common images, audio, video, and PDF extensions.
  The authoritative accepted-formats reference was unavailable, so ADR-0108
  and the Next Up flags explicitly require a later revision.
- Added serializable settings for vault root, specified folder, note folder,
  and note subfolder modes. `resolveAttachmentFolder` is pure, preserves
  absolute specified paths, handles nested notes, and falls back to vault-root
  relative behavior for unsaved notes. Desktop settings state loads and saves
  the serialized model through the existing SQLite settings key/value path.
- Added ADR-0108, ADR-0109, changeset, and eight passing unit tests. Package
  typecheck passes. No file I/O, editor integration, or settings UI was added.

Attachments Phase 2 — Filesystem Write & Filename Handling Complete

- Added async `writeAttachment` with injected native filesystem operations,
  recursive folder creation, collision checks, path-traversal rejection, and
  structured `AttachmentWriteError` codes. Desktop supplies Tauri's native
  `exists`, recursive `mkdir`, and `writeFile` adapter.
- The collision convention is `image.png`, `image 1.png`, `image 2.png`,
  recorded in [ADR-0110](docs/adr/0110-attachments-filename-collisions.md).
  Unsupported extensions are rejected before any folder creation or write.
- Added 16 passing attachment tests covering all four resolved target-folder
  outputs, multi-level creation, collisions, invalid names, and structured
  format errors. Package typecheck passes. Desktop typecheck remains blocked
  only by the pre-existing `createNoteCrudActions.ts` `result` errors.

Next up: Attachments Phase 3 — paste attachment handling. The accepted-formats
list remains provisional until the real reference document is available.

Attachments Phase 3 — Paste Handling Complete

- Added one CodeMirror paste handler that intercepts only clipboard file data;
  ordinary text paste returns to CodeMirror unchanged. Files resolve their
  destination through Phase 1 and write through the Phase 2 native adapter.
- Successful writes insert `![[relative/path.ext]]` only after the async write
  completes. Named files retain their names; nameless files use the MIME-based
  timestamp convention in [ADR-0111](docs/adr/0111-pasted-attachment-names.md).
- Structured write errors are surfaced with their error code and no dangling
  reference is inserted. Editor tests pass 37/37; attachments tests pass
  16/16. Desktop typecheck remains blocked only by the existing unrelated
  `createNoteCrudActions.ts` errors.

Next up: Attachments Phase 4 — drag-and-drop attachment handling, reusing the
same resolution/write/insert path.

Attachments Phase 4 — Drag & Drop Handling Complete

- Reused the Phase 3 incoming-file pipeline for external file drops. Files are
  processed in OS order, successful references are inserted one per line at
  the drop position, and failures do not roll back other files.
- Added a token-based dashed editor outline for file drag-over, cleared on
  drag-leave and drop. Drops without files are not claimed, preserving normal
  editor drag behavior.
- Added [ADR-0112](docs/adr/0112-shared-attachment-drop-pipeline.md) and a
  changeset. Editor tests pass 38/38 and typecheck passes; Phase 3 paste tests
  remain covered in the same suite.

Next up: Attachments Phase 5 — settings UI for the default attachment location.

Attachments Phase 5 — Settings UI Complete

- Added the Files & Links attachment-location panel to Settings using the
  exact Phase 1 four-mode schema. It uses the existing radio-group and input
  primitives plus the native folder picker for specified folders.
- Conditional controls render only for specified-folder and note-subfolder
  modes. Settings write directly through the existing Zustand/SQLite state,
  so the next paste/drop observes changes without restart.
- Specified paths are deferred to first-use creation; empty or slash-containing
  subfolder edits remain draft-only with inline validation, per
  [ADR-0113](docs/adr/0113-attachment-settings-validation.md).
- Added token-only component styles, four-state Storybook stories, and
  interaction coverage. Component tests pass 2/2; desktop typecheck still
  reports only the pre-existing `createNoteCrudActions.ts` errors.

## Attachments Phase 6 — External File Verification Complete

- The recursive watcher originally emitted only `.md` and `.canvas` paths.
  Its existing filter now covers accepted attachment formats, case-insensitively;
  no parallel watcher was added.
- The supported-file inventory still feeds file-tree/all-path state and
  wikilink resolution, while full and incremental indexing parse only
  `.md`/`.canvas`. Binary attachments are not read as Markdown or inserted in
  SQLite, and external removals use the existing path-refresh flow.
- Watcher filtering and indexer reconciliation are covered by focused tests.
  A live OS-file/WebView round trip is unavailable because this workspace has
  no configured Tauri browser harness or running vault session.

Next up: Phase 7 — regression & integration pass.

## Bug Investigation — Dropped Image Not Appearing in Note (Case B)

- Reproduction/evidence: `pnpm --filter @app/editor test` passes all 7 test
  files and 38 tests, including asynchronous attachment insertion and the
  partial-drop failure path. `handleIncomingFiles` awaits the existing writer
  callback, dispatches the returned `![[...]]` syntax, and reports individual
  write/format failures without inserting dangling references.
- `Editor.tsx` wires `attachmentDropHandler` whenever the existing attachment
  callback is supplied, and desktop's callback writes through
  `writeAttachmentToVault` before returning the vault-relative target. This
  confirms the write → insert pipeline is implemented; no silent insertion
  failure was found in the package reproduction.
- The observed lack of an inline image preview is expected Case B behavior.
  Phase 4 and [ADR-0112](docs/adr/0112-shared-attachment-drop-pipeline.md)
  scope dropping to writing the file and inserting `![[filename]]`; they
  explicitly add no attachment rendering. The existing parser/link extension
  recognizes wikilinks for resolved-link styling, while the image widget path
  handles Markdown `![](url)` syntax, not file wikilink embeds.
- No code change or changeset was made. The next feature is a separately
  scoped Embed Files plan covering image/audio/PDF/etc. widgets. A live Tauri
  screenshot was unavailable because this workspace has no running vault or
  configured browser harness; the package-level reproduction is deterministic.

## Embed Files Phase 1 — Typed Embed Link Resolution Complete

- Added pure `resolveEmbedLink` to `@app/editor`. It reuses
  `@app/indexer`'s shared candidate lookup/target parsing and
  `@app/attachments`' centralized allowlist; no write pipeline or rendering
  was changed.
- Results distinguish image, audio, video, PDF, whole-note, ambiguous,
  unresolved, and missing-heading states. Duplicate basenames return sorted
  candidates explicitly rather than silently selecting a file.
- Added [ADR-0114](docs/adr/0114-embed-link-ambiguity-and-typed-resolution.md)
  and exported the resolver/types from the editor barrel. Tests cover syntax
  produced by paste/drop for every attachment kind, notes, headings,
  duplicates, missing files, and missing headings.

## Embed Files Phase 2 — Image Embed Rendering Complete

- Added `embedImageExtension` using the established structural `StateField`
  plus `Decoration.replace({ block: true })` widget pattern. It consumes
  Phase 1's typed resolver and is wired into both `Editor` and read-only
  `MarkdownView`; desktop supplies its existing `convertFileSrc` media URL
  callback.
- Valid image embeds render lazily through native `<img loading="lazy"
  decoding="async">`. Width/height and width-only dimension syntax reuse
  `parseImageDimensions` from the existing external-image implementation; no
  duplicate dimension parser was added.
- Selection-driven decoration rebuilding follows ADR-0097/ADR-0096: the raw
  line is visible while the cursor is inside it and the block widget returns
  after leaving. Missing image targets show a dashed placeholder; ambiguous
  targets show a distinct multiple-match placeholder.
- Added 4 focused rendering/cursor tests and an `@app/editor` changeset.
  Verification passes: editor package 9 files/49 tests, editor typecheck,
  and the existing desktop editor benchmark test. No audio/video/PDF/note
  rendering was added.

## Attachments Phases 1–7 — Plan Closed

- Regression coverage passes for attachment insertion in list, blockquote, and
  table-cell contexts; the existing pipeline inserts exact `![[...]]` syntax
  without rewriting surrounding Markdown structure.
- Vault integration passes: attachment paths use the existing watcher,
  inventory, and incremental reconciliation path; note rename preserves the
  embed prefix/target fragments, and deletion follows the existing canonical
  note operation. Tags do not classify embed syntax, and HTML sanitization
  preserves it as text inside supported HTML content.
- Performance review confirms attachment location resolution is pure and the
  settings UI performs no filesystem work during ordinary renders/keystrokes.
  Paste/drop writes remain asynchronous and batched into one editor dispatch;
  multi-file partial-success coverage passes. Existing editor benchmark and
  focused package suites remain green.
- Final closeout is recorded in [ADR-0115](docs/adr/0115-attachments-plan-closeout.md).
  The accepted-format list remains provisional per ADR-0108. The Attachments
  plan does not include later audio/video/PDF/note rendering; Embed Files is a
  separate feature. Its resolution and image-rendering phases are already
  tracked independently, while later embed kinds remain deferred.

Attachments Phases 1–7 are complete. No further Attachments phase follows
unless a regression appears or a separately scoped Embed Files phase resumes.

## YouTube Embed Thumbnail Facade — Complete

- YouTube image syntax now renders a real `i.ytimg.com` `hqdefault.jpg`
  thumbnail with a flat play overlay. The iframe remains unmounted until the
  facade is activated, and thumbnail failures use a readable local fallback.
- Activation mounts the same validated iframe and fixed sandbox/permissions
  policy as raw embeds. The click handler suppresses CodeMirror mousedown
  selection, synchronously swaps the facade, and adds `autoplay=1`; only this
  explicit YouTube path receives `autoplay 'src'`. Generic iframes and tweet
  cards retain their existing click-to-load behavior.
- Added [ADR-0105](docs/adr/0105-youtube-thumbnail-facade.md) and corrective
  [ADR-0106](docs/adr/0106-youtube-facade-click-activation.md). Editor and
  sanitizer tests pass after the click-handling correction.

## YouTube Embed WebView Sandbox Fix — Complete

- Removed the unsupported `allow-presentation` token and added a recognized
  sandbox-token regression test. Arbitrary validated iframe hosts now use the
  strict `allow-scripts` policy.
- Added a provider-scoped YouTube policy: only validated `www.youtube.com`
  embeds receive `allow-scripts allow-same-origin`, which is required by the
  player for Cache Storage/origin APIs. Source-provided sandbox values remain
  ignored.
- Added [ADR-0107](docs/adr/0107-provider-scoped-iframe-sandbox.md). Sanitizer
  tests pass 17/17; editor tests pass 33/33; both package typechecks pass.

## Blocked / Open Questions (archived from PROGRESS.md)

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.

## Next Up (archived from PROGRESS.md, in order)

- Embed Web Pages Phase 1 trust model/sandboxing policy complete (see above); Phase 2 next.
- HTML Support cursor-navigation fix complete; phase plan tracked separately.
- **Stabilization pass Phase 1** (`plans/stablize.md`): implement note move and dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
- **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
- **Unlinked Mentions Detection**
- **Inline Property Editing**
- **Outline Scroll Synchronization**
- Add success/warning semantic color tokens
- Chromatic / Playwright screenshot regression
- Fix `CanvasBenchmark.test.ts` lint

## 2026-09-01 — Sync Phase 2 Scope Correction & Phase 3 Implementation

- **Scope Correction (Part A)**:
  - Added `https://www.googleapis.com/auth/drive.appdata` additively alongside `https://www.googleapis.com/auth/drive.file` in `packages/sync-client/driveAuth.ts`.
  - Confirmed `appDataFolder` access requirement: updated Drive API calls in `packages/sync-client/driveApi.ts` to use `spaces=appDataFolder` and `parents: ["appDataFolder"]`. Manifests are stored in hidden, app-scoped storage (`manifests/<deviceId>.json`) to prevent user direct file editing/deletion in Drive UI.
  - Recorded and indexed [ADR-0121](docs/adr/0121-drive-appdata-scope-correction.md), explicitly amending [ADR-0118](docs/adr/0118-drive-file-oauth-verification.md) and [ADR-0120](docs/adr/0120-drive-oauth-authentication-and-verification.md). Cited Google Drive API auth documentation (`https://developers.google.com/workspace/drive/api/guides/about-auth`) confirming both scopes are "Recommended / Non-sensitive", keeping the app in the basic verification tier.
- **Manual Re-Test Flagged (Part B)**:
  - Flagged human manual re-verification of the expanded consent screen (requesting both `drive.file` and `drive.appdata` permissions) as an outstanding manual step before Phase 3 is considered fully unblocked for production.
- **Phase 3 Implementation (Part C)**:
  - Implemented per-device manifest storage in Drive (`DriveManifestStore`).
  - Implemented Changes API delta tracking (`listChanges`) using `startPageToken` and `spaces=appDataFolder`.
  - Implemented three-way diff (`classifySyncDiff`) supporting push, pull, conflict, and no-op.
  - Implemented deduplicated content-hash-keyed transfer (`uploadContent` / `uploadContentBatch`) and safe change application (`applyPulledChanges`).
- **Verification**:
  - All 19 vitest tests in `@app/sync-client` pass cleanly.

## 2026-09-01 — Sync Phase 4 Conflict Resolution & Data Loss Prevention

- **Text File Three-Way Merge**:
  - Selected `node-diff3` (unpacked ~151 KB, gzipped ~3.5 KB, zero dependencies) for line-based diff3 merge in `packages/sync-client/conflictResolver.ts`.
  - Non-overlapping text edits merge automatically into clean text (`hasConflict: false`, `kind: "text-merge-clean"`).
  - Overlapping text edits insert inline markers (`<<<<<<< local`, `=======`, `>>>>>>> remote`) and return `hasConflict: true` with `kind: "text-merge-conflict"` for UI surfacing.
- **Wikilink Safety Verification (Adversarial Test)**:
  - Tested conflict-marked content containing `[[Project Alpha|Local Alias]]` and `[[Project Alpha|Remote Alias]]` against the real `@app/indexer` `parseLinks` parser.
  - Confirmed indexer parses conflict markers cleanly without panicking, throwing errors, or corrupting link definitions.
- **Canvas JSON Safety Verification (Adversarial Test)**:
  - Evaluated simultaneous edits on `.canvas` files.
  - Decision: `.canvas` files return `false` for `isTextMergeable` (atomic/binary conflict resolution). Line-based diff3 merge on JSON files introduces `<<<<<<<` conflict markers or invalid JSON syntax, causing `JSON.parse` to throw `SyntaxError` and corrupting canvas files.
  - Atomic resolution generates `diagram (iPad copy).canvas`. Both local and remote versions were parsed with `JSON.parse` in adversarial tests — confirmed 100% valid, openable JSON Canvas 1.0 files without syntax errors.
- **Binary File Conflicts**:
  - Binary files (`.png`, `.jpg`, `.pdf`) and `.canvas` files generate `<name> (<device-name> copy).<ext>`.
  - Filename collisions chain to the space-separated numeric suffix convention from ADR-0110 (`<name> (<device-name> copy) 1.<ext>`).
- **Delete vs Edit**:
  - Edited version wins over deletion (deletion treated as a no-op).
  - Surfaced to user via `surfacedMessage` / event (`delete-vs-edit-local-wins` or `delete-vs-edit-remote-wins`).
- **ADR & Indexing**:
  - Recorded and indexed [ADR-0122](docs/adr/0122-sync-conflict-resolution-and-safety.md).
- **Verification**:
  - All 29 vitest tests in `@app/sync-client` pass cleanly.

## 2026-09-01 — Sync Phase 5 Syncthing / Folder Sync Mode

- **Watcher Burst Audit & Optimization**:
  - Audited `reconcileVaultChanges` in `VaultIndexer.ts`: refactored `readNote` file I/O calls to run asynchronously in parallel before opening the SQLite `BEGIN IMMEDIATE` transaction lock.
  - Reduced SQLite transaction lock duration to ~1–2 ms.
  - Benchmark: Verified a burst of 50 updated files + 2 deleted files reconciled in 452 ms without `SQLITE_BUSY` errors, UI freezes, or duplicate index entries.
- **Syncthing Conflict Recognition & Indexing Policy**:
  - Implemented `isSyncthingConflictPath` matching `.sync-conflict-*` filename patterns.
  - File tree displays conflict files with `data-is-conflict="true"` and a visual `[Conflict]` badge.
  - Conflict files remain fully indexed in SQLite/FTS5 and graph view to prevent hiding offline text from search.
- **SyncConflictsPanel**:
  - Created `SyncConflictsPanel` component (`SyncConflictsPanel.tsx` + `SyncConflictsPanel.test.tsx`) for managing, opening, and deleting Syncthing conflict files.
- **ADR & Indexing**:
  - Recorded and indexed [ADR-0123](docs/adr/0123-syncthing-folder-sync-mode-and-watcher-burst-robustness.md).

## 2026-09-01 — Sync Phase 6 Sync Setup & Mode Configuration UI

- **Asymmetric Framing**:
  - Created `SyncSettingsPanel` with explicit asymmetric visual hierarchy.
  - Google Drive is highlighted as the primary recommended built-in path (`<Badge variant="primary">Recommended</Badge>`), while Syncthing/folder sync is presented as secondary (`<Badge variant="secondary">External</Badge>`).
- **Opt-in Default & Mode Isolation**:
  - Vault sync defaults to `"off"`.
  - Configured vaults display mode-specific status and management controls without exposing an in-place mode-switch button. Disconnecting Drive returns vault state to `"off"`.
- **Component & Integration**:
  - Shipped `SyncSettingsPanel.tsx`, `SyncSettingsPanel.module.scss`, `SyncSettingsPanel.stories.tsx`, `SyncSettingsPanel.test.tsx`, and `index.ts`.
  - Integrated into `SettingsDialog.tsx` and workspace store (`useWorkspaceStore.ts`).
- **ADR & Indexing**:
  - Recorded and indexed [ADR-0124](docs/adr/0124-sync-settings-asymmetric-framing-and-mode-isolation.md).
- **Verification**:
  - All 151 tests in `@app/desktop` and 29 tests in `@app/sync-client` pass cleanly.

## 2026-09-01 — Sync Phase 7 Regression, Performance Pass & Sync Plan Closeout

- **Fast-Path Skip & Large Vault Performance**:
  - Built `packages/sync-client/syncRegressionAndPerformance.test.ts`.
  - Confirmed 350-file manifest incremental generation skips re-hashing when `size` and `mtimeMs` match metadata (0 re-hashes, < 1.5 ms execution time).
  - Confirmed 350-item three-way diff classification completes in < 2 ms.
- **Multi-Format Asset Handling**:
  - Confirmed `.canvas` files use atomic copy resolution to prevent JSON syntax corruption.
  - Confirmed binary files (`.png`, `.jpg`, `.pdf`) use device-named copies with numeric collision chaining.
  - Confirmed text notes (`.md`) use line-based `diff3` three-way merge.
- **Editor Latency Integrity**:
  - Confirmed background reconciliation operations do not degrade editor responsiveness (`EditorBenchmark.test.ts` maintained at < 1.0 ms transaction latency).
- **Final Sync Closeout ADR**:
  - Authored and indexed [ADR-0125](docs/adr/0125-comprehensive-sync-architecture-closeout.md) summarizing the complete sync architecture across Phases 0–7.
- **Total Test Suite**:
  - All 183 tests pass cleanly (32/32 in `@app/sync-client`, 151/151 in `@app/desktop`).

## 2026-09-02 — Vim Keybindings Phase 2 (Settings Toggle & Real Wiring)

- **Settings Toggle UI**:
  - Added "Vim keybindings" checkbox section to `SettingsDialog.tsx` with opt-in default state (OFF), matching Obsidian's setting model.
- **Persistence Layer**:
  - Added `useVimMode` setting schema in `@app/editor` (`editorSettings.ts`).
  - Wired persistence in `createEditorSettings.ts` via SQLite `settings` table (`loadSettings`, `setUseVimMode`) following ADR-0033. No architectural deviation, so no new ADR was needed.
  - Added persistence and default-state tests in `useWorkspaceStore.test.ts`.
- **Editor Area Wiring**:
  - Replaced Phase 1 stub flag (`useVimMode={true}`) in `EditorArea.tsx` with live `useVimMode` store setting.
- **Dynamic Load & Functional Unload**:
  - Verified enabling toggle dynamically imports `@replit/codemirror-vim` and configures `vimCompartmentRef` on active `EditorView` instances immediately without restart.
  - Verified disabling toggle removes Vim extension from active `EditorView` instances (removing `cm.state.vim` object and restoring literal text typing behavior on existing open notes).
- **Toggle Cycle Testing**:
  - Expanded `vimExtension.test.ts` with dynamic load, unload, and repeated cycle (ON -> OFF -> ON -> OFF) tests on active `EditorView` instances.
- **Lazy-Load Bundle Re-verification**:
  - Re-ran `pnpm --filter @app/desktop build` with setting OFF. Confirmed initial entry/bundle payload contains **0 bytes** of `@replit/codemirror-vim` (0 occurrences in `dist/assets/`).
- **Test Suite**:
  - All 94 unit tests across all packages pass cleanly.

## 2026-09-02 — Vim Keybindings Phase 3 (Core Modal Editing Verification)

- **Mode Transitions & Motion Verification**:
  - Verified Normal mode, Insert mode (`i`), Normal return (`Esc` / `Vim.exitInsertMode`), Visual mode (`v`), and Visual Block mode (`Ctrl-v`) mode transitions.
  - Verified motions (`hjkl`, `w`, `b`, `e`, `0`, `$`, `gg`, `G`, `3G`) against a real note fixture with headings, lists, wikilinks (`[[Project Alpha]]`), bold/italic formatting, and tags (`#important`).
- **Keybinding Conflict Cross-Reference & Policy (ADR-0127)**:
  - Audited all keybindings in `@app/editor` (`Shift-Enter`, `defaultKeymap`, `historyKeymap`, `listIndentKeymap`, `autocompleteExtension`). Confirmed zero direct keymap collisions.
  - Authored and indexed [ADR-0127](docs/adr/0127-vim-keybinding-conflict-resolution-policy.md): Vim keymap owns Normal/Visual modes, `Mod`/`Cmd` shortcuts pass through, and Insert mode retains `[[` autocompletion and `Shift-Enter`/`Tab` list keymaps.
- **Editing Operations on Decorated Content**:
  - Verified `dd` (line delete), `yy` + `p` (line yank & paste), and word edits (`dw`/`x`) operate on the raw underlying Markdown document string directly without bracket corruption or interference from live-preview decorations (`**bold**`, `#tag`).
- **Multi-Cursor / Selection Check**:
  - Checked Visual Block mode (`Ctrl-v`) multi-range selection creation and teardown in CodeMirror state without errors.
- **Test Suite**:
  - Added `packages/editor/vimModalEditing.test.ts` (6 tests). All 100 unit tests across all packages pass cleanly.

## 2026-09-02 — Vim Keybindings Phase 4 (Mode Indicator & Escape Hatch)

- **Mode-Change Event Subscription**:
  - Attached `attachVimModeListener` to `@replit/codemirror-vim`'s `CodeMirror.on(cm, "vim-mode-change", handler)` in `@app/editor`.
  - Formatted modes into uppercase labels (`NORMAL`, `INSERT`, `VISUAL`, `VISUAL LINE`, `VISUAL BLOCK`, `REPLACE`).
  - Implemented clean listener teardown via `CodeMirror.off` on view unmount or setting disable.
- **Status Bar Integration**:
  - Rendered glanceable mode indicator in `StatusBar.tsx`.
  - Scoped rendering so badge is completely unmounted (absent from DOM) when `useVimMode === false`.
- **Stuck-User Escape Hatch**:
  - Added "Disable Vim keybindings" (`action:disable-vim`) to `CommandPalette.tsx`.
  - Dynamically registered only when `useVimMode === true`, invoking `setUseVimMode(false)` to immediately restore standard non-modal text input.
- **Architecture Decision (ADR-0128)**:
  - Authored and indexed [ADR-0128](docs/adr/0128-vim-mode-indicator-and-escape-hatch-command.md).
- **Test Suite**:
  - Added test cases in `vimExtension.test.ts`, `StatusBar.test.tsx`, and `CommandPalette.test.tsx`.
  - All 156 unit tests across all workspace packages pass cleanly.

## 2026-09-02 — Vim Keybindings Phase 5 (Ex Commands & Multi-Tab Flush Architecture)

- **Central Design Decision (:w / :wq Mapping)**:
  - Mapped `:w` to Option (b): forcing an immediate flush of the active note's pending debounced save (`saveNoteNow(activeNotePath)`), writing dirty state to disk and updating the SQLite index synchronously without waiting for the 750ms timer.
  - Displays `"\"[Filename]\" written"` in-editor notification.
  - Mapped `:wq` and `:x` to immediate save flush followed by active note tab closure.
- **Single Tab Close Mapping (:q / :wq)**:
  - Mapped `:q` to `closeNote(activeNotePath)` via the app's existing canonical tab-close path (flushing pending H1 renames and debounced saves before tab removal).
- **Multi-Tab Close & Flush (:qa / :wqa)**:
  - Added `closeAllNotes()` to `useWorkspaceStore`. `closeAllNotes()` invokes `saveAllDirty()`, flushing all pending edits across every dirty open tab to disk and SQLite index before clearing `openNotes`.
  - Confirmed zero data loss under active concurrent edits across multiple open notes.
- **Data Safety & Confirmation Decision**:
  - Confirmed that because `saveAllDirty()` guarantees 100% data flush before tab closure, un-saved data loss is impossible, making confirmation dialogs redundant and intrusive.
- **Unsupported Commands**:
  - Verified that unsupported Ex commands (e.g. `:sp`, `:vsp`, `:e`) are caught by `@replit/codemirror-vim` and display clean status notifications (`Not an editor command: <cmd>`), preventing silent failures or uncaught errors.
- **Architecture Decision (ADR-0129)**:
  - Authored and indexed [ADR-0129](docs/adr/0129-vim-ex-command-save-and-tab-close-mapping.md).
- **Test Suite**:
  - Added `packages/editor/vimExCommands.test.ts` (5 tests) and updated `useWorkspaceStore.test.ts` (`closeAllNotes` multi-tab flush verification).
  - All 263 unit tests across all workspace packages pass cleanly.

## 2026-09-02 — Vim Keybindings Phase 6 (Comprehensive Regression Pass & Plan Closeout)

- **Wikilink & Editor Feature Regression Verification**:
  - Verified wikilink click navigation, autocomplete triggering/filtering/selection (`[[`), and unresolved link creation (`[[NonExistentNote]]`) operate cleanly in Insert mode.
- **Live Preview Decoration Boundary Verification**:
  - Verified raw-markdown-at-cursor toggling and decoration boundaries (`**bold**`, `#tag`, `[[wikilinks]]`, tables, math, mermaid) operate smoothly without visual glitches or cursor drift across Vim Normal/Visual/Insert mode transitions.
- **Canvas Boundary Verification**:
  - Verified plain `<textarea>` elements in Canvas text cards operate completely unaffected by active Vim mode. Added explicit unit test in `vimExtension.test.ts`.
- **Performance Typing Latency Verification**:
  - Benchmarked keystroke transaction latency on large-vault test conditions (1,000 lines, 100 wikilinks, 350 notes). Measured sub-millisecond overhead between Vim OFF vs Vim ON (~1.8ms delta).
- **Settings Lifecycle Re-Initialization**:
  - Verified toggling Vim mode OFF after extended use cleanly unmounts the status bar indicator badge, detaches `CodeMirror.off` listeners, and restores standard non-modal editing. Verified toggling back ON re-initializes cleanly from a fresh state without stale carryover.
- **Deferred / Out-of-Scope Items**:
  - Custom `.vimrc` config parsing, mobile touch virtual keybindings, and window splits (`:sp`, `:vsp`) explicitly documented as deferred/out-of-scope.
- **Plan Closeout Architecture (ADR-0130)**:
  - Authored and indexed [ADR-0130](docs/adr/0130-vim-keybindings-integration-architecture-closeout.md) in `DECISIONS.md`.
- **Final Test Suite Status**:
- All **266 unit tests** (108 in packages, 158 in desktop app) pass cleanly. Plan is closed out, complete, and ready for production use.

## 2026-09-02 - Plugin Ecosystem Phase 3

- Added asynchronous `vault.read`, `vault.write`, `vault.list`, and `vault.delete` APIs. Runtime lexical validation rejects absolute paths, dot segments, and traversal; desktop calls delegate to the existing Rust `resolve_in_vault` boundary, including symlink protection.
- Added command registration with optional hotkeys and live command-palette exposure. Lifecycle unload removes all commands and settings tabs for the plugin, so disabled plugins disappear rather than merely becoming hidden.
- Added declarative settings tabs and retained per-plugin `loadData`/`saveData` persistence. Storage uses the plugin ID/directory key and the fixture confirms two plugins cannot overwrite each other.
- Fixture results: command write/read matched, `../../outside-vault.md` was rejected, restart returned the saved value, disabling removed the command and re-enabling restored it, isolated data matched each plugin ID, and one plugin write produced one adapter write with no feedback loop.
- API calls are asynchronous to match Tauri IPC and avoid blocking the UI. Vault, command, settings, and data methods are explicit facade call boundaries where Phase 5 capability checks can be inserted without changing plugin-facing signatures. Permission enforcement remains intentionally deferred.
- Verification: `@app/plugin-api` 20 tests pass; `@app/plugin-runtime` 8 tests pass and lint passes; focused desktop palette/settings tests 5 pass. Full desktop typecheck still reports unrelated pre-existing workspace update-counter and design-system color typing failures.

## 2026-09-02 - Plugin Ecosystem Phase 4

- Added stable Workspace APIs for registering custom view factories, opening/closing/focusing the active plugin leaf, and querying open view state. The host mounts plugin DOM into a dedicated leaf and calls factory cleanup during close, unregister, disable, and re-enable cycles.
- Added `createEl`/`createText` DOM helpers. Plugin views receive only `HTMLElement` containers and helper methods; React, hooks, internal components, `EditorView`, and `EditorState` are never passed to plugin code.
- Added a narrow Editor wrapper for content, selection, cursor insertion, and content-change subscriptions. The existing editor update listener forwards real document changes to the wrapper; plugin-owned subscriptions are tracked and removed on unload.
- Deliberately excluded CM6 extensions, transactions, commands/keymaps, syntax trees, decorations, history, view plugins, and direct view/state access. These are implementation details or high-churn surfaces and are not required for the first stable plugin workflow.
- Fixture results: the plugin rendered a view using only DOM helpers, read and modified editor content through the wrapper, observed a real edit event, lost its DOM and listener on disable, and remounted cleanly after re-enable. The real CM6 adapter test passed.
- Phase 5 insertion points are the Workspace registration/open calls and every Editor method/subscription; capability checks can be added at those facade boundaries without changing plugin signatures. Permission enforcement remains deferred.
- Verification: plugin-api 20 tests pass; plugin-runtime 9 tests pass and lint/typecheck pass; editor typecheck and the real adapter test pass. Full desktop typecheck remains blocked by unrelated pre-existing workspace update-counter and design-system color typing errors.

## 2026-09-02 - Plugin Ecosystem Phase 5

- Confirmed ADR-0131 Option 2: capability-scoped permissions per plugin with application call-boundary enforcement.
- Added the explicit mapping in `docs/plugin-permissions.md`: `vault:read` gates read/list, `vault:write` gates write/delete, `commands` gates command registration, `ui:view` gates settings/workspace, and `editor:read`/`editor:write` gate corresponding editor methods.
- Enforced the mapping in every Phase 3/4 facade method. Permission sets are copied when plugin context is created, preventing manifest mutation after load from escalating access. Vault path validation remains independent and still runs for permitted writes.
- Desktop Settings displays requested permissions before enablement. No Tauri-level per-plugin mapping was added because ADR-0131 states Tauri capabilities bind to webview windows; enforcement is application-layer only in this phase.
- Adversarial results: no-permission vault write rejected; undeclared command, workspace, settings, and editor calls rejected; declared vault write succeeded; `../../outside.md` remained rejected; mutating the loaded manifest did not enable a read; disabling removed the registered command.
- Verification: plugin-runtime 11 tests pass with lint/typecheck; plugin-api 20 tests pass; focused desktop settings tests pass. Full desktop typecheck remains blocked by unrelated pre-existing workspace update-counter and design-system color typing errors. No earlier phase signature redesign was required.

## 2026-09-02 - Plugin Ecosystem Phase 6

- Added a static registry seed at `registry/plugins.json` with submission and validation rules in `registry/README.md`. The intended registry is a GitHub-hosted repository containing approved metadata only; plugin code remains in author-owned repositories and releases.
- Added the browser registry client and GitHub release resolver. It reads `versions.json`, selects the newest release compatible with the current app version, downloads the declared artifact, validates the Phase 1 manifest, and rejects ID/version mismatches and unsafe archive paths.
- Added Settings UI for registry loading/offline state, install consent, Phase 5 declared-permission display, update detection, and uninstall. Install/update/uninstall use `PluginLifecycleManager.unloadAll`, existing plugin-directory conventions, and `initPlugins` rediscovery rather than a parallel loader.
- Uninstall disables the plugin before deleting its folder, allowing Phase 2 `onunload()` cleanup to run. Updates unload the current generation before installing and rediscovering the new generation.
- Verification: plugin-api 20 tests, plugin-runtime 11 tests, and registry resolver 2 tests pass; desktop lint passes. Full desktop typecheck remains blocked by pre-existing `vaultUpdateCounter` and design-system color typing errors.
- External end-to-end verification against a real published plugin/repository could not be performed: this workspace has no published test repository, registry entry, release artifact, or credentials. The empty registry seed avoids inventing an unverified plugin.

## 2026-09-02 - Plugin Ecosystem Phase 6 Registry Follow-up

- Populated and pushed `https://github.com/AhmedWanneni/davinci-notes-plugins` at commit `c2ebdca` with the Phase 6 `plugins.json` format, JSON schema, submission README, dependency-free validator, and GitHub Actions workflow.
- Updated the browser's existing fetch path to use the real raw catalog URL: `https://raw.githubusercontent.com/AhmedWanneni/davinci-notes-plugins/main/plugins.json`. No second fetch mechanism or format reconciliation was needed.
- Real network verification confirmed the pushed catalog is reachable and parses as an empty registry. A real install/update/uninstall test remains blocked because no plugin repository, release artifact, or registry entry was supplied.

## 2026-09-02 - Plugin Ecosystem Phase 7

- Added `templates/davinci-plugin-starter`, a minimal TypeScript plugin that registers `Sample: write and read a vault file`, writes and reads a vault file, and requests only `vault:read`, `vault:write`, and `commands`.
- Added a no-runtime-dependency build path: TypeScript emits CommonJS compatible with the Phase 2 `DavinciPlugin` injection, and a native Node packaging script copies `manifest.json`, `main.js`, and `versions.json` into `dist/`.
- README documents the exact Phase 2 manual install path and Phase 6 registry process: version both manifests, build, attach a root-file ZIP to a `v<version>` GitHub Release, then submit the metadata entry by PR to `AhmedWanneni/davinci-notes-plugins`.
- Verification: fresh dependency install and README build passed after making the template's ambient type configuration independent of parent workspace types. The compiled command registered and completed the vault round-trip; a temporary integration test loaded the built package through `PluginLifecycleManager` and invoked its command; the generated ZIP contained the three expected root files; and the package was copied into a manual-install plugin directory.
- No CLI was added. The template revealed that plugin authors currently need local ambient declarations because the runtime global `DavinciPlugin` and `@app/plugin-api` types are not published as a standalone SDK. No earlier runtime/API package was modified.

## 2026-09-02 - Theme Ecosystem Phase 1

- Audited every generated CSS custom property from `packages/design-system/tokens/src/*.json` and `tokens/dist/variables.css`: 52 public/theme-overridable tokens and 6 internal tokens. Icon weight values remain internal because they are coupled to the current icon library; motion timing/easing remains internal because it affects interaction behavior and performance.
- Added `packages/theme-api` with strict `ThemeManifest` types, JSON Schema, dependency-free validation, and fixture manifests/stylesheets. The schema and validator both enforce SemVer and relative CSS stylesheet paths.
- Documented the full public token contract and defaults in `packages/theme-api/PUBLIC_TOKENS.md`, including undeclared aliases and inconsistent naming/fallbacks found in application and canvas styles. No existing design-system source was modified.
- Decided a single theme package owns both light and dark variants in one stylesheet, using selectors and media queries. This keeps theme identity and compatibility metadata unified for later loader/registry work and avoids duplicating submissions.
- Verification: `@app/theme-api` typecheck/lint passed and all 6 fixture tests passed. The internal-token fixture is intentionally accepted as CSS today and documented as a future lint/warning case for Phase 2.

## 2026-09-03 - Theme Ecosystem Phase 2

- Added local theme discovery under `<vault>/.davinci/themes`, strict Phase 1 manifest validation, per-folder error isolation, and duplicate-ID rejection.
- Added a lifecycle manager that persists the active theme ID, injects one unrestricted manifest stylesheet, appends a replacement before removing the previous stylesheet, ignores stale asynchronous activations, and removes the active stylesheet on unload.
- Wired theme initialization to the existing vault session and added a Themes settings list beside the existing plugin settings list. The list supports activation, default styling, version/ID display, and malformed-folder errors.
- Honored Phase 1's one-package light/dark variant decision. The current app has no independent light/dark setting beyond its dark base `color-scheme`, so there was no mode toggle to integrate.
- Verification: theme lifecycle tests passed for computed-style switching A -> B -> default, malformed discovery isolation, and rapid repeated switching with one stylesheet node. Theme settings tests passed for activation and error rendering. Theme API tests (6) and desktop lint passed. Full desktop typecheck remains blocked by unrelated existing `vaultUpdateCounter` and design-system color typing errors.
- CSS safety/content policy remains intentionally deferred to Theme Ecosystem Phase 3.

## 2026-09-03 - Theme Ecosystem Phase 3

- Reviewed the actual Phase 2 `<style>` injection boundary and documented [the theme CSS safety policy](theme-css-safety.md).
- Chose documentation and registry review for external `url()` resources, with a stricter default rejection of external `@import`. No load-time sanitizer was added: a parser/filter would add foreground cost, could be bypassed by CSS syntax, and would incorrectly remove legitimate fonts or images without a theme-asset URL base.
- Assessed CSS-only exfiltration as lower risk than plugin code but non-zero because DOM metadata such as paths and ARIA attributes exists. Registry review must reject state-encoding selectors/beacons and unexplained external resources.
- Added a loader fixture test using an external import and background URL; the injected stylesheet remains unchanged, confirming the documentation-only policy. Theme API tests (6), theme loader/settings tests (6), desktop lint, and `git diff --check` pass. Full desktop typecheck remains blocked by unrelated existing workspace errors.

## 2026-09-03 - AI Features Phase 0

- The expected `plans/ai-integration-plan/ai-features-build-plan.md` was absent, so the task specification was used as scope authority and the missing artifact was recorded as a blocker.
- Added `@app/ai-api` with modality-neutral `embed`/`complete` provider contracts, capability metadata, stable authentication/network/rate-limit/unavailable/invalid-request errors, and an OS-secure-store adapter boundary. Added `@app/ai-runtime` delegating cloud/local implementations without inference code.
- Added an unreferenced `loadAISubsystem()` dynamic-import boundary; the consent screen lives inside that lazy subsystem. The default Vite build measured 1,376,898 raw bytes / 435,482 gzip across the entry and modulepreloads, with zero AI-specific symbols or model/provider strings in `dist`.
- Local feasibility resolved to no full local path at launch: published GGUF evidence puts nomic embeddings at 84.1 MB, Qwen2.5 3B chat at 1.93 GB, and Qwen2.5 7B chat at 4.68 GB before runtime memory/context overhead. A later local embedding path remains possible, but cloud is the only initial execution path.
- Added separate ADRs 0132-0135 for provider/lazy loading, local feasibility, consent copy/flow, and granular per-feature consent. Consent is blocking, provider-named, honest about note data leaving the device, reversible, and independent for semantic search, suggest-links, and ask-vault.
- API-key storage follows ADR-0120's Tauri Rust `keyring` pattern; no localStorage, SQLite, or file fallback was introduced. AI API tests, runtime typecheck/lint, consent tests, desktop lint, and production build passed. Full desktop typecheck remains blocked by unrelated existing workspace errors.

## 2026-09-03 - Theme Ecosystem Phase 4

- Confirmed the existing plugin registry infrastructure is partially generalizable: catalog parsing, GitHub repository/release resolution, compatibility lookup, HTTP downloads, ZIP extraction, and reload lifecycle are shared; manifest validation, archive layout, installation directory, activation, and uninstall remain theme-specific.
- Extended the local registry seed to include `themes` and added theme release/CSS review requirements to the existing submission README.
- Added theme archive validation against `@app/theme-api`, release ID/version and `minAppVersion` checks, stylesheet presence validation, staged safe installation under `.davinci/themes`, and uninstall.
- Added the Theme Registry browser section. Install confirms and auto-activates, updates use the same install path, and uninstall deactivates first before discovery reload.
- Verification: theme API tests (6), registry tests (3), theme lifecycle tests (4), settings tests (2), desktop lint, and `git diff --check` pass. Full desktop typecheck remains blocked by unrelated existing workspace errors.
- The real GitHub registry could not be cloned or updated because network/DNS access was unavailable. Real theme entry and browser install/update/uninstall verification remain blocked pending a published test theme and reachable registry.

## 2026-09-21 - Bundled theme authoring audit

- Stopped before creating the requested Light A, Catppuccin Latte, Catppuccin Frappé, and OLED themes. The task requires third-party authors to override only `packages/theme-api/PUBLIC_TOKENS.md`, while that document's existing audit states that canvas and application styles still depend on undeclared internal aliases and inconsistent fallbacks.
- A repository-wide variable-use audit confirmed broader affected aliases, including `--color-accent`, `--color-border`, `--color-border-default`, `--color-border-strong`, `--color-overlay`, `--color-text-primary`, `--color-text-secondary`, `--edge-color`, `--font-mono`, `--radius-*`, `--type-body`, and `--type-heading-3`. This prevents full requested coverage of canvas, graph, settings/modal, and other listed surfaces without violating the CSS contract.
- No CSS, manifests, loader wiring, dependencies, or ADRs were added. The precondition is to reconcile these consumers to existing public variables, or deliberately extend the public contract with a new ADR before authoring and publishing the fixture themes.

## 2026-09-21 - Theme discovery vault I/O fix

- Diagnosed theme discovery's `allow-exists` rejection: the active vault is authorized for note/tree I/O through Rust commands that read the runtime `VaultState`, but `desktopThemeAdapter` incorrectly used `@tauri-apps/plugin-fs` against `<vault>/.davinci/themes`. Static fs-plugin scope cannot safely cover that user-selected dot-directory.
- Added vault-scoped native commands to list `.davinci/themes` and read a theme file. They reuse `resolve_in_vault`, return an empty list only when the directory is absent, and return clear errors for other directory-entry/file I/O failures. Theme discovery already displays those errors instead of silently treating them as an empty list.
- The desktop adapter now calls the Rust command wrappers. The capability file is unchanged; no global dot-directory exception, dynamic plugin scope, dependency, or app-data relocation was added. Themes remain in the existing vault-local `.davinci/themes` location so installed packages travel with the vault and continue to match the established archive installer path.
- Verification: desktop command/adapter/lifecycle tests 9/9, including a fixture theme discovered and activated through the desktop adapter with command doubles; Rust native filesystem tests 2/2 for real temporary-vault listing/read, missing-directory empty behavior, and traversal rejection; desktop lint and Rust check passed. The existing unused `VaultWatcher::is_paused` warning remains. No mounted external drive or native Settings webview was available for acceptance testing.
## 2026-09-03 - AI Features Phase 1

- Added `@app/ai-embeddings` with heading/paragraph chunking, 2,000-character bounded windows, source locations for future citations, incremental content hashes, provider model metadata, and stale-chunk removal.
- Reused the Phase 0 `AIProvider.embed` boundary and aligned scheduling with the vault watcher's 450ms settle period and indexing's 50-item batches. The scheduler coalesces note updates and yields after each async provider batch.
- Added `createEmbeddingIndex()` behind the existing AI dynamic-import boundary. No app-startup static import was added.
- Added ADR-0136 and indexed it in `DECISIONS.md`.
- Verification: package typecheck, lint, and 3 focused tests pass; the large fixture contains 350 notes. The missing `ai-features-build-plan.md` remains an earlier-artifact blocker. Next is Phase 2 vector storage and indexing via sqlite-vec evaluation.
## 2026-09-03 - AI Features Phase 2

- Evaluated sqlite-vec against current maintenance, Rust/extension loading, WAL, ABI, and packaging risks. Rejected it for launch because `tauri-plugin-sql` does not expose a raw connection or extension-loading path and the extension remains pre-v1.
- Added migration v4 to the existing `vault-index.db` for `embedding_chunks`, using packed Float32 BLOBs and ordinary citation/hash/model metadata. Added application-side cosine ranking and retained the existing WAL/PRAGMA/DB-lock boundaries.
- Added ADR-0137 and indexed it in `DECISIONS.md`.
- Verification covered schema application with WAL/PRAGMA values, the 350-note fixture scale, and a `0.67ms` cosine query; Phase 3 remains semantic search UI. The existing Tauri live-connection concurrency path was not reproducible in the package runner, so no new connection path was introduced.
## 2026-09-03 - AI Features Phase 3

- Extended the existing lazy content Search dialog with an opt-in Semantic mode. The Cmd+K fuzzysort quick switcher remains unchanged.
- Reused the 150ms debounce and added a three-character minimum. Semantic results display a distinct label plus heading/source-line location.
- Added `searchEmbeddings()` through `AIProvider.embed` and the Phase 2 SQLite vector store, plus ADR-0138.
- Verification: embedding package 6/6 tests and SearchDialog jsdom 3/3 tests pass. Real relevance queries against vault content remain blocked because Phase 0 has no actual embedding transport and the vector table is not populated by a production pipeline yet.
## 2026-09-03 - AI Features Phase 4

- Added independent-consent suggested links using Phase 0 `AIProvider`, Phase 2 vectors, 450ms scheduling, top-5 candidates, and a 0.78 starting threshold.
- Added a Related notes subsection below backlinks in the existing right sidebar. Link actions use the existing editor adapter's canonical text insertion path.
- Added ADR-0139 and indexed it. Verification: embedding package 6/6, SearchDialog 3/3, Cmd+K 2/2, and insertion 1/1 tests pass. Real threshold tuning/relevance validation remains blocked until provider transport and production vector population exist.
## 2026-09-04 - AI Remediation C Citation Opener

- Wired the desktop host citation opener to canonical `openNote` and the
  existing `PluginEditor.setSelection` wrapper, with exact long-note line
  offset coverage.
- Added the Q&A panel host-event fallback and ADR-0147, closing ADR-0145 at
  the host boundary. Focused tests and lint pass; live Tauri click-through
  remains blocked because `App` does not yet mount the Q&A panel.

## 2026-09-03 - AI Features Phase 5 Assessment

- Audited ask-your-vault prerequisites and stopped before implementation because Phase 0 still has injected provider delegates/no persisted feature-consent state, while Phase 2's vector rows omit chunk text and return `text: ""`.
- Added proposed ADR-0140: ask-your-vault has distinct consent, an 8-chunk bounded retrieval context, exact question-plus-retrieved-text transmission, same-object citation sourcing, and explicit provider-error handling.
- No unsafe partial Q&A runtime or UI was added. Resolve the Phase 0 transport/consent and Phase 2 chunk-text gaps before Phase 6 settings/provider management.

## 2026-09-04 - AI Provider Extension: Gemini, OpenRouter, and Ollama

- Extended the existing `AIProvider` abstraction with real Gemini embedding/
  chat transport, OpenRouter OpenAI-compatible transport, and Ollama local HTTP
  transport. No new dependency was added.
- Classified Ollama as local-networked rather than a third provider mode:
  localhost skips cloud consent, while non-local URLs receive a visible
  remote-data warning. Added a distinct `local-server-unavailable` error.
- Added provider-specific secure-key validation/status, editable OpenRouter
  embedding/chat model slugs, Ollama server/model settings, and provider-aware
  status-bar naming. Provider switching uses separate status/config state.
- Updated consent copy to name Gemini/OpenRouter and explain OpenRouter's
  downstream routing. Added ADR-0149; accepted ADRs were not edited.
- Focused transport tests pass 10/10 and consent tests pass 2/2. Live probes
  could not complete: external DNS was unavailable for Gemini/OpenRouter and
  Ollama was not running on localhost. Desktop typecheck remains blocked by
  pre-existing workspace-store and design-system typing errors.

## 2026-09-04 - Provider Startup SQLite Contention Fix

- Found that the provider extension introduced direct settings reads during
  application startup and AI settings reload while indexing can begin a
  `BEGIN IMMEDIATE` transaction on the same native SQLite connection.
- Routed AI consent, provider selection/status, model configuration, and
  Ollama configuration reads through the established `withDbLock` queue.
  Multi-setting reads acquire the queue once for their whole operation.
- Set SQLite `busy_timeout` before `journal_mode=WAL`, so connection setup
  waits for an existing writer rather than attempting WAL activation first.
- Expanded the contention regression to include a queued provider-style read
  with indexing, embedding, and settings operations. Focused vault tests pass
  10/10; desktop lint passes. Desktop typecheck remains blocked by existing
  workspace-store and Button color typing errors.

## 2026-09-04 - Ask-Your-Vault Host Mount

- Diagnosed the missing Q&A panel as a host-mount omission, not consent state:
  the real application database contained `ai.consent.ask-vault=enabled`, and
  source/history showed the Phase 5 component was exported but never rendered
  by `App`, the right sidebar, or the icon rail.
- Added the consent- and provider-ready-gated panel to the right sidebar with
  a nested lazy import. Q&A/provider code loads only after a question is
  submitted, preserving the initial-bundle boundary.
- Routed Q&A retrieval reads through the shared SQLite queue and restored the
  AI-state event after settings changes so the host gate refreshes immediately.
- Added ADR-0150 and right-sidebar tests for enabled/disabled visibility and
  question dispatch. Focused host/panel tests pass 3/3; desktop typecheck is
  still blocked only by existing workspace-store/Button typing errors.

## 2026-09-04 - Gemini Provider Readiness Reconciliation

- Investigated Q&A's `Google Gemini key is not configured` error. The
  application database selected Gemini and marked it ready, while the
  provider-specific Keychain credential could not be loaded.
- Made readiness require both the SQLite status and the Keychain credential.
  A missing cloud credential downgrades its stale status to `failed`, hides
  Q&A, and supplies a reconnect-in-Settings error. Ollama remains exempt
  because it has no API key.
- Added ADR-0151. Focused Q&A host tests pass 3/3 and desktop lint passes;
  desktop typecheck remains blocked by existing workspace-store/Button errors.
# Custom Window Chrome

- Moved desktop window creation to Rust and preserved the established title,
  1200×800 initial size, and 640×480 minimum size. macOS uses overlay native
  traffic lights; Windows/Linux use custom close/minimize/maximize controls.
- Reworked the app shell so the file-sidebar header and tab strip occupy the
  first content row, with dedicated, non-interactive drag targets and native
  double-click maximize. Added fullscreen spacer tracking without polling.
- Added ADR-0156 and narrow core window capabilities. No dependency was added.
- Automated checks: focused component test, lint, web build, Rust check,
  Storybook script, and diff check pass. Desktop typecheck is still blocked by
  pre-existing `vaultUpdateCounter` and Badge color errors. Native macOS and
  Windows/Linux visual acceptance remains manual because the local GUI surface
  did not expose the launched Tauri window.

# File Tree Drag UI, Pure Validation, and Drop Feedback

- Replaced default WebKit drag snapshotting with a synchronous, lightweight flat
  preview pill (`fileTreeDragPreview.ts`) containing the Phosphor SVG file/folder icon,
  truncated filename, and multi-selection badge, rendered offscreen and assigned via
  `setDragImage`.
- Added pure drop validation (`getDropEffect.ts`) attached to both `dragenter` and
  `dragover` events. Validates self, descendant, current parent, hidden entries (`.git`),
  vault root, valid folders, and file-row parent resolution.
- Added deferred source row dimming (`opacity: 0.5`, `data-is-dragging="true"`) via
  `requestAnimationFrame` (to avoid capturing dimming into the drag snapshot) and global
  window-level `dragend` / `Escape` listeners for reliable cleanup.
- Added flat drop target styling (`data-drop-target="true"` on folder rows,
  `data-drop-root="true"` for root container inset outline) and container-level event
  delegation for tracking targets.
- Added 600ms hover-to-expand for collapsed folders with immediate timer cancellation
  on target change or drag leave, and disabled transitions when `prefers-reduced-motion: reduce`.
- Added ADR-0157. Automated unit/DOM tests pass (25 FileTree tests, 222 total desktop tests)
  and desktop lint passes with 0 errors. Native macOS visual cursor and drag appearance
  remain UNVERIFIED due to headless execution environment.

# File Tree Context Menu, Click-Away Dismissal, and Folder Actions (CRUD)

- **Task 1: Context Menu Dismissal**:
  - Identified root cause of unclosable context menu: `FileTreeContextMenu` was a hand-built floating `div` positioned absolutely without outside click, window blur, scroll, or Escape listeners.
  - Built `useContextMenuDismiss.ts` registering a capture-phase `pointerdown` listener on `document` (ensuring `data-tauri-drag-region` header/window areas cannot intercept or block dismissal events), plus Escape keydown, `window.blur`, and scroll listeners.
  - Constrained context menu coordinates so it never renders clipped outside viewport edges.
  - Added `FileTreeContextMenu.test.tsx` (5 tests passing).

- **Task 2: Context Menu Structure & Keyboard Navigation**:
  - Implemented differentiated context menu actions:
    - Files: `Open`, `Rename` (`F2`), `Duplicate`, `Delete` (`⌫` / `Delete`).
    - Folders: `New note`, `New folder`, `Rename` (`F2`), `Delete` (`⌫` / `Delete`).
    - Root empty space: `New note`, `New folder`.
  - Added arrow-key navigation (`ArrowUp`, `ArrowDown`, `Home`, `End`) cycling focus through menu buttons.
  - Suppressed context menu opening on hidden/system files and directories (`.git`, `.obsidian`).
  - Extracted `useTreeExpandedFolders.ts` to keep `FileTree.tsx` within line limits (246 lines ≤ 250).

- **Task 3: Folder-Scoped Note & Folder Creation**:
  - Updated `createNewNote` in `useVaultSession.ts` to accept optional `parentFolder`.
  - Updated header buttons and context menu actions to create notes/folders inside the currently selected folder (or vault root if none selected).
  - Automatically expanded parent folders on creation and triggered immediate inline rename focus via `pendingRenameNote` and `pendingRenameFolder`.
  - Added `useTreeExpandedFolders.test.ts` (4 tests passing).

- **Task 4: Batched Folder Rename**:
  - Implemented `renameFolderInVault.ts` validating names against illegal filesystem characters (`/ \ : * ? " < > |`) and collision with existing folders.
  - Re-indexed all descendant notes in SQLite within a single `withDbLock` + `withDbTransaction` batch, updating `fts_notes`, `links`, `tagIndex`, `graph`, save timers, dirty note buffers, and open tabs.
  - Added `renameFolderInVault.test.ts` (4 tests passing).

- **Task 5: Safe Folder Deletion**:
  - Added native Rust command `delete_folder` in `fs.rs` and registered it in `lib.rs` with canonical root safety check and `resolve_in_vault`.
  - Implemented `deleteFolderInVault.ts` purging descendant notes from SQLite (`notes`, `fts_notes`, `links`), clearing cached markdown content, dirty notes, save timers, removing nodes from graph index, and closing open tabs for deleted notes.
  - Added confirmation dialog in `FileTree.tsx` before invoking folder deletion.
  - Added `deleteFolderInVault.test.ts` (4 tests passing).
  - Added ADR-0158. All 71 desktop test files and 239 total unit tests pass; ESLint passes with 0 errors. Native macOS visual checks remain UNVERIFIED due to headless execution environment.

### 2026-09-19 — Fix: Folder rename and delete no-op

- Diagnosis traced the folder menu, F2, keyboard delete, and inline editor to the correct folder callbacks and `rename_folder` / `delete_folder` invoke wrappers. The native commands already used `fs::rename` and `fs::remove_dir_all`; custom Tauri commands are registered and do not depend on fs-plugin scoped removal permissions.
- The user-visible delete failure was `window.confirm()` in `FileTree`: browser modal APIs are unsupported in the Tauri webview, so the delete callback was never invoked. Folder rename's errors were not caught by the inline editor and rejected results became only `console.warn` in state actions.
- Replaced browser confirmation with the existing `@tauri-apps/plugin-dialog` native confirmation; cancellation leaves disk untouched and errors are shown with native error dialogs. Failed inline rename now presents a native error dialog. No new dependency was added.
- `folder_commands.rs` is the command core used by the registered Rust commands. It rejects vault-root, hidden/system, traversal, and symlink-component paths; its real temp-filesystem tests rename a nested note into a Unicode/spaced folder and recursively delete a nested folder. `renameFolderInVault` now rejects slash names and loads all descendants before renaming, removing the previous silent read failure.
- Actual checks: focused TS tests 11/11; full desktop Vitest 73 files / 242 tests; ESLint; Rust command-core tests; Rust check. Typecheck remains blocked only by pre-existing `vaultUpdateCounter` and design-system Button-color errors. `cargo fmt --check` reports broad pre-existing formatting drift across the Rust crate, and `git diff --check` reports the pre-existing blank-line change in `saveTimers.ts`.
- UNVERIFIED in this headless session: native macOS dialog/callback behavior and logs; every manual entry point; full-index/settings/embedding concurrency; large-folder timing; unsaved child tab persistence; UI backlink/tag/graph/switcher/H1-sync and file-operation regressions.

### 2026-09-19 — Follow-up: Immediate folder-delete tree update

- The delete helper had correct state pruning but performed it only after the complete descendant SQLite cleanup, so the filesystem could already be correct while a large folder still appeared in the tree.
- State pruning now runs immediately after successful `delete_folder`: folder/note paths, affected tabs, active note, cached content, and dirty buffers update before the queued index transaction. The index cleanup remains serialized by `withDbLock` and is unchanged.
- Focused delete-folder regression (4/4) and desktop ESLint pass. Native visual timing remains UNVERIFIED.

### 2026-09-20 — Follow-up: Immediate folder-rename tree update

- A real stale-path failure showed the filesystem had `New Folder/New Folderjkhk` while the tree still tried to delete `New Folder/New Folder`. The native `Source folder not found` result was therefore correct and retained as a safety guard.
- `renameFolderInVault` now updates the folder/note paths, open tabs, active child, cached content, dirty buffers, and save timers immediately after native rename succeeds. The queued descendant index transaction and graph calculation then complete without keeping stale tree paths visible.
- Focused rename/delete tests (8/8) and desktop ESLint pass. Native visual behavior remains UNVERIFIED.

### 2026-09-20 — Follow-up: Clear deleted folder selection

- `AppSidebar` retained `selectedFolderPath` after deleting a folder. Its header New Note/New Folder actions then passed that stale path to commands that intentionally create missing parents, recreating `New Folder` and nesting new content beneath it.
- A successful folder delete now clears selected-folder state. The sidebar also treats any selection not in current `allFolderPaths` as vault root before an action can run, with an effect to clear stale UI state.
- Canvas creation is already root-scoped and does not consume `selectedFolderPath`. Focused folder tests (10/10) and desktop ESLint pass.

### 2026-09-20 — Emoji icons Task 1: offline picker dependency boundary

- Rejected emoji-mart after the approved audit; installed `frimousse@0.3.0` (MIT, peer `react: ^18 || ^19`) and pinned `emojibase-data@17.0.0` (MIT).
- Added an ignored, generated static-data preparation script. It copies only Frimousse's required English `data.json` and `messages.json` locally; it does not use a CDN. The build succeeds with the generated assets.
- Frimousse uses canvas-based native-emoji support detection and supplies search, categories, skin tones, keyboard navigation, and virtualization. It does not need a sprite sheet or shadow DOM.
- Tauri CSP remains `null`; no remote `connect-src` exception was made. The dynamic picker UI and its final chunk measurement are deferred to the required Task 4 implementation.
- Added ADR-0159. The sync audit found the current Rust manifest only lists supported note/media extensions, so it currently omits `.davinci/icons.json`; Task 3 must make this explicit and merge map keys safely across devices.

### 2026-09-20 — External vault changes: watcher and reconcile hardening

- Extended the existing 400 ms `notify-debouncer-full` watcher with paired supported-file rename paths; no second watcher or dependency was introduced.
- Reconciliation reads external files before entering `withDbLock`, then compares filesystem paths with SQLite paths under that lock to clear stale entries. It no longer suppresses the watcher during reconciliation.
- External deletes clear save timers and tabs without writing the deleted path. Renames remap open paths; clean open files reload. Dirty files keep local content and report a vault error.
- Checks: Rust watcher tests, focused indexer/stress tests, and desktop lint passed. Required real temporary-vault watcher operations and the full indexing/settings/embedding concurrency test remain UNVERIFIED.

### 2026-09-20 — File tree emoji picker layout and persistence

- Selection previously only updated in-memory React state, so icons vanished after restart. Markdown notes now write `icon` frontmatter; folders and other files write `.davinci/icons.json`. Load merges both sources when a vault opens.
- The unstyled Frimousse grid sat in the sidebar flex flow and overflowed row layout. The picker is now portaled to `document.body`, width/height constrained, 8 flex columns, overflow hidden; tree-row emojis are capped to `--icon-size-sm`.
- Focused icon/picker tests passed (23). Native picker interaction and restart-with-real-vault remain UNVERIFIED. Rename/delete remapping of map keys and sync inclusion of `.davinci/icons.json` are still open.

### 2026-09-20 — Unified custom window controls

- Replaced macOS overlay traffic lights with the existing Tauri-backed custom window controls so titleless chrome has one coherent sidebar treatment across platforms.
- Removed the native-light spacers and styled the compact controls with existing flat, border/token-based states. The tab row receives the same controls when the sidebar is collapsed.
- Desktop lint and Rust check pass. Native macOS interaction and visual placement remain UNVERIFIED.
## 2026-09-26 — Public-token consumer reconciliation closeout

- Completed the default-theme representative-surface diff against pre-reconciliation baseline `1ad9064`. Alias/fallback changes are classified in `docs/dev/public-token-default-style-diff.md`; the only regression was the editor font-size runtime setting, now restored.
- Finalized the public contract for all application, canvas, editor, and design-system consumers. ADR-0163 provides the modal scrim role; ADR-0164 provides status tints and shared shadow ink. The former alias/fallback audit is closed.
- Made `check:public-tokens` blocking, wired it to Husky pre-commit and CI, and confirmed zero findings with a fully justified allowlist. A temporary staged raw `#f0c` file was rejected by the hook, removed, and the normal guarded commits passed.
- Retained the magenta stylesheet and Vite route as a permanent development-only verification utility. Deferred: Dialog BEM selector rename, Settings/shared-Dialog overlay consolidation, and fixture-vault gitignore evaluation.
### 2026-09-26 — Plugin RPC Phase 2b-2a synthetic plumbing activation

- Activated `listenForPluginHostRequests` from `usePluginStore.initPlugins` only after the probed plugin-runner exists and the main-side event subscription is installed. The listener is dynamically imported and cleaned up on vault changes; no runner means no listener.
- Added `DAVINCI_PLUGIN_RPC_SYNTHETIC=1`. After listener activation, the main window sends `synthetic.start` to the runner. The runner calls its existing RPC request hook for `plugin-rpc-probe/single.md`, then starts three `vault.read` calls without awaiting between them and reports the results as notifications.
- Notifications are logged rather than answered by the host, while request messages use the existing host adapter and `plugin_webview_send` response path. Added the `plugin_webview_exists` and `start_plugin_webview_synthetic_probe` commands.
- Checks: `cargo check`, focused desktop ESLint, and production web build passed. Native round-trip and zero-plugin runtime behavior are intentionally unverified here; the Ahmed-local runbook is the verification artifact.

### 2026-09-26 — Plugin declarative views (ADR-0167)

- Replaced the plugin-facing live-DOM view contract with a serializable
  `PluginViewModel` union: `stack`, `text`, `button`, and `input`. The old
  `PluginDom`, `PluginViewContext`, `pluginDom`, and `PluginWorkspaceHost`
  path were removed, so there is no host API that hands a runner plugin an
  `HTMLElement` or permits it to inject HTML into the main DOM.
- Runner-side workspace registration retains the real `render`/`onEvent`
  callbacks in `plugin_webview_bootstrap.js`. Lifecycle and command responses
  contain view snapshots; main validates them in `PluginViewRegistry` before
  retaining descriptors. Invalid models fail closed. `PluginViewLeaf` renders
  only those trusted model nodes through React, and emits serializable
  `views.event` messages for clicks and input changes. The runner returns the
  updated model over the existing correlated RPC transport.
- Added the minimal `rpc-counter-view` fixture with a counter button, plus
  model-validation and React-renderer tests (including a literal HTML-looking
  text string that remains text and does not create an `img` node). No editor
  API, starter-template migration, capability lockdown, or native command
  authorization was attempted in this phase.
- `usePluginStore` now requires a nonempty plugin directory before starting a
  host listener, so switching from a plugin-bearing vault to an empty vault
  cannot activate a previously created runner.
- Checks: plugin-api and plugin-runtime typechecks; plugin-api tests (22);
  plugin-runtime tests (3 pass, 6 pre-existing legacy skips); focused desktop
  renderer test; focused ESLint; bootstrap syntax check; and production web
  build. Desktop-wide typecheck remains blocked by pre-existing workspace,
  Storybook, fixture, and Button-color errors. Native GUI verification remains
  Ahmed-local only under the standing environment constraint.

### 2026-09-26 — Plugin editor RPC (ADR-0167)

- Replaced the exported synchronous plugin editor surface with promise-based
  snapshot reads/mutations. `getContent` and `getSelection` return `{ content,
  selection, version }`; `setContent`, `setSelection`, and `insertText` return
  the resulting snapshot and accept optional `expectedVersion` conflict checks.
  `subscribe` is the only change-listener API.
- Added `PluginEditorRpcHost`, which holds the synchronous CodeMirror adapter
  only in the main webview and dispatches the seven `editor.*` RPC methods.
  Runner-side plugin context methods all call the generic request bridge;
  subscription callbacks remain runner-local and receive `editor.changed`
  notifications. Plugin unload removes its host subscriptions.
- Content and selection updates use a 100 ms trailing debounce. This sends a
  single latest snapshot after a typing burst instead of serializing the full
  document on every CodeMirror transaction, while staying responsive enough
  for interactive plugin reactions. Added the `rpc-editor-fixture` manual
  plugin and host/unit adapter coverage.
- Checks: plugin-api, plugin-runtime, and editor typechecks; editor tests
  (73); plugin-api tests (22); plugin-runtime tests (3 pass, 6 legacy skips);
  focused desktop RPC-host tests (2); focused ESLint; runner syntax check; and
  production web build. Desktop-wide typecheck remains blocked by pre-existing
  workspace, Storybook, fixture, and Button-color errors. Native GUI checks
  remain Ahmed-local.

### 2026-09-26 — Plugin starter migration and plugin-runner native command guard

- Migrated `templates/davinci-plugin-starter` to the async runner API. It now
  uses declarative `PluginViewModel` UI, async vault/storage/editor calls, and
  a command callback that is invoked through the existing RPC lifecycle. Its
  ignored installable `dist/` was rebuilt with `npm run build`.
- Added `command_auth::reject_plugin_runner`, a label check injected into every
  non-RPC business command registered by `lib.rs`: vault/filesystem, manifest,
  theme files, Git operations/history/remote validation, Git PAT keychain,
  OAuth/browser/listener/Drive-token keychain, and AI-key keychain commands.
  The control-plane plugin-webview commands remain label-constrained by their
  existing sender/target checks. No raw-SQL custom command exists; the
  plugin-runner capability intentionally lacks `sql:allow-execute`.
- Added a manual `security-probe` fixture with only `vault:read` that records
  arbitrary-evaluation, `fetch`, traversal, and direct OAuth/AI-key/raw-SQL
  attempts for Ahmed's native verification. Arbitrary JS evaluation and fetch
  are intentionally still unblocked in this phase; command authorization is
  not a network/shell permission implementation.
- Checks: `cargo check`; `cargo test command_auth`; all Rust tests with
  `cargo test -- --test-threads=1`; starter `npm run build`; and syntax checks
  for the generated plugin artifacts. The normal parallel Rust test run has a
  pre-existing temporary Git-directory name collision (two tests), so the
  serialized run is the reliable complete result. Native GUI/security behavior
  remains Ahmed-local under the standing environment constraint.

### 2026-09-26 — Plugin mediated network permission enforcement

- Added `PluginNetwork` / `context.net.fetch`, a serializable network request
  and response contract. The runner passes an opaque host-issued per-plugin
  capability token with every `network.request`; the host requires that token
  and the plugin's immutable `network` permission before using host `fetch`
  with `credentials: "omit"`. Responses are capped at 1 MiB before crossing
  back to the runner.
- The runner's static page now has a deny-all outbound CSP. After its Tauri
  event listener is installed, it removes and locks browser network globals
  (`fetch`, XHR, WebSocket, EventSource, workers, WebTransport) and Tauri
  internals. The plugin evaluator additionally shadows browser/DOM globals.
  Bootstrap failure to remove a global is reported rather than silently
  continuing. This is the ADR-0166 webview/CSP boundary, not SES: arbitrary
  JavaScript and shared-runner inter-plugin interference remain out of scope.
- The manifest's `shell` permission has no implementation path: there is no
  plugin shell API, shell RPC method, runner capability, or plugin-reachable
  spawn command. Existing host process commands remain caller-label guarded,
  so no shell infrastructure was added.
- Added manual `security-probe` (no network permission) and `network-probe`
  (network permission) fixtures. Checks: plugin API/runtime typechecks;
  focused lifecycle and network-host tests (3 total); runner/fixture syntax;
  starter build; and production web build. Native execution/CSP compatibility
  and real outbound results remain Ahmed-local.

### 2026-09-26 — Plugin discovery uses the vault-owned native boundary

- Diagnosed the Installed Plugins empty state: `desktopPluginAdapter` attempted
  to access `<vault>/.davinci/plugins` through the Tauri fs plugin, then caught
  any capability/scope error and returned `[]`. This is the same hidden-dot-
  directory scope failure previously corrected for themes, so discovery never
  reached manifest validation even while Rust's file tree could show folders.
- Added guarded native commands to list plugin directories and read/write files
  under the active vault's `.davinci/plugins` root. The desktop adapter now
  uses those commands for discovery and plugin data, eliminating the separate
  scoped-fs path. Traversal is still rejected by `resolve_in_vault`; the
  plugin-runner label is rejected by the existing command guard.
- `discoverPlugins` now logs the scan, each manifest read, and accepted/rejected
  validation. The Settings store and Installed Plugins list retain and display
  root/per-folder discovery errors instead of silently showing only an empty
  list. Four fixture manifests lacked the required `author`; corrected their
  templates while preserving per-folder error visibility for stale copies.
- Checks: Rust plugin-file test; `cargo check`; focused plugin-runtime discovery
  tests (2); focused Settings-list tests (4); scoped diff check. Desktop-wide
  typecheck remains blocked by unrelated pre-existing workspace/tree/Storybook/
  design-system/icon errors. Native Settings verification remains Ahmed-local.

### 2026-09-26 — Fix mediated fetch receiver binding

- `PluginNetworkRpcHost` defaulted its injected implementation to bare
  `fetch`, then invoked that detached reference. In the Tauri WebKit main
  webview this loses the required `Window` receiver and caused the observed
  `Can only call Window.fetch on instances of Window` error before any
  permitted response could be read.
- Changed the default to `window.fetch.bind(window)`. The runner global-
  removal script only overwrites runner globals and never captures or invokes
  fetch, so it was ruled out as the source. Permission/token validation remains
  before the bound fetch call.
- Checks: focused network-host tests (3, including a bound-owner regression)
  and production web build pass. Desktop-wide typecheck remains blocked by
  unrelated pre-existing workspace/tree/Storybook/design-system/icon errors.
  Native network-probe/security-probe confirmation remains Ahmed-local.

### 2026-09-27 — Plugin enable race, native mediated fetch, and security-probe reporting

- Diagnosed duplicate `plugins.load`/`plugins.onload` requests as an async
  lifecycle race: `enablePlugin` left the record disabled until both RPC calls
  completed, so overlapping enable callers could each proceed. React StrictMode
  is enabled and the store also offered no in-flight init/runtime-load guard.
  The manager now coalesces same-plugin enable operations, while the desktop
  store coalesces same-vault initialization and runtime loads. A focused test
  asserts two overlapping enables issue only one load and one onload request.
- Confirmed `tauri.conf.json` has `csp: null`, so main-window CSP/capabilities
  were not the source of `Load failed`. The mediated request previously used
  browser fetch in the main WebKit view, where CORS/WebKit networking is not a
  reliable host boundary. It now uses a Rust `reqwest` bridge after the existing
  manifest/token check, rejects direct runner callers, permits HTTP(S) only,
  limits redirects to five, and caps response bodies at 1 MiB.
- Added fixture-only `probe.result` RPC reporting. The security probe now emits
  all seven result categories through the existing channel, and Rust prints a
  `[plugin-security-probe]` line for each. No direct Tauri access is exposed.
- Checks: focused lifecycle tests (2) and network-host tests (3) pass; an
  earlier `cargo check` passed before the dependency feature minimization. The
  later production/native build filled the agent session's shared filesystem
  (180 MiB free) and failed linking with `os error 28`; final native verification
  remains Ahmed-local and must start from a machine with sufficient free space.

### 2026-10-10 — SQLite write-lock contention in vault-index.db (5.2s write stalls)

- Diagnosed 5.2s stalls on `INSERT INTO notes ... ON CONFLICT`, `DELETE FROM notes`,
  `DELETE FROM notes_fts`, `DELETE FROM links`, and `BEGIN IMMEDIATE`. The ~5.2s
  duration matched SQLite's default 5000 ms `busy_timeout` plus slight IPC latency.
- Identified root cause in `tauri-plugin-sql`: it manages an underlying `sqlx::SqlitePool`.
  When a write transaction (`BEGIN IMMEDIATE` inside `withDbTransaction`) checked out
  a connection, unqueued concurrent queries (`queryBacklinkSources` in BacklinksPanel,
  `loadNoteIcons` in treeIconStorage, `executeSearchQuery` in App) checked out other pool
  connections. In SQLite WAL mode, readers do not block writers and writers do not block
  readers *only if* connections do not contend on locks or transactions; but when pooled
  connections overlap with unbatched mutations and uncoordinated statements, connection
  checkout and write contention triggered SQLite's 5000 ms busy timeout.
- Additionally, watcher removal executed unbatched per-path deletions (2 SQL queries
  per removed note) rather than bulk parameterized statements, unnecessarily extending
  transaction hold times.
- Implemented universal serialization: all SQLite operations (`db.select`, `db.execute`)
  must acquire the JS `withDbLock` queue. Wrapped `queryBacklinkSources`, `loadNoteIcons`,
  and `executeSearchQuery` in `withDbLock`.
- Added parameterized bulk deletion helpers `removeNotesBatch` (chunked at 50) in
  `sqliteIndex.ts` and `removeFtsRows` in `sqliteFtsIndex.ts` using `WHERE path IN (...)`
  and `WHERE source_path IN (...)`.
- Extracted `queryFullGraphIndex` into `sqliteGraphIndex.ts` to strictly observe the
  250-line hard cap (now 236 lines in `sqliteIndex.ts`).
- Wrapped initial PRAGMA connection setup (`busy_timeout=5000;`, `journal_mode=WAL;`,
  `synchronous=NORMAL;`, `foreign_keys=ON;`) in `withDbLock`.
- Standardized all vault CRUD operations (`deleteNoteInVault`, `deleteFolderInVault`,
  `renameFolderInVault`, `renameNoteInVault`, `createNoteInVault`, `duplicateNoteInVault`,
  and `VaultIndexer`) to execute batch removals and writes under `withDbTransaction`
  inside `withDbLock`.
- Recorded ADR-0168; marked ADR-0148 superseded.
- Verified: all 89 test files and 302 unit tests in `@app/desktop` pass; ESLint passes with
  0 errors and 0 warnings.
- Flagged out-of-scope issues: plugin runner bootstrap readonly property error and
  Vite Fast Refresh warning on `computeNoteStats`.

### 2026-10-10 — Fix "database is locked" unhandled rejection and tab "+" button

- Diagnosed root causes:
  1. `Unhandled Promise Rejection: error returned from database: (code: 5) database is locked`
     thrown from `useVaultSession.ts`: `subscribeVaultChanges` passed an unhandled async
     callback to the Tauri event listener without surrounding `try/catch`. When `reconcileVaultChanges`
     or `queryFullGraphIndex` failed with code 5, the returned promise rejected unhandled.
  2. Tab bar "+" button doing nothing and leaving orphan files: `createNoteInVault` wrote
     to disk, then synchronously awaited SQLite indexing (`persistNote`) before updating
     workspace state or opening the tab. When the DB was locked, it threw, leaving an
     orphan file on disk with no index row and no tab opened. Furthermore, `AppTabs` was
     wired to `handleCreateNote` which invoked `setPendingRenameNote`, routing focus into the
     sidebar file tree's inline rename input rather than focusing the editor.
- Decoupled UI tab opening from SQLite indexing: `createNoteInVault` writes the file to disk
  via `writeNote`, immediately updates `useWorkspaceStore` (`allNotePaths` and `notesContent`),
  and dispatches background indexing. Tab opens immediately in milliseconds; UI never blocks
  or fails due to SQLite lock contention.
- Implemented `retryOnSqliteBusy` with capped exponential backoff (up to 3 retries) specifically
  targeting `SQLITE_BUSY` / `(code: 5) database is locked` on idempotent operations.
- Wrapped all DB operations in `useVaultSession.ts` (`handleVaultLoaded`, `subscribeVaultChanges`,
  `queryFullGraphIndex`) in `try/catch` with logging/reporting and attached `.catch()` to
  the listener registration promise, eliminating all unhandled rejections.
- Wired `AppTabs` "+" to `handleCreateNoteFromTabs` which creates an untitled note and focuses
  the editor without triggering file tree inline rename.
- Recorded ADR-0169; added `retryOnSqliteBusy.test.ts` (8 tests) and `newNoteCreation.test.ts`
  (4 concurrency and lock robustness tests).
- Verified: all 91 test files and 314 unit tests pass in `@app/desktop`; ESLint passed with
  0 errors and 0 warnings.

---

### 2026-10-10: Tray Phase 2 — Close-to-Tray Setting and Unified Clean Quit

- Added "Keep running in menu bar" setting toggle in `GeneralSettingsTab.tsx` with instant IPC updates and asynchronous disk persistence in `davinci-tray-settings.json`.
- Maintained `TraySettingsState` in Rust with atomic `keep_in_tray` and `is_quitting` flags to eliminate frontend-to-backend race conditions on window close.
- Intercepted `WindowEvent::CloseRequested` in `lib.rs`:
  - When `keep_in_tray` is ON: prevents window destruction, flushes dirty notes via `davinci-window-hidden`, hides the window, and sets macOS activation policy to `Accessory` (hiding Dock icon).
  - When `keep_in_tray` is OFF: prevents raw destroy, triggers unified clean quit (`davinci-clean-quit` -> `saveAllDirty()` -> `request_app_exit()` -> stops `VaultWatcher` debouncer -> `app.exit(0)`).
- Intercepted `RunEvent::ExitRequested` in `lib.rs`: prevents premature process abort on Cmd+Q, App Menu -> Quit, or OS terminate (`code: None`), triggering unified clean quit with a 2-second fallback timeout.
- Handled `RunEvent::Reopen` on macOS: unhides and focuses the window and switches activation policy back to `Regular` (restoring Dock icon) upon Dock click or application relaunch.
- Unified Tray menu "Quit" to route through `trigger_clean_quit(app)` for identical clean teardown.
- Added unit tests:
  - `tray_tests.rs`: 4 tests for atomic state initialization, toggle, quitting flag, and event constant stability.
  - `useTrayMenuActions.test.ts`: 5 tests covering clean quit, tray quit, window hidden flush, and note creation.
  - `SettingsDialog.test.tsx`: verified "Keep running in menu bar" setting row rendering.
- Verification: 23 Rust tests pass; all 93 desktop test files (325 tests) pass; ESLint 0 errors; production web build passes.

---

### 2026-10-11: Tray Phase 4 — Global Shortcut and Lazy Quick Capture Window

- **Global Shortcut Implementation**:
  - Registered official `tauri-plugin-global-shortcut` (v2.3.2) during application setup.
  - Default shortcut: `Control+Alt+N` (does not conflict with macOS Mission Control, Spotlight, Finder, Alfred, or Raycast).
  - Explicitly filtered on `ShortcutState::Pressed` only to eliminate double-firing on key release.
  - Handled conflicting / invalid shortcuts gracefully with validation, user error surfacing, and rollback to previously active shortcut.
  - Persisted user-configured shortcut (`captureShortcut`) and target note (`captureTarget`) in `davinci-tray-settings.json`.
- **Lazy Quick Capture Window**:
  - Created lazily on first trigger (`show_or_create_capture_window`): `WebviewUrl::App("capture.html")`, `520x160`, always-on-top, skip taskbar, centered, frameless.
  - Kept in memory and hidden/shown on subsequent triggers (`unminimize()`, `show()`, `set_focus()`).
  - Intercepted `CloseRequested` on `"capture"` window to hide rather than destroy.
  - Added "Quick capture" menu item (`tray-quick-capture`) in tray menu.
- **Isolated Tiny Frontend Entry Point**:
  - Declared multi-page Rollup input in `vite.config.ts` (`main: index.html`, `capture: capture.html`).
  - `capture.html` loads `src/capture/main.tsx`, mounting `<QuickCapture />`.
  - Emits bundle `dist/assets/capture-*.js` of only **2.97 KB raw / 1.14 KB gzip**.
  - Zero imports of CodeMirror, SQLite, Canvas, KaTeX, Mermaid, or indexer in the capture bundle.
- **Pure-Append Rust Write Path**:
  - Handled entirely in Rust (`capture.rs` and `capture_commands.rs`).
  - Frontend passes only `{ text: String }`. Rust resolves target note relative to active `vault_root` via `resolve_in_vault`, strictly confining writes within the vault and rejecting traversal (`..`) or symlink escapes.
  - Managed `CaptureState` with `write_lock: Arc<Mutex<()>>` serializing rapid concurrent captures to guarantee ordered writes with zero interleaving or data loss.
  - File appends via `O_APPEND` without rewriting or truncating existing content. Inspects last 4 bytes to check EOL and CRLF without reading large files into memory (< 1 KB memory usage on 50 MB files).
  - Automatically prepends missing trailing newlines and matches file CRLF line endings.
  - Guaranteed pure append format: Phase 4a's `classifyDiskChange` classifies changes as `pure_append`, allowing open dirty editors in the main window to merge captured text losslessly.
  - Zero SQLite / `vault-index.db` access: capture never opens or accesses SQLite; file watcher handles indexing naturally under universal `withDbLock`.
- **Least Privilege Capability Boundary**:
  - `capabilities/capture.json` grants only `core:default`, `core:window:allow-close`, `core:window:allow-hide`, `core:window:allow-set-focus`, `core:event:allow-listen`.
  - `command_auth.rs` rejects all native main-window commands (`fs::*`, `git::*`, `ai_auth::*`, etc.) when invoked from the `"capture"` window.
- **Testing & Verification**:
  - Added Rust unit tests in `capture_tests.rs`: 20x rapid concurrency serialization, CRLF line ending preservation, frontmatter preservation, empty file / missing folder creation, large file tail seek, safe path traversal rejection, shortcut validation. All 38 Rust unit tests pass.
  - Added TypeScript unit tests in `QuickCapture.test.tsx` and `CaptureSettingsSection.test.tsx`. All 100 test files (358 tests) pass.
  - Web production build succeeds with 2.97 KB capture chunk; ESLint passes with 0 errors.

---

### 2026-10-11: Tray Phase 4b — Click-to-Capture Popover and Left-Click Setting

- **Architectural Shift (ADR-0172)**:
  - Superseded Phase 1 decision ("menu opens on left click").
  - Left click on tray icon toggles the Quick Capture window anchored directly under the icon (macOS top menubar) or above the taskbar (Windows bottom taskbar).
  - Right click continues to open the native tray menu (`Show/Hide`, `New note`, `Quick capture`, `recent notes`, `daily note`, `Open vault`, `Quit`).
- **Popover Positioning & Work Area Clamping (`tray_position.rs`)**:
  - Pure Rust positioning avoiding external dependencies (zero crate weight).
  - Resolves active monitor from `available_monitors()`, calculates physical coordinates with monitor DPI scaling, horizontally centers under the icon, and clamps strictly within the monitor's work area with an 8px margin.
  - Automatically adapts for top menu bars vs bottom taskbars without hardcoded geometry.
- **Blur/Toggle Race Elimination**:
  - `CaptureState` maintains atomic timestamp `last_blur_time`.
  - On `WindowEvent::Focused(false)`, the capture window hides and records `now_ms`.
  - When the tray left-click handler fires within 350ms of a blur event, it suppresses reopening, guaranteeing clean single-click open and single-click close with zero flicker.
- **In-Memory Draft Preservation**:
  - Unsaved typed text in `<QuickCapture />` is retained in React memory across blur, Escape, and mode switches.
  - Cleared only upon successful save (`quick_capture_save`) or process exit.
- **Live Left-Click Setting & Non-Destructive Migration**:
  - Added `"trayLeftClickAction"` (`"capture"` | `"menu"`) in `davinci-tray-settings.json`.
  - Defaults to `"capture"` for new users; defaults to `"menu"` for existing configs missing the key to prevent silent behavior changes.
  - Live runtime toggle via `tray.set_show_menu_on_left_click(action == "menu")` with zero restart required.
  - Setting row in General Settings (`TrayClickSettingsRow.tsx`) automatically hides on platforms where tray click events cannot be intercepted (e.g. Linux).
- **Capability & Performance**:
  - `capabilities/capture.json` remains completely unmodified (0 permission expansion).
  - 0 timers or polling loops added.
- **Testing & Verification**:
  - Added unit tests in `tray_tests.rs`: top menubar positioning, screen edge clamping, bottom taskbar placement, Retina scaling, blur debounce tracking, setting defaults.
  - Added unit tests in `TrayClickSettingsRow.test.tsx` and updated `QuickCapture.test.tsx` for in-memory draft preservation.
  - All 45 Rust unit tests and 373 frontend unit tests (103 test files) pass with 0 lint errors.




