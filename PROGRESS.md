# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Last Session — Web Clipper Phase 3 (part 1): the Rust receiver core

**Scope:** the Rust half of Phase 3 of `web-clipper-feature-plan.md` — validation,
token auth, the loopback listener and the webview handshake. The listener is
**inert**: `clipper_enable` is the only way to start it and no UI calls it yet, so
the shipped risk is unchanged. Deferred to the next session: `clipperService.ts`,
`appendToNoteInVault`, the Settings pairing section. One commit, one concern, on
top of Phase 2b (`e5743f3`).

**Phase 0 gate resolved first (it was the blocker).** The plan required verifying
`tauri-plugin-deep-link`'s Rust ≥ 1.90 against `rust-version = "1.77.2"`. Result:
deep-link v2 latest is 2.6.2 (needs 1.90); 2.4.10 is the last 1.77.2-compatible
release; `tauri-plugin-single-instance` 2.5.x also needs 1.90; the installed
toolchain is already rustc 1.97.1, so the pin is declarative only. Since the deep
link is a *launch convenience* (payload always goes over loopback, and ADR-0178's
queue already covers the closed-app case) and the loopback carrier is required
under every option, the chosen path is **loopback-only + manual pairing**: no
plugin added, MSRV unchanged. ADR-0173 amended (still Proposed); no ADR accepted.

**Built (`apps/desktop/src-tauri/src/`):** `clipper_payload.rs` (wire types mirroring
`ClipPayload.ts`, `deny_unknown_fields`, `ClipAck`/`ClipError`),
`clipper_name_rules.rs` (literal Rust port of `safeName`/`normalizeFolder`/
`normalizeNoteName`/`isSafeRelativePath`), `clipper_validate.rs` (bounds + shape),
`clipper_http.rs` (hand-rolled request reader with hard caps), `clipper_routes.rs`
(the one route and its checks), `clipper_dispatch.rs` (the `ClipDispatcher` trait +
the webview handshake), `clipper_server.rs` (`ClipperState` + lazy lifecycle),
`clipper_commands.rs` (7 Tauri commands, all `reject_plugin_runner`-gated).
`Cargo.toml` gains `constant_time_eq = "0.4"` and `getrandom = "0.2"` — both
already compiled in the tree (via `blake3` and the lockfile), so zero binary delta.

**The decision that mattered most (ADR-0180):** the desktop **re-validates and
rejects** rather than re-sanitising. `safeName` is the shared *definition* of safe;
the extension applies it and the desktop compares the result to the input, so a
`folder`/`noteName` that is not already the fixed point is `invalid-path`. This
matches the plan's adversarial check 1 and is better than silently writing a name
the user never saw. `clipper_validate_tests.rs` pins both directions (legitimate
extension output accepted, hostile input rejected) — including the literal,
odd-looking parts of the port (a TAB is *removed*, not collapsed; truncation counts
UTF-16 units as JS `slice` does).

**Security shape:** token is the boundary and is compared in constant time;
`Host` must be exactly `127.0.0.1:<port>` (`localhost` and `127.0.0.1.evil` are
refused — DNS-rebinding defence); a present `Origin` must be `chrome-extension://`/
`moz-extension://`; no CORS headers (the extension will hold a narrow
`http://127.0.0.1/*` host permission instead). The body cap (2 MiB) and header cap
(16 KiB) are enforced **before** buffering; a truncated body is an error, never a
short read. Rust never writes: it emits `clipper:clip-received` and blocks on a
20 s `clipId`-keyed channel the webview completes via `clipper_submit_result`.
Stopping the listener wakes the blocked `accept()` with one throwaway connection —
no poll loop (PERFORMANCE.md rule 9).

**Verification:** 32 new Rust tests (attack matrix over real loopback sockets:
checks 1–4 and 9), `cargo test` 76 pass / 1 fail — the failure being the
pre-existing `git_auth::tests::system_git_accepts_a_pat_through_its_standard_https_askpass_path`,
which shells out to system `git` 2.56, is untouched by this session, and fails
standalone. `cargo clippy --all-targets` adds zero warnings (the 7 present are all
pre-existing). Largest new clipper file 243 lines; every new file ≤ 250.

**Environment gotcha for the next session:** a cold `cargo` build fails to link on
this machine — the default `MacOSX27.0.sdk` `.tbd` files use an `arm64e.x1-macos`
target this `ld` cannot read. Prefix Rust commands with
`SDKROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk`.

## Previous Session — Web Clipper Phase 2b: React popup on the design system

**Scope:** `apps/web-clipper` Phase 2b — the popup UI (`ClipPopup`, `ClipEditor`,
`ClipPreview`, `ClipModeSelector`, `TemplatePicker`) on `@app/design-system`, plus
the pipeline split that lets it change templates without re-extracting a page.
One commit, one concern, on top of Phase 2a (`1e9dc6d`).

**Built:** React 19 + `@wxt-dev/module-react` mounting into
`entrypoints/popup/main.tsx` (StrictMode deliberately off: its dev double-invoke
would read and extract the page twice, and a popup is a fresh document each open).
`@app/design-system` styles come from `_global.scss`; the app resolves
`@app/design-system` through an alias in `wxt.config.ts` + tsconfig paths + a vitest
alias, because that package has no `main`/`exports` (the same reason
`apps/desktop/vite.config.ts` aliases it). Every component ships `.module.scss` +
story + test, kebab-case classes, tokens only (one literal: the popup width, which
has no token).

**Plan §Phase 2 deliverables, item by item:** template picker ✓; editable
title/folder/properties ✓ (`ClipEditor`); preview ✓ (`ClipPreview`, Markdown as
text); "Add to DaVinci Notes" disabled until Phase 3 ✓; extraction modes full /
selection / highlights ✓ (highlights stays listed but disabled — no highlighter
exists until Phase 5, and a hidden option is worse than an explained one);
"no page access at load" ✓ (still no content script). Adversarial checks 1
(hostile `<title>`/`og:*` → literal text, asserted with `container.querySelector`)
and 5 (unreadable page → explicit error state, no partial file) are covered here;
check 4 (large page cost) is covered by `clipPipeline.perf.test.ts`.

**Two costs forced by an interactive popup (ADR-0179, Proposed):**
1. **Pipeline split.** `prepareClipContext` (page, mode → extraction + variables)
   is memoised separately from `renderClipPayload` (template → payload), so
   switching templates re-renders without re-parsing the DOM or re-running
   Defuddle. The one-shot compositions (`runClipSession`, `buildClipFromPage`) were
   **deleted** rather than left beside it — with the popup as the only caller they
   were dead code.
2. **Draft vs payload.** The inputs show the user's raw typing (`ClipDraft`); the
   payload is what that typing sanitises to (`applyClipEdits`): separators and `..`
   segments stripped, leading dot removed, `.md` ensured, characters no filesystem
   and no Chrome download accept removed, and a cleared property removed from the
   frontmatter instead of written empty. `contentHash` is untouched, because it
   hashes the body and the body is not editable here (ADR-0178 dedupe stays sound).

**Measured (real `wxt build`):** popup chunk 580,258 raw / **170,650 B gzip** and
15,288 / 3,196 B gzip of CSS, against Phase 2a's 350,180 / 99,576 — so React 19 +
the design-system primitives cost **~71 KB gzip**. **Tree-shaking verified, not
assumed:** the built chunk and CSS contain no `Dialog`, `DropdownMenu`, `Popover`,
`Tooltip`, `Checkbox` or `Switch` code despite the barrel re-exporting them, so the
whole barrel is not being pulled in. Background stays 970 / 507 B.

**Clip cost re-measured on the popup's own path** (`clipPipeline.perf.test.ts`,
jsdom, median of 3): 8.4 KB page 39.8 ms, 19.2 KB 41.9 ms, 33.6 KB 66.6 ms,
1.43 MB / 4k paragraphs 3,085.2 ms. jsdom is several times slower than a browser
DOM, so these are upper bounds. Bounds are pinned loosely (<1000 ms / <8000 ms).
**Surfaced again:** the large-page cost still grows with page size and nothing caps
it — the plan's 2 MiB cap is a Phase 3 transport concern and truncating captured
HTML would silently degrade extraction, so the page-size limit remains an owner
decision.

**Real bug found by the tests:** a save failure was invisible — the popup only
rendered an error when `status === "error"`, so a rejected download showed nothing
while the form stayed usable. An error is now shown whenever it is set, and the
"page cannot be read" explanation only when the page itself failed. Asserted both
ways (`ClipPopup.test.tsx`, `useClipSession.test.tsx`).

**Also fixed:** a stale comment in `buildVariableContext.ts` claimed the extractor
mutates the document; Phase 2a proved it does not (`extractArticle.test.ts` pins
that), so the comment now says the opposite, which is what `prepareClipContext`
relies on.

**Verification:** 106 tests across 17 files pass (was 51/9), including the new
component interaction tests, the session hook driven through injected dependencies
(no `wxt/browser` module mock), edit sanitisation, and clip cost. `tsc --noEmit`
clean, ESLint clean, `wxt build` succeeds. Largest file 227 lines, every file ≤ 250.

**Not done here, deliberately:** extension icons (WXT falls back to the default
puzzle icon; the plan does not list icons) and template import/export, which the
plan puts in **Phase 4**, not Phase 2. Storybook stories exist for all five
components, but no app has a Storybook config in this repo (only
`packages/design-system` does), so app stories are still not rendered anywhere.

---

## Earlier — Web Clipper Phase 2a: extension pipeline with real Markdown

**Scope:** `apps/web-clipper` Phase 2a (capture → extract → variables → template →
payload → note file). Phase 1 (`packages/clipper-core`) shipped in the previous
commit. One commit, one concern.

**Built:** WXT 0.21.4 + Vite, MV3, Chromium first. Manifest permissions are only
`activeTab, scripting, storage, contextMenus, downloads` with
**`host_permissions: []`**; background service worker (context menu + keyboard
command); popup entrypoint. `minimum_chrome_version: "127"` because
`action.openPopup()` needs it.

**Architecture change from the plan (§2):** there is **no content script**. The
popup calls `browser.scripting.executeScript({ func: readPage })` and parses the
returned HTML with `DOMParser` locally. `activeTab` + `scripting` is enough, so no
host permission is granted and nothing is injected until the user invokes the
clipper.

**Measured (real `wxt build`):** popup chunk 350,180 raw / **99,576 B gzip**;
background 970 / 507; manifest 545 B. Total 353.09 KB raw.

**Cost of the clip itself** (jsdom, median of 3, pinned by `runClipSession.perf.test.ts`):
a 7.6 KB page clips in 24.9 ms, 18.6 KB in 30.4 ms, 37 KB in 44.8 ms, and a
pathological 1.48 MB / 4k-paragraph page in 2,781.8 ms. jsdom is several times
slower than a browser DOM, so these are upper bounds, not user-visible cost. The
page DOM is now parsed **once** per clip — template matching and rendering share
the document — which removed ~350 ms from the large-page case. **Surfaced, not
hidden:** the large-page cost grows with page size and nothing caps it. The plan's
2 MiB cap is a Phase 3 transport concern, and truncating captured HTML would
silently degrade extraction, so the page-size limit is left to the owner rather
than guessed at here.

**Extraction decision changed by measurement (ADR-0174 amended):** Defuddle's
**core** bundle has no Markdown converter — `contentMarkdown`/`separateMarkdown`
exist only in `index.full.js` (verified by grep and by a failing test).
`defuddle/full` measures 218,493 B gzip against **101,914 B gzip** for core +
`turndown` + `turndown-plugin-gfm` — **~114 KB gzip saved**. Core still annotates
MathML with `data-latex` and normalises `.admonition` to `data-callout`, so two
Turndown rules recover **LaTeX math** (`$…$` / `$$…$$`) and **Obsidian callouts**
(`> [!warning] Title`). Both are asserted against real Defuddle output, not
hand-written markup, so a Defuddle upgrade that changes the markup fails the test.

**Real bugs found by the tests (not test-only):**
1. Relative URLs resolved against the **extension origin** — `DOMParser` gives the
   parsed document `baseURI = chrome-extension://…`, so `selector:img?src` and
   `og:image` produced extension-relative URLs. Fixed with `parsePageHtml()`
   (injects `<base href="<page url>">`) plus `resolveUrl()`.
2. Callout output dropped the separator space (`> [!warning]Careful`). Fixed.
3. Turndown discards blank elements *before* custom rules, silently losing
   `<math data-latex="…"></math>`; `seedBlankMath` seeds the text content, guarded
   by an `includes("data-latex")` check so the common path skips the extra parse.
4. `schema:@Type` auto-apply matched **nested** JSON-LD nodes — an article whose
   `author` is a `Person` made every `schema:@Person` template fire. Auto-apply now
   uses `readSchemaOrg`'s top-level `@graph` indexing only.
5. `turndown-plugin-gfm` emits `-   item`; tidied to `- item` by a documented
   regex that preserves nested indentation.

**Verification:** 51 tests across 9 files pass — extraction, Markdown rules, page
variables, the whole pipeline, template store/match, note file, downloads, session,
and clip cost — including hostile page metadata (a `../../escape` title yields no
`..` and no `/` in the note name or folder) and a path-traversal-safe download
filename. `tsc --noEmit` and ESLint are clean; `wxt build` succeeds. Largest file
156 lines, every file ≤ 250.

---

## Earliest — Web Clipper feature plan (plan only, no code)

**Deliverables:** `web-clipper-feature-plan.md` (phased build plan, architecture
diagram, payload schema, phases 0–8 with dependencies + adversarial verification),
draft ADRs `docs/adr/0173`…`0178`, and this file + `DECISIONS.md` updated.

**What was decided (all `Proposed`, awaiting owner input — see the plan §10 and
each ADR's "Open decisions"):**
1. **Transport (ADR-0173):** hybrid — `davinci://clip/wake` deep link as a
   *handshake/wake only* (never carries content), payload over a loopback-only
   HTTP listener on `127.0.0.1` with a per-install keychain token, Origin/Host
   checks and a 2 MiB cap. Native Messaging deferred. Rationale in ADR-0173;
   precedent is the existing OAuth `TcpListener` in `oauth.rs`. **Blocker to
   verify:** the Tauri docs state `tauri-plugin-deep-link` needs Rust ≥ 1.90 while
   `Cargo.toml` pins `1.77.2`; loopback-only + manual pairing is the fallback.
2. **Extraction (ADR-0174):** Defuddle (MIT, 310 KB / ~86.4 KB gzip, WIP, the
   library the reference clipper uses) with **`useAsync:false`** so no third-party
   API is ever contacted; `@mozilla/readability` (11.2 KB gzip) + Turndown
   (4.1 KB gzip) recorded as the lighter fallback.
3. **Framework/location (ADR-0175):** new `apps/web-clipper` (WXT, MV3, Chromium
   first) + new pure-TS `packages/clipper-core`; new `clipper-core`/`web-clipper`
   entries in `eslint-plugin-boundaries`.
4. **Engine split (ADR-0176):** extension resolves page variables and renders
   body/properties; desktop resolves vault context, behavior and paths; templates
   are data only; one `ClipPayload` schema (documented in the plan §4).
5. **Write path (ADR-0177):** Rust authenticates/validates then emits to the main
   webview, which uses the canonical `createNoteInVault` / new
   `appendToNoteInVault`; no extension-side and no Rust-side direct note write.
6. **Closed-app queue (ADR-0178):** queue in extension storage (200 clips / 5 MB /
   30 days, oldest-first), event-driven drain (no timers), `clipId` +
   `contentHash` dedupe against a bounded desktop ledger.

**No dependencies were installed and no application code was written.** Bundle
sizes and library facts were verified against bundlephobia, the Obsidian
documentation/help repo, and the Defuddle/Readability/WXT repositories; the
Obsidian clipper is cited only for its documented behavior and public repo
contents.

**Recommended first phase:** Phase 0 (ADRs + transport spike, HIGH-RISK / one
session) — see the plan §12.

---

## Current Focus

**Editor styling tokens — Phase 2 complete**
Added 30 editor-prefixed Obsidian-parity tokens under `editor.obsidian` without
replacing any existing tokens. Generated CSS, SCSS, and TypeScript outputs;
documented token names and the existing spacing-token boundary in
`packages/design-system/tokens/README.md`. Design-system build and typecheck
pass. The `packages/editor` package was not modified.

**Next:** Phase 3 should consume the new `--editor-obsidian-*` values. Existing
`editor.heading.*.space-above` / `space-below` values remain unchanged because
the audit did not establish replacement per-heading values.

**Theme Parity — Obsidian Default Light Theme Alignment (complete)**
Aligned base design tokens and desktop CUBE CSS styles to visually match Obsidian's default light theme baseline:
1. Step 1 token sampling & mapping: Sampled values directly from Obsidian (v1.13.7 default light theme). Mapped values to design system tokens (`--color-bg-primary: #ffffff`, `--color-bg-primary-alt: #f6f6f6`, `--color-text-normal: #222222`, `--color-text-muted: #5c5c5c`, `--color-text-faint: #ababab`, `--color-border-subtle: #e4e4e4`, `--color-border-normal: #d4d4d4`, `--color-bg-hover: rgba(0,0,0,0.05)`, `--color-bg-active: rgba(0,0,0,0.08)`).
2. Step 2 token rebuild: Updated `packages/design-system/tokens/src/color.json` and rebuilt tokens (`variables.css`, `_variables.scss`, `tokens.ts`) with zero hardcoded values in components.
3. Step 3 component styles & visual QA:
   - Root: updated `:root { color-scheme: light; }`.
   - Tabs: 40px tab bar height with `#f6f6f6` background, active tab `#ffffff` with 6px border radius, 1px bottom border matching editor background, seamlessly eliminating previous purple accent underline.
   - File tree: active row and icon updated from purple accent to `var(--color-text-normal)` (`#222222`) with `rgba(0, 0, 0, 0.08)` background and medium font weight.
   - Icon rail: active item styled with `var(--color-text-normal)` and `var(--color-bg-active)`.
   - Editor header: removed bottom divider border (`border-bottom: none`), aligned title and button colors to `var(--color-text-muted)`.
   - Status bar: full-width white background with subtle top border, UI font family for stats, and right-aligned chip/pill container matching Obsidian's status chip.
4. Constraints & verification: Pure styling changes (no behavior or layout-structure changes, no new dependencies). All 12 design system tests and all 103 desktop frontend tests passing. Staged in a single commit.

**Quick Capture Improvements (theme parity, floating above all windows, quit option, enlarged box, save button, temporary folder target — complete)**
Updated the Quick Capture popover and save destination per user preferences:
1. App theme parity: Quick Capture now synchronizes with the main app's active theme. `restoreCachedBuiltinTheme` runs synchronously on startup, while `useCaptureTheme` listens to `davinci-theme-changed` and `davinci-capture-focus` to instantly mirror theme swaps across windows without reloads.
2. Floating window above all opened windows: Quick Capture is configured with `always_on_top(true)` on window build and display, and no longer automatically vanishes on `Focused(false)` blur, staying floating on top of all opened windows (browsers, editors, documents) while referencing or writing notes.
3. Quit option to close: Added a dedicated "Quit" button in both the header (`.quick-capture-quit-btn`) and footer actions, alongside `Esc`, `⌘Q`, `Ctrl+Q`, and tray icon click toggling.
4. Enlarged popover dimensions: Increased Quick Capture window geometry from 520x160 to 640px wide by 340px high (`capture.rs` and `tray_position.rs`), with all screen/taskbar positioning tests updated and passing.
5. Direct "Save note" button & Cmd+S: Added an accessible, styled Save button in the footer actions and wired `⌘S` / `Ctrl+S` / `⌘Enter` saving with disabled state when empty.
6. Vault target in `temporary/`: Updated default target note in `tray_config.rs` and `CaptureSettingsSection.tsx` to `temporary/Inbox.md`. Rust capture writer creates parent directories recursively (`create_dir_all`) if they do not exist.
7. Modular architecture: Factored out `useCaptureTheme.ts`, `QuickCaptureFooter.tsx`, `QuickCaptureHeader.tsx`, and `QuickSearchList.module.scss`, keeping all files strictly under 240 lines (enforcing the 250 hard cap).
8. Tests & Verification: All 45 Cargo unit tests passing; all frontend tests passing; zero ESLint errors in desktop workspace.

**Tray Phase 4b — Click-to-capture popover with left-click setting (complete, ADR-0172)**
Implemented click-to-capture popover anchored under the tray icon with configurable left-click setting:
1. Architectural decision (ADR-0172 supersedes Phase 1 click decision): Left-click on tray icon toggles the Quick Capture window anchored directly under the icon (or above on Windows bottom taskbars); right-click opens the tray menu.
2. Work area clamping & multi-monitor math (`tray_position.rs`): Pure Rust positioning querying monitors, identifying the icon's monitor, handling Retina DPI scaling, horizontally centering with 8px screen margins, and vertical clamping. Zero new external dependencies (evaluated and avoided `tauri-plugin-positioner`).
3. Focus/blur toggle race resolution: `CaptureState` tracks `last_blur_time`. On `WindowEvent::Focused(false)`, window hides and timestamp is recorded. Tray left-click within 350ms of blur suppresses reopen, guaranteeing clean one-click open and one-click close with 0 flicker.
4. In-memory draft preservation: Unsaved typed text in `<QuickCapture />` is preserved in memory across blur, Escape, and mode switches; cleared only on successful save (`quick_capture_save`) or app quit.
5. Live left-click setting & non-destructive migration: Added "Menu bar icon click" setting in General Settings (`TrayClickSettingsRow.tsx`) allowing users to choose between "Open quick capture" (`capture`, default for new users) and "Open menu" (`menu`, default for existing configs without key). Changes take effect live with no restart via `tray.set_show_menu_on_left_click`. Hides automatically on unsupported platforms (e.g. Linux).
6. Zero capability growth: `capabilities/capture.json` remains completely unmodified (0 new permissions).
7. Zero timers/polling: 0 background loops or intervals added.
8. Tests & verification: All 45 Rust unit tests pass; all 103 frontend test files (373 tests) pass; ESLint 0 errors; full production release build passes.
Phase 7 (settings consolidation and audit) is next (Phase 6 is deferred).

**Tray Phase 5 — Quick Search from the capture window (complete)**

Implemented quick search from the capture window, providing unified FTS5 search directly from the capture view:
1. Architectural decision (Option C, ADR-0171): Granted scoped SQL permissions (`sql:default`, `sql:allow-execute`) to `capabilities/capture.json` so the capture window queries `vault-index.db` directly via `@tauri-apps/plugin-sql` and the canonical `@app/indexer` search engine (`executeSearchQuery` / `parseSearchQuery`). Reuses the exact same BM25 ranking and query syntax as the in-app quick switcher with zero ranking drift and zero IPC proxy lag.
2. WAL mode concurrency: `vault-index.db` executes with `journal_mode=WAL` and `busy_timeout=5000`. Read-only queries in the capture window execute concurrently without blocking or failing on writer transactions in the main window.
3. Keyboard-first UI & seamless mode switching: Tab or header tab toggles between Capture and Search modes. Typed capture text is safely preserved across mode toggles and Escape dismissals. Up/Down arrows navigate results, Enter opens note in main window, and Esc returns to capture mode.
4. Native note opening with strict path validation: `open_note_from_capture(path)` verifies caller authorization via `authorize_capture_window`, validates path within the vault root via `validate_recent_note_path`, focuses and unminimizes the main window (`show_main_window`), emits `davinci-tray-open-note`, and hides the capture window.
5. Debounced querying & cancellation: Queries are debounced by 150ms with sequence token cancellation so only the latest query's results are rendered, capping results at 8 items with parent folder paths.
6. Safe display rendering: Note titles and folder paths render strictly as text children without HTML/script injection. Malicious, odd, and injection queries (`"`, `*`, `NEAR(`, long strings, SQL syntax) execute safely with parameterized bindings.
7. Lightweight bundle & file limits: Capture bundle grew by only ~1.43 KB gzip (`dist/assets/capture-*.js` 8.14 KB raw / 2.57 KB gzip). All source files strictly ≤ 230 lines (within caps).
8. Tests & Verification: 39/39 Cargo unit tests pass; 102/102 frontend test suites (370 tests) pass with 0 lint errors.
Tray Phase 6 (sync status in tray) is next.

**Tray Phase 4 — Global shortcut and lazy Quick Capture window (complete)**
Implemented global shortcut (`Control+Alt+N` default, configurable via General Settings) and lazy Quick Capture window:
1. `tauri-plugin-global-shortcut`: registered on `ShortcutState::Pressed` only to eliminate double-firing. Handled conflict registration gracefully with error surfacing and rollback.
2. Lazy Quick Capture window: created lazily on first shortcut press or tray "Quick capture" menu trigger (`WebviewUrl::App("capture.html")`), then hidden/shown. Intercepted close event to hide rather than destroy. Single textarea with auto-focus, Enter saves, Shift+Enter for newline, Esc dismisses.
3. Isolated tiny frontend entry point: `capture.html` -> `src/capture/main.tsx` importing only design-system tokens and React (`dist/assets/capture-*.js` 2.97 KB raw / 1.14 KB gzip). Zero CodeMirror, Canvas, KaTeX, Mermaid, or SQLite imports.
4. Pure Rust append with mutex serialization: `Arc<Mutex<()>>` write lock in `CaptureState` serializes rapid concurrent capture invocations with 0 loss or interleaving. Appends `- [YYYY-MM-DD HH:mm:ss] <text>\n` (or CRLF matching the file) to target note (default `Inbox.md`). Checks last 4 bytes without reading full file into memory (< 1 KB overhead even for 50 MB files). Never modifies or reformats existing bytes, ensuring Phase 4a's `classifyDiskChange` classifies changes as `pure_append` so active dirty editors merge losslessly.
5. Vault-root path confinement: webview passes text only; target note is resolved from settings in Rust via `resolve_in_vault`, rejecting any path traversal (`..`), absolute paths, or escaping symlinks.
6. Zero SQLite / `vault-index.db` access: capture writes exclusively to disk markdown files via filesystem `O_APPEND`. Indexing flows naturally through watcher under `withDbLock`.
7. Least-privilege capability file: `capabilities/capture.json` grants only `core:default`, `core:window:allow-close`, `core:window:allow-hide`, `core:window:allow-set-focus`, `core:event:allow-listen`. All native commands reject non-main windows via `command_auth.rs`.
8. Code limits: all source files strictly ≤ 200 lines (`capture.rs` 195, `capture_commands.rs` 144, `capture_format.rs` 51, `tray.rs` 200, `lib.rs` 196, `QuickCapture.tsx` 145, `GeneralSettingsTab.tsx` 187, `CaptureSettingsSection.tsx` 115).
9. Tests & Verification: 38/38 Cargo unit tests pass (including 20x concurrency, large file tail seek, CRLF preservation, frontmatter preservation, path traversal rejection, shortcut validation); 100/100 frontend test suites (358 tests) pass with 0 lint errors.
Tray Phase 5 (quick search) is complete.

**Phase 4a — Save-time external-change guard with append-aware merge (ADR-0170 supersedes ADR-0161) — complete**

Fixed silent data loss vulnerability where autosave (750 ms) or manual save unconditionally overwrote external disk modifications when notes were dirty in memory:
1. `stat_note` & atomic `write_note` in Rust: returns `{ exists, mtime, size }`; writes to atomic sibling `.tmp.<pid>` then executes `fs::rename`.
2. `diskStateTracker`: in-memory tracking of `{ mtime, size, content }` on load, reload, and save.
3. Save-time stat guard: `performSaveNote` stats the file first; unchanged notes skip file reads (0 extra disk reads).
4. `classifyDiskChange`: classifies external modifications into `touched_only`, `pure_append`, or `conflict`. Pure appends seamlessly merge tail into the editor buffer without moving cursor or undo stack. Conflicts pause autosave, flag the tab, and display a 3-action conflict banner in `EditorArea` ("Keep my version", "Use the disk version", "Save mine as a copy").
5. `saveQueue`: per-path promise serialization preventing race conditions across debounced saves, Cmd+S, and quit flushes.
6. Clean quit protection: notes remaining in conflict during exit are saved as `<stem> (conflict <timestamp>).md` by `saveAllDirty()` so neither external edits nor user draft buffers are lost.
7. Verification: 98/98 frontend test suites (348 tests) and 28/28 Cargo unit tests passing. Code caps strictly enforced (< 250 lines).
Global shortcuts and Quick Capture window (Phase 4) is next.

**Tray Phase 3 — dynamic tray menu with recent notes, daily note, and open vault (implementation and automated tests complete)**
Added dynamic menu support to macOS tray:
1. "Recent notes": Last 5 opened notes derived in reverse-chronological order from workspace navigation history and open tabs. Duplicate titles across folders are automatically disambiguated (e.g. `Title (folder)` or `Title (root)`). Paths are strictly validated in Rust to ensure no path traversal (`..`), empty, or absolute paths escape the vault root.
2. "Open today's daily note": Reuses existing `handleDailyNotes` handler in `App.tsx` (opens or creates `YYYY-MM-DD.md` in vault root).
3. "Open vault...": Reuses existing `openPicker` dialog handler from `useVaultSession`.
4. Debounced sync: Subscribed to workspace note transitions with a 200 ms trailing debounce; zero polling or timers running at rest while hidden.
5. Code limits: Soft cap ≤ 200 lines strictly respected across all files (`tray.rs` 198 lines, `tray_commands.rs` 73 lines, `tray_menu.rs` 133 lines, `tray_tests.rs` 97 lines).
6. Tests: All 26 Rust tests and 329 frontend tests passing.
Global shortcuts (Phase 4) is next.

**File tree toolbar — new note, new folder, sort order, collapse all, expand all**
Added Obsidian-style action toolbar at the top of the file tree explorer:
1. `NotePencil` ("New note"): creates note in selected folder or vault root.
2. `FolderPlus` ("New folder"): creates folder in selected folder or vault root.
3. `SortAscending` / `SortDescending` ("Change sort order"): toggles between A-Z and Z-A file and folder sorting.
4. Custom SVG matching Obsidian/Lucide Fold icon ("Collapse all"): collapses all folders in the file tree.
5. `CaretUpDown` ("Expand all"): expands all folders in the file tree.
Extracted `FileTreeToolbar`, `FileTreeList`, and `FileTreeOverlays` to stay cleanly within the 150-200 line soft cap (all files < 190 lines). Full Storybook story and unit tests added; all 92 test files (320 tests) passing.

**Plugin lifecycle deduplication, native mediated fetch, and probe visibility — awaiting Ahmed-local verification**
`PluginLifecycleManager` now coalesces overlapping enable requests by plugin ID,
and `usePluginStore` coalesces overlapping initialization/runtime-load operations
for the same vault. This fixes the concrete asynchronous race where two callers
could both observe a disabled record before either `plugins.load`/`plugins.onload`
RPC completed. A focused regression test confirms two concurrent `enablePlugin`
calls emit exactly one load and one onload request.

`network.request` no longer executes browser `fetch` in the main webview.
`PluginNetworkRpcHost` keeps its token/manifest permission gate and then invokes
the Rust `plugin_network_request` bridge, which rejects direct plugin-runner
callers, accepts only HTTP(S), limits redirects to five, and caps returned bodies
at 1 MiB. The main-webview CSP is explicitly `null`, so it was not the observed
blocker; WebKit/browser networking (including CORS) was the unreliable path
behind the generic `Load failed`. This adds a native HTTP dependency using the
system TLS backend; no JavaScript initial-bundle cost is added, but binary size
must be measured during Ahmed's native build.

The `security-probe` fixture now sends all seven outcomes over `probe.result`
RPC. Rust prints each one with `[plugin-security-probe]`, so arbitrary-code,
ambient-fetch, mediated network, traversal, OAuth, AI-key, and raw-SQL outcomes
are visible in the same terminal log. Native app verification remains Ahmed-local.
Focused lifecycle and network tests pass. A later Rust build attempt exhausted
this agent environment's shared disk (180 MiB free, `os error 28`), so the final
native rebuild/run was not attempted here.

**Standing environment constraint — native GUI verification requires Ahmed's desktop session**
This agent runs with `CODEX_CI=1`, `CODEX_SANDBOX=seatbelt`, and a workspace
permission profile. Although macOS reports an Aqua login session and a running
WindowServer, the agent process has no GUI session variables and cannot access
normal process/window inspection. Native webview and interactive-window
verification must therefore be run manually from Ahmed's own interactive
terminal/desktop session, not delegated to an AI agent session. Agent sessions
may implement and reason about native code, but must not claim this class of
verification. Future phase prompts requiring native GUI/security verification
must separate “agent implements and explains the runbook” from “Ahmed runs it
locally and reports the observed output.”

**Plugin isolation scaffold — native round-trip still unverified**
A hidden `plugin-runner` webview can now be explicitly created by the
`DAVINCI_PLUGIN_RPC_PROBE` test hook and has its own no-fs/no-SQL capability
file. It carries the ADR-0167 envelope and a ping/pong bootstrap, while the
old main-webview evaluator remains untouched. `cargo check` and a web build
pass. In the available native launch environment Rust logs confirm only
`plugin-runner` creation; the hidden webview never emitted its bootstrap or
pong log before the process exited. Do not treat the RPC channel as verified
or this as a security boundary. Diagnose native hidden-webview startup before
starting Phase 2b-2.
Source diagnosis: `run(tauri::generate_context!())` follows setup, so the
probe path does not return immediately after `WebviewWindowBuilder::build()`.
The runner URL is the real `plugin-runner.html`, and the bootstrap is attached
with `initialization_script`; Tauri documents that hook as document-start
injection. A native run still logs only probe request/creation (not even the
probe-only JS error report), so the remaining failure is native webview
document startup in this headless launch environment, not an observed
event-name mismatch or a missing Rust event loop.
Environment confirmation: this runner is macOS Darwin 24.6.0 ARM64 with no
`DISPLAY`, `WAYLAND_DISPLAY`, or `XDG_SESSION_TYPE`; `xvfb-run` is not
applicable. The asset exists at `apps/desktop/dist/plugin-runner.html`, which
matches `tauri.conf.json`'s `frontendDist: "../dist"`. A one-run visible=true
probe with trivial body text showed no native app window/content in a
screen capture; it was reverted. Native webview RPC verification therefore
requires a real interactive desktop session.

**Plugin isolation Phase 2a — protocol/API redesign complete**
ADR-0167 records the required breaking migration before ADR-0166 can be
implemented: the host keeps session descriptors only; plugin lifecycle and
command callbacks stay in a runner and use serializable RPC messages; views
are declarative host-rendered models rather than live DOM; and editor access
is asynchronous with coalesced change notifications. Phase 2b is still the
native shared-plugin-webview/RPC implementation and must not be faked with an
in-main evaluator. Per-view arbitrary HTML/JS surfaces are deferred because
they require additional child webviews and conflict with ADR-0166's one shared
webview cost boundary.

**Plugin RPC plumbing — dispatcher and synthetic host probe active**
`plugin_webview.rs` now forwards arbitrary protocol-1 requests in both
directions, correlates responses by `requestId`, and emits runner requests to
the main webview. `plugin_webview_bootstrap.js` has a concurrent pending map
and generic request/response handling. `pluginRpcHost.ts` implements the
vault/storage host handlers by delegating to `desktopPluginAdapter.ts`.
PluginLifecycleManager and plugin code are intentionally untouched. The host
listener is activated only after a runner and open vault exist; real lifecycle
RPC activation is recorded in the following section.

**Plugin lifecycle RPC migration — implementation pending Ahmed-local verification**
`PluginLifecycleManager` now holds only plugin records and command descriptors;
it requires a `PluginRpcTransport` and sends `plugins.load`, `plugins.onload`,
`plugins.onunload`, and `commands.invoke` through the plugin-runner. Main-side
responses are correlated by `requestId` in `pluginRpcHost.ts`; command-palette
selection calls `manager.invokeCommand(id)`, never a plugin callback. The
runner currently returns stub lifecycle responses and a stub descriptor, not
real plugin execution. `evaluatePluginModule.ts`, views, editor APIs, and the
starter template are untouched. This means old execution-dependent runtime
tests are intentionally skipped until 2b-2d moves code execution into the
runner; the new lifecycle RPC test passes. Ahmed must verify native logs.

**Plugin runner execution — implementation pending Ahmed-local verification**
`plugin_webview_bootstrap.js` now evaluates `plugins.load` source with its
own runner-context `new Function`, constructs and retains the plugin instance
there, and runs real `onload`, `onunload`, and command callbacks. Plugin vault
and storage calls are runner-to-host RPC calls only. The main evaluator now
always throws and has no `new Function`; the manager does not import it. The
runner normalizes the starter's current `name` command field to a descriptor
title. This is not an IPC security boundary yet: Phase 2b-6 still must block
direct custom native invokes from plugin code. Native execution/error behavior
must be checked by Ahmed locally.

**Plugin declarative views — implementation pending Ahmed-local verification**
`PluginView` now returns the structured `PluginViewModel` union (stack, text,
button, and input) and may receive a serializable `PluginViewEvent`; the old
`HTMLElement`/`PluginDom` render contract and host workspace renderer were
removed. The runner retains view callbacks and snapshots models in lifecycle
and command RPC responses. `PluginLifecycleManager` retains only validated
model descriptors, and `PluginViewLeaf` recursively renders them with trusted
React elements. Button/input interactions send `views.event` RPC requests back
to the runner; the returned model replaces the host snapshot. Unknown model
shapes fail closed and are not rendered. A manual
`templates/davinci-plugin-view-rpc-fixture` counter fixture exercises that
path. This phase deliberately does not migrate editor APIs or the starter
template, and does not add IPC authorization. Agent-level typechecks, focused
tests, lint, and production web build pass; Ahmed must verify the real native
round-trip and inspect the rendered DOM locally. A vault with no plugin
directories does not create a runner or host listener, including after a
plugin-bearing vault was previously open.

**Plugin editor RPC — implementation pending Ahmed-local verification**
The plugin-facing `PluginEditor` now exposes only promise-returning snapshot
reads/mutations and `subscribe`; the synchronous CodeMirror adapter is an
internal host-only `PluginEditorHostAdapter`. `PluginEditorRpcHost` routes
`editor.getContent`, `getSelection`, `setContent`, `setSelection`,
`insertText`, `subscribe`, and `unsubscribe` through the existing RPC host.
Snapshots carry content, selection, and a host version; mutations can reject a
stale `expectedVersion`. Host editor document and selection changes use a
100 ms trailing debounce and send one latest `editor.changed` snapshot per
subscription, avoiding a full document RPC per keystroke. The runner owns
plugin callbacks and subscriptions. A manual `rpc-editor-fixture` registers
an async command that reads/appends content and logs notifications. No starter
template migration or command/capability authorization was attempted. Native
round-trip behavior remains Ahmed-local only.

**Plugin starter migration and plugin-runner native-command guard — implementation pending Ahmed-local verification**
`templates/davinci-plugin-starter` now uses the current async RPC surface: its
command writes/reads a vault file, persists/loads plugin data, reads an editor
snapshot, and its status view is a `PluginViewModel` with an RPC-backed button.
Its ignored installable `dist/` was rebuilt.

Every non-RPC application command registered in `lib.rs` now receives the
calling `WebviewWindow` and rejects label `plugin-runner` through
`command_auth::reject_plugin_runner`. This covers vault/filesystem, manifest,
theme-file, Git, Git-PAT keychain, OAuth/Drive-token keychain, and AI-key
commands. There is no custom raw-SQL command in `invoke_handler`; the runner
capability file omits `sql:allow-execute`, while the main-only default capability
contains it. The only unguarded custom commands are the plugin-runner RPC
control plane, which already verifies its sender/target label. Rust checks,
the isolated guard test, serialized Rust tests, and the starter build pass.
Ahmed must run the native adversarial and functionality runbook before this
is considered verified.

**Plugin mediated network API — implementation pending Ahmed-local verification**
`context.net.fetch(url, request?)` is now a serializable RPC API. Enabling a
plugin registers its immutable permission snapshot in the host and returns an
opaque per-plugin capability token; `network.request` requires both that token
and the `network` manifest permission before the main webview fetches with
`credentials: "omit"`. Responses are serializable and capped at 1 MiB.

The runner page has a host-owned deny-all egress CSP (`connect-src 'none'` and
no image/media/frame/worker/object/form/navigation destinations). After the
bootstrap listener is installed, it replaces `fetch`, `XMLHttpRequest`,
`WebSocket`, `EventSource`, worker transports, and `__TAURI_INTERNALS__` with
non-writable `undefined` values; failure to do so reports a bootstrap error
rather than continuing. Plugin evaluator parameters also shadow DOM/network
globals. This does not turn the shared runner into a JavaScript isolate:
plugins can still execute arbitrary code in that runner and may interfere with
one another, which ADR-0166 deliberately leaves out of scope. Shell is already
closed by absence: the manifest has `shell`, but no plugin API/RPC or runner
capability can spawn a process, and host Git/OAuth process commands remain
blocked by the caller-label guard.

Added `security-probe` (no `network`) and `network-probe` (`network`) manual
fixtures. Focused network-host tests, lifecycle test, plugin API/runtime
typechecks, syntax checks, starter build, and production web build pass.
Native behavior must be checked locally, including CSP compatibility with the
Tauri initialization script and actual permitted/denied fetch results.

**Mediated network fetch receiver fix — implementation pending Ahmed-local verification**
`PluginNetworkRpcHost` had captured bare `fetch` as its constructor default,
then called that detached function. WebKit requires `Window` as the receiver,
causing `Can only call Window.fetch on instances of Window` for permitted
network requests. The default is now `window.fetch.bind(window)`; injected
test fetches remain supported. The runner security script never captured or
invoked fetch, so it was not involved. Focused tests (including an owner-bound
fetch) and production web build pass; desktop-wide typecheck is still blocked
by unrelated pre-existing errors. Ahmed must confirm permitted and denied
native fixture behavior locally.

**Plugin discovery — implementation pending Ahmed-local verification**
Discovery previously used `@tauri-apps/plugin-fs` to list
`<vault>/.davinci/plugins` and caught every scope/I/O error as an empty array.
That hid the known dot-directory capability failure and produced the misleading
"No plugins found" UI even when Rust's file tree showed the folders. Discovery
and plugin-data reads/writes now use three caller-guarded Rust commands rooted
at the active `VaultState`, matching theme discovery. `discoverPlugins` logs
the directory list, every manifest read, and each validation outcome.

The Settings store now retains discovery errors and shows them beside installed
plugins rather than converting a bad root or one bad manifest into an empty
list. Four manual fixture manifests were missing mandatory `author` fields;
their templates are corrected, but existing copied vault fixtures must refresh
their manifests once. Focused Rust and desktop/plugin-runtime tests pass.
Desktop-wide typecheck remains blocked only by pre-existing workspace, tree,
Storybook, design-system, and icon errors. Native Settings verification remains
Ahmed-local.

**Theme ecosystem — complete**
The public contract, consumer reconciliation, blocking token guard, permanent
magenta verification utility, four built-in themes, and merged vault discovery
are complete. Light A, Catppuccin Latte, Catppuccin Frappé, and Dark B use
only public tokens; built-ins are available without a vault and their CSS
lazy-loads only when selected. Built-ins are immutable in Settings/registry
UI and win vault-theme ID collisions.

Theme selection is deliberately stored in app-level `localStorage`. This is a
new, scoped app-wide persistence mechanism—the only `localStorage` use in the
app—not an established shared settings backend. It is synchronous and avoids a
dependency, vault I/O, and a wrong-theme flash before React renders. Reconcile
it with a future app-level settings foundation if one is introduced; do not
move it into vault SQLite because selection must restore with no vault open.

When a vault theme collides with a built-in ID, the user sees it in Settings →
Appearance's existing error banner as: `Skipped theme <directory>: Theme ID
collision: <id>; built-in theme takes precedence.` It is not console-only.

ADRs produced by this effort:

- ADR-0163: public `--color-bg-scrim` token for modal and dialog backdrops.
- ADR-0164: public status-tint background/border tokens and `--color-shadow`.
- ADR-0165: lazy built-in CSS loading, app-level restoration, and built-in-wins
  collision precedence.

Theme ecosystem deferred items:

- Rename seven Dialog CSS-module-style selectors currently covered by the
  Stylelint baseline.
- Evaluate consolidating the Settings dialog overlay with the shared
  design-system Dialog overlay.
- Evaluate ignoring `packages/indexer/fixtures/vault/2026-09-20.md`, which is
  app-generated during testing.
- Restore the pre-existing missing indexer fixtures
  `fixtures/vault/projects/alpha.md` and `fixtures/vault/daily/standalone.md`.
  Their test failures predate token reconciliation and are unrelated to theme
  work.
- Reconcile the new app-level `localStorage` selection record only when a
  broader app-level settings persistence foundation exists.

**Stylelint baseline — Dialog selector rename deferred**
The design-system Dialog retains seven CSS-module-style selector names
(`dialogOverlay`, `dialogContent`, and related names) that conflict with the
project's CUBE/plain-class naming rule. They have a narrow documented
Stylelint baseline so current commits remain checkable; renaming the exported
CSS-module contract is a separate candidate task. Settings traffic-light hex
values are documented OS-window-control exceptions in the blocking
public-token guard allowlist.

**Theme discovery — vault-scoped Rust I/O fixed**
Theme discovery no longer calls the Tauri fs plugin for the user-selected
`<vault>/.davinci/themes` dot-directory, which static `allow-exists` scope
rightly rejects. It now uses the existing Rust `VaultState` boundary: native
commands list theme directories and read files only beneath the active vault,
using `resolve_in_vault` to reject traversal and escapes. A missing directory
returns an empty list; any other directory/read I/O error reaches the existing
theme-discovery error UI. No capability JSON was changed and no dependency was
added. Themes deliberately remain vault-scoped at `.davinci/themes`, matching
the existing installer and theme state rather than silently moving packages to
app data. Focused desktop tests (9), Rust filesystem tests (2), desktop lint,
and Rust check pass; the adapter test uses command doubles while the Rust tests
use a real temporary vault. The pre-existing watcher `is_paused` dead-code
warning remains. Native Settings and external-drive acceptance testing remain
open in this environment.

**Unified window controls — implementation complete; visual verification pending**
macOS now uses the same undecorated Tauri window and sidebar-integrated custom
minimize, maximize, and close controls as Windows/Linux. The native traffic
lights and their spacer are removed; controls use the existing compact,
token-based flat styling and move to the tab row when the sidebar collapses.
No dependency or background work was added. Desktop lint and Rust check pass.
UNVERIFIED: macOS visual placement, drag regions, minimize/maximize/close,
fullscreen, and collapsed-sidebar behavior. ADR-0162 supersedes the native
traffic-light portion of ADR-0156.

**External vault change detection — partial implementation; filesystem integration verification pending**
The existing 400 ms debounced Rust watcher now emits paired Markdown/canvas
renames alongside changed/removed paths. Reconciliation no longer suppresses
the watcher while it reads a batch, and it compares the current filesystem
listing with the SQLite `notes` paths under `withDbLock` to repair stale rows
after missed directory events. Workspace tabs are removed/remapped directly so
an external delete cannot trigger a stale save; clean open notes reload from
disk while dirty notes retain local content and set the existing vault error.
No dependency was added. Focused watcher Rust tests, indexer stress tests, and
desktop lint passed. UNVERIFIED: real `mv`, `rm`, `cp`, and append batches in a
live temp vault; folder rename/delete event behavior; native UI conflict/error
visibility; and the required external-batch/full-index/settings/embedding
concurrency regression. Finish these before calling this feature complete.

**Editor font settings — implementation complete; visual acceptance pending**
Editor font size is a 12–28px vault-scoped setting in the existing SQLite
`settings` table. `createEditorSettings` reads and writes it only through
`withDbLock`; the editor uses one `--editor-font-size` variable and calls
`EditorView.requestMeasure()` whenever the active size or document changes.
The settings panel provides a range input, numeric stepper, and reset.

Editor families are an allowlisted registry: System default, Montserrat,
Raleway, and Roboto. Font IDs—not arbitrary CSS—are persisted. The fonts use
the self-hosted, pinned `@fontsource-variable` 5.2.8 packages, each OFL-1.1
with normal/italic variable Latin faces. Dynamic local CSS imports emit
separate chunks; no Google CDN request, `<link>`, or CSP change exists. The
production build emitted Montserrat 37,956 + 39,632 bytes and Raleway 48,264 +
50,244 bytes (raw WOFF2); their CSS chunks are 0.32/0.31 KB (0.17 KB gzip).
The main entry was 390.87 KB / 123.14 KB gzip in the post-change build.

Verified: full desktop test suite (78 files / 269 tests), lint-staged ESLint
and Stylelint, and production web build. The desktop typecheck remains blocked
by pre-existing `vaultUpdateCounter`, FileTree delete return, and design-system
Button color errors. UNVERIFIED on macOS: slider/stepper visual layout, font
switch loading/fallback timing, persistence after restart, no-scroll-jump or
caret loss in a large note, and offline visual network inspection. Deferred:
code-font selector, static settings preview, broader font list, and adding OFL
notices to a future third-party-notices surface.

**Emoji icons — picker layout and persistence wired; sync/rename remap still open**
Selecting an emoji no longer lives only in React state. Markdown notes write `icon`
into YAML frontmatter; folders and non-Markdown files write
`.davinci/icons.json`. Icons reload from those sources when a vault opens.
The Frimousse picker is portaled to `document.body`, constrained in height/width,
and laid out as 8 flex columns so it cannot stretch the sidebar. Tree-row emojis
are capped to `--icon-size-sm`. Focused icon/picker tests pass (23). UNVERIFIED:
native picker in the Tauri window, restart with a real vault, and rename/delete
remap of `.davinci/icons.json` keys. The sync walker still omits that map file.

**Folder rename/delete no-op fix — implementation complete; native visual acceptance pending**
Root causes: folder delete used `window.confirm()`, a browser modal API unsupported by the Tauri webview (the same class of failure recorded in ADR-0058), so cancellation/no dialog prevented any `delete_folder` invoke. Folder rename reached the correct folder wrapper/native command, but failed IPC/index outcomes were silently reduced to `false`/`console.warn`; its descendant-content read also swallowed errors. The fix uses the existing Tauri dialog plugin for native deletion confirmation and visible failure messages, surfaces failed inline folder/note renames, rejects slash-bearing folder names before IPC, and reads descendants before native rename so an unreadable child aborts before the filesystem mutation.

Follow-up: deletion previously waited for every descendant SQLite cleanup before updating workspace state, making the deleted folder remain visible until the full batch finished. After the filesystem command succeeds, it now removes the tree paths and affected tabs from Zustand immediately; the same queued transaction completes the index cleanup afterward. The focused regression confirms the immediate state update.

Second follow-up: the same delayed-state pattern existed in folder rename. This produced stale tree entries such as `New Folder/New Folder` after the native filesystem had already renamed the actual directory to `New Folder/New Folderjkhk`, which then correctly failed native deletion as missing. Folder rename now updates folder/note paths and child tab state immediately after native rename, before the queued descendant re-index. Focused rename/delete tests pass (8/8) and ESLint passes; native visual timing remains UNVERIFIED.

Third follow-up: the sidebar retained a deleted folder as `selectedFolderPath`. Header New Note/New Folder actions reused that missing parent; native writes correctly create parents, unintentionally recreating `New Folder` and nesting future content under it. Successful folder deletion now clears that selection, and the sidebar synchronously falls back to vault root whenever the selected path no longer exists in `allFolderPaths`. Canvas creation already has no selected-parent input and remains root-scoped. Focused folder tests pass (10/10) and ESLint passes.

Native folder command logic is now separately testable command core: recursive delete uses `remove_dir_all`; rename uses atomic `fs::rename`; root, `..`, hidden/system entries, and symlink components are rejected. The command-core tests verified a real temp filesystem rename of a nested note into `résumés 2026` and recursive deletion, plus root/`.git`/traversal/missing rejection. The TS handler tests mock the native dialog and verify cancel does not invoke deletion and a failed delete/rename opens a visible error. Folder index calls remain inside one `withDbLock` + `withDbTransaction`; the only new direct `db.execute` references are the existing link cleanup calls, both inside that callback. No dependency was added.

Verified for real: command-core filesystem behavior; focused TS handler tests; full desktop suite (73 files/242 tests); lint; Rust check. Inferred from source/tests: context menu, F2, Delete/Cmd+Backspace, and Enter/blur route through the same `FileTree` callbacks. UNVERIFIED: native macOS dialog interaction, Tauri console/Rust logs, 2,000-note timing/responsiveness, concurrent full-index/settings/embedding stress, open-unsaved child-tab save behavior, backlinks/tags/graph/quick-switcher visual state, H1-loop behavior, and manual regressions for file rename/delete/new folder/drag-move. Desktop typecheck remains blocked by pre-existing `vaultUpdateCounter` and design-system Button-color errors; `git diff --check` is blocked by the pre-existing extra blank line in `saveTimers.ts`.

**File Tree Context Menu & Folder CRUD Overhaul — implementation complete; native visual acceptance pending**
Completed the 5-task context menu dismissal and folder CRUD overhaul:
1. Fixed menu not closing on click-away (`useContextMenuDismiss.ts` with capture-phase document `pointerdown` to bypass `data-tauri-drag-region`, `Escape`, `window.blur`, and scroll listeners). Added `FileTreeContextMenu.test.tsx` (5 tests).
2. Tailored menu structures for files, folders, and empty space with arrow-key keyboard navigation, shortcut hints (`F2`, `⌫`), danger styling, and suppression on hidden/system files. Extracted `useTreeExpandedFolders.ts` to keep `FileTree.tsx` within line limits (246 lines).
3. Folder-scoped note and folder creation with parent-folder routing, auto-expanding parent trees, and immediate inline rename focus (`pendingRenameNote`/`pendingRenameFolder`). Added `useTreeExpandedFolders.test.ts` (4 tests).
4. Batched folder rename (`renameFolderInVault.ts`) with filename stem validation, collision checks, and descendant note re-indexing in SQLite within a single `withDbLock` + `withDbTransaction` batch. Added `renameFolderInVault.test.ts` (4 tests).
5. Safe folder deletion with native Rust command `delete_folder`, root/system path guards, recursive confirmation dialog, and full descendant note SQLite cleanup (`notes`, `fts_notes`, `links`), tab closure, and graph pruning (`deleteFolderInVault.ts`). Added `deleteFolderInVault.test.ts` (4 tests).
All 71 desktop test files and 239 total unit tests pass; ESLint passes with 0 errors. Native macOS visual click-away on window chrome regions and native prompt dialogs remain UNVERIFIED due to headless execution environment.

**File Tree Drag UI & Drop Feedback — implementation complete; native visual acceptance pending**
Completed the 4-task file tree drag overhaul:
1. Replaced default WebKit drag snapshotting with a synchronous, lightweight flat preview pill (`fileTreeDragPreview.ts`) with Phosphor SVG icon + truncated name + multi-select badge, rendered offscreen and set via `setDragImage`.
2. Pure drop validation (`getDropEffect.ts`) attached to both `dragenter` and `dragover` events to guarantee correct cursor drop effects (`move`/`copy`/`none`) on self, descendants, current parent, hidden entries, root, and file-row parent resolution.
3. Added deferred source row dimming (`opacity: 0.5`, `data-is-dragging="true"`) via `requestAnimationFrame` and window-level `dragend`/`Escape` listeners for reliable cleanup.
4. Added flat drop target styling (`data-drop-target="true"` on folder rows, `data-drop-root="true"` on tree root), container event delegation, 600ms hover-to-expand with cancellation, and reduced motion disabling.
All 25 FileTree tests and 222 total desktop tests pass; ESLint passes with 0 errors. Native macOS visual cursor changes and drag ghost rendering remain UNVERIFIED due to headless execution environment.

**Custom Window Chrome — implementation complete; native visual acceptance pending**
The desktop shell now creates `main` in Rust using the existing 1200×800 and
640×480 dimensions. macOS uses `TitleBarStyle::Overlay`, `hidden_title(true)`,
and native traffic lights at the sidebar-header inset; Windows/Linux use
undecorated custom controls. Sidebar and tab-strip blank-space drag regions
toggle maximize on double-click. The macOS fullscreen hook updates a document
attribute from resize events only, with cleanup and no polling. No dependency
was added.

Focused WindowControls test, desktop lint, web build, Rust check, diff check,
and the desktop Storybook script pass. Desktop TypeScript still fails only on
the known `vaultUpdateCounter` and design-system Badge-color errors. This
macOS session could start the native process but its GUI window was unavailable
to the automated visual surface; manually verify traffic lights, their green
hover menu, dragging, fullscreen spacer collapse, modal click-through, and
collapsed-sidebar behavior. Windows/Linux require native visual testing; only
the platform-independent code was compiled here because no cross targets are
installed.

**Editor scrolling regression fixed**
The window-chrome worktree edit removed `.app-shell`'s grid display and its
bounded `1fr auto` rows. The editor body consequently lost its constrained
height, while its overflow-hidden ancestors clipped a growing CodeMirror
scroller. Restoring the grid makes the existing `.cm-scroller` the sole editor
scroll owner again; no dependency or runtime work was added. Desktop lint and
`git diff --check` pass. Desktop typecheck remains blocked by the known
`vaultUpdateCounter` and Badge-color errors. Native mouse-wheel/trackpad
acceptance could not be automated in this session because the existing dev
server was not reachable from the sandboxed GUI surface; re-run the full
manual scroll matrix in the native desktop app before merge.

**Git Versioning Phase 3 — generic remote credential model complete**
`git2-rs@0.21.0` was evaluated in the real desktop Tauri release build and
rejected despite active maintenance: a real libgit2 call added 645,392 bytes
(630 KiB), so a user who never enables Version History would still pay native
binary cost. The selected system-Git adapter adds no package or Git-engine
binary payload. ADR-0152 records the decision.

`loadGitVersioning()` contains a real dynamic `import()`; there is no static
import merely hidden behind a runtime check.
Phase 0's no-caller build contained no Git-versioning symbols and its main
entry was 368,090 raw / 116,570 gzip bytes. The Phase 1 dynamic bootstrap adds
only 620 raw / 170 gzip bytes to the entry (368,710 / 116,740); scheduler and
invoke code stay deferred until a save. The release binary remains 15,686,544
bytes because the Git engine is external.

The new native initializer creates a valid local `.git` directory with no
remote and writes an ignore policy that stages only `.md` files, excluding
`vault-index.db` and local cache data. The focused Rust test passed directly
against a fresh temporary vault and the desktop staging matrix now runs it on
macOS, Linux, and Windows. Phase 0 persists no version state to
`vault-index.db`, so no additional SQLite queue operation was introduced.

Automatic local history now follows the existing 750 ms save debounce with a
2-second trailing batch window (ADR-0037 precedent). Notes saved near each
other become one real local Git commit, rather than one commit per file.
Messages are `Auto-save: <path>` or `Auto-save: <count> notes: …`; the Command
Palette exposes **Save version now** for an immediate `Saved version: <path>`
commit. The Git work is an async background command guarded by its own Git
operation mutex, never a typing-path operation.

Direct Git tests confirm a two-file batch and a manual version in `git log`.
The adversarial 2.1 MB Markdown edit measured **1.00 ms** maximum JavaScript
input-loop latency during a real `git add` + `git commit` (111 ms total), below
the 50 ms threshold. No version metadata is persisted to `vault-index.db`; the
existing single `withDbLock` queue remains unchanged. ADR-0153 records the
trigger, messages, and granularity decision.

Phase 2 adds a discoverable Version History section to the existing right
sidebar. It shows the active Markdown note's real Git log (newest first), a
readable in-project line diff, and safe append-only restore. Restore writes the
chosen content and creates `Restore: <path> to <short-revision>` rather than
rewriting history; its Git mutex covers the disk write through commit and the
editor receives the restored content without a new dirty save.

Observed verification: a three-commit real vault's history result exactly
equaled `git log --format=%H%x1f%s%x1f%ct -- note.md`, field-for-field and in
order. A separate real Git diff reported `-first` / `+second`, exactly matching
the rendered changed lines. Two sequential restores left the original three
commits intact, added two restore commits on top, and after each restore the
actual disk bytes matched `git show <revision>:note.md`. No version metadata is
persisted to `vault-index.db`. ADR-0154 records these decisions and results.

The web entry is 369,700 raw / 116,940 gzip bytes; the deferred history chunk
is 2,689 raw / 1,188 gzip bytes, with no new dependency. Focused native,
component, diff, lint, and production-build checks pass.

Phase 3 implements one provider-agnostic HTTPS/PAT credential model. The PAT
uses the exact OS-keyring `keyring::Entry` pattern from Drive OAuth
(ADR-0120), under a separate Git service and vault+remote-specific account;
tokens never enter SQLite, web storage, files, command arguments, or Git
config. SQLite stores only remote URL plus optional username via the existing
`withDbLock` + transaction boundary. Its concurrency regression now covers
remote-config persistence alongside indexing, embeddings, settings, and reads
with one active database operation.

GitHub, GitLab, Bitbucket, and self-hosted URL detection returns cosmetic token
help only. The detector has no production consumer in credential or Git code;
all URLs use the same secure-store commands. SSH is deferred because the
unavoidable provider-side public-key registration belongs in the Phase 4 setup
experience. No dependency, UI, remote, fetch, push, or pull was added.

Next: **Git Versioning Phase 4 — easy remote setup UX**.

**AI Features Phase 7 closeout — blocked by production wiring gaps**
The requested end-to-end closeout was re-audited against the current build.
It cannot be marked complete. `App.tsx` imports and invokes
`loadAISubsystem()` during every startup state refresh, so the AI subsystem is
fetched even when AI is never enabled. This violates ADR-0132 and ADR-0146's
runtime lazy-load boundary, despite the implementation remaining outside the
initial entry chunk.

Semantic search, suggested links, and embedding generation are not connected
to production call sites: `App` supplies no semantic callback to
`SearchDialog`, no suggestion props to `RightSidebar`, and
`createEmbeddingIndex()` has no caller. The helpers and component tests exist,
but a real vault cannot populate embeddings or use the first two features.
Ask-your-vault is mounted when ready, but it has no real indexed chunks to
retrieve. This leaves ADR-0140's end-to-end retrieval, consent payload, and
real citation acceptance unverified and blocked independently of the missing
live Tauri/provider environment.

Current local measurements: production entry `365,550` raw / `115,890` gzip
bytes; deferred `AISubsystem` `11,590` / `3,980`, Gemini `2,060` / `980`,
Ollama `1,630` / `780`, embedding store `1,810` / `860`, and Q&A panel
`1,740` / `850` bytes. The real 350-file fixture kept event-loop latency at
`5.27ms`; synthetic 350-note embedding was `2.00ms`; 350-chunk cosine ranking
was `1.24ms`. These are local mocked-provider measurements only, not real
cloud feature latency. Focused packages and desktop tests passed 205 total
(7 embeddings, 2 Q&A, 11 runtime, 185 desktop); desktop web build and lint
pass. Full TypeScript checking remains blocked by unrelated workspace-store
and design-system errors.

**AI providers extended: Gemini, OpenRouter, and Ollama**
The existing provider interface now has real Gemini and OpenRouter cloud
transports plus a local-networked Ollama transport. OpenRouter model slugs are
editable provider settings; Ollama has distinct server/model fields and a
clear stopped-server error. Cloud consent names each provider and explains
OpenRouter forwarding; Ollama skips cloud consent for localhost and warns for
remote URLs. New provider transports remain behind dynamic factory imports.

Focused runtime transport tests pass 10/10 and the consent test passes 2/2.
Live endpoint probes were attempted but Gemini/OpenRouter DNS was unavailable
in this environment and localhost Ollama was not running; therefore no live
success claim is made. Desktop typecheck still has the pre-existing
`vaultUpdateCounter` and design-system Button typing errors.

**Provider-startup SQLite contention fixed**
The provider extension added unqueued settings reads during app startup and
settings reload. Those reads could overlap the indexer's `BEGIN IMMEDIATE` on
the shared native connection. AI consent/provider reads now use the same
`withDbLock` queue as indexing, and connection initialization sets
`busy_timeout` before requesting WAL mode. The contention regression test now
includes a queued provider-style settings read alongside indexing, embeddings,
and settings writes; focused vault tests pass 10/10.

**Ask-your-vault reachability fixed**
The panel was not hidden by consent: the real database has
`ai.consent.ask-vault=enabled`, but Phase 5 never mounted its exported panel
in the app. It is now a lazy right-sidebar section when the selected provider
is ready and the feature is enabled. The Q&A package/provider are loaded only
when a question is submitted; its SQLite retrieval read uses `withDbLock`.
Settings changes now emit the existing AI-state event so the section updates
without a restart. Focused panel/host tests pass 3/3.

**Gemini Q&A stale-ready state fixed**
The real database marked Gemini `ready`, but Q&A could not load a matching
`gemini` Keychain credential. Cloud-provider readiness now requires both the
persisted status and a readable provider-specific Keychain key; an unavailable
credential is recorded as `failed`, the Q&A panel stays hidden, and the user
is directed to reconnect in Settings. No secret fallback was added.

**Vault-index transaction overlap fixed**

**Vault-index transaction overlap fixed**
The two database errors were caused by `VaultIndexer` opening explicit
transactions outside the existing `withDbLock` queue while note/edit and
other top-level writes used the same singleton connection. Remediation A's
chunk-text store did not open a transaction and was not itself the overlap.
`withDbTransaction` is now the sole `BEGIN`/`COMMIT`/`ROLLBACK` owner;
`withDbLock` serializes indexer, embedding, and ordinary vault-index writes.
The original error is preserved if SQLite auto-ended a failed transaction and
the redundant rollback is unavailable. Focused verification passed 28 tests
across 7 vault/indexing files, including concurrent index/reconcile stress and
350-note repeated cycles.

**Follow-up: complete shared-writer audit**
Audited all database mutations and transaction keywords across the codebase.
There are no transaction owners outside `withDbTransaction`; plugin, theme,
CRUD, workspace, and editor-settings writes use the shared `withDbLock` queue.
AI consent/status writes now use it too. `SqliteEmbeddingStore` requires the
desktop queue to be injected for upsert/remove, preventing an unlocked package
write or a second queue. No nested lock call exists: AI disablement is
sequential, editor/plugin/theme callbacks do not re-enter the queue, and
embedding mutations acquire it once per statement.

Verification: the concurrent index-transaction + embedding-upsert + settings
save test completed all writes with maximum concurrent writers of one;
desktop tests passed 181/181, embeddings 7/7, and the full workspace test run
passed all 24 tasks. Desktop lint and embeddings lint/typecheck passed.
Desktop typecheck remains blocked by pre-existing `vaultUpdateCounter`, React
import, and design-system color errors.

**Phase 6 SQLite_BUSY regression fixed**
`AISettingsPanel.reload()` had reintroduced concurrent SQLite calls by loading
three consent settings with `Promise.all` on the singleton connection. Reads
are now sequential, and the App-level cloud-state refresh uses the existing
queue boundary as well. Focused SQLite/indexer stress tests remain 10/10 and
the full workspace suite remains green at 24/24 tasks and 181/181 desktop
tests. Live Tauri reproduction is still unavailable, but the failing Phase 6
concurrency pattern is covered by the code path audit and removed.

## Previous Focus

**AI Remediation C — Citation opener**
The host now reuses `useWorkspaceStore.openNote` and the existing
`PluginEditor.setSelection` wrapper to reveal cited 1-based source lines.
Focused tests cover line 119 of a 120-line note and pass alongside the panel
test (3 tests across 2 files); ESLint and `git diff --check` pass. Remediation C
is closed at the host boundary in ADR-0147. Full manual click-through remains
blocked because `App` does not currently mount the exported Q&A panel and no
live Tauri/provider acceptance environment is available.

## Current Focus (previous)

**AI Features — Phase 7 closing pass blocked on live acceptance and Remediation C**
The subsystem has provider transport, embeddings, vector storage, semantic search, suggested links, ask-your-vault, persisted consent/provider settings, and differentiated cloud indicators. Automated performance and UI checks pass, but the full closeout cannot be marked complete: no configured running Tauri/cloud environment is available for network-level consent, real answer-quality, keychain restart, or citation-opener verification, and Remediation C has no production host opener. The requested `ai-features-build-plan.md` remains absent.

## Last Session

**Tray Phase 2 — close-to-tray setting and unified clean quit**

### Completed
- Added "Keep running in menu bar" setting toggle in General Settings (`GeneralSettingsTab.tsx`).
- Managed `TraySettingsState` with atomic `keep_in_tray` and `is_quitting` flags in Rust (`tray.rs`).
- Disk persistence in `tray_config.rs` (`davinci-tray-settings.json` in `app_config_dir`) with default `true` on macOS.
- Intercepted `WindowEvent::CloseRequested` on the main window in `lib.rs`:
  - If `keep_in_tray` is ON: prevents close, emits `davinci-window-hidden` to flush dirty notes, hides window, and sets macOS activation policy to `Accessory` (hides Dock icon).
  - If `keep_in_tray` is OFF: prevents raw destroy, triggers unified clean quit (`davinci-clean-quit` -> `saveAllDirty()` -> `request_app_exit()` -> stops `VaultWatcher` -> `app.exit(0)`).
- Intercepted `RunEvent::ExitRequested` in `lib.rs`: prevents sudden termination when `code` is `None` (Cmd+Q, app menu Quit, OS shutdown), triggers unified clean quit with 2-second fallback timeout.
- Handled `RunEvent::Reopen` in `lib.rs` on macOS to restore the hidden main window with `Regular` activation policy (Dock icon restored) when clicked or relaunched.
- Unified Tray "Quit" menu item to call `trigger_clean_quit(app)` instead of diverging.
- Added Rust tests `tray_tests.rs` (4 tests) and TypeScript tests in `useTrayMenuActions.test.ts` (5 tests) and `SettingsDialog.test.tsx`.
- Verification: 23 Rust tests pass; all 93 desktop test files (325 tests) pass; ESLint 0 errors; production web build passes.

### Next
- **Tray Phase 3**: Dynamic menu items (recent notes, vault status, active note indicator).

**Tray Phase 1 — menu bar icon with static native menu**

### Completed
- Enabled Tauri `tray-icon` (not `image-png`). Icon is a **placeholder** monochrome note outline (`tray-icon.png` / `@2x.png`); runtime embeds `@2x` RGBA so the `image` crate is not linked.
- `apps/desktop/src-tauri/src/tray.rs` registered from `setup`. Menu: Show/Hide window, New note, Quit. Left click opens the menu (`show_menu_on_left_click(true)`).
- Show/Hide label is static: a live Show vs Hide label would rebuild the menu (Phase 3) and `is_visible` is unreliable with undecorated chrome / Spaces.
- New note: show/focus the window, then the frontend `createNewNote()` path. Quit: `saveAllDirty` then `request_app_exit` → `AppHandle::exit` (not `process::exit`). There was no prior dedicated quit command.
- Dock policy unchanged. Custom close still destroys the window (Phase 2).
- Measurements (debug, same machine): old `target/debug` binary **55,138,280** bytes (3 Oct); after tray-icon **56,398,424** (**+1,260,144**, ~1.20 MiB). First `cargo check` with the feature **35.66s** wall. `image-png` was tried and dropped (~966 KB extra debug). Cold startup / idle memory of a running app were **not** measured (no interactive GUI in this agent session).
- Lint: desktop ESLint 0 errors. Tests: **93 files / 323 passed**. Typecheck: same pre-existing `vaultUpdateCounter` / design-system errors. Only rustup target: `aarch64-apple-darwin` (Windows/Linux `cargo check` not run).
- Phase 0 tray ADR is still missing; this phase did not add close-to-tray or Accessory Dock policy.

### Next
- **Tray Phase 2**: close-to-hide setting. Then Phase 3 dynamic menu.

**Fix "database is locked" unhandled rejection and broken "+" (new file) button in tabs**

### Completed
- **Root-Cause Analysis**:
  - Unhandled promise rejection: `subscribeVaultChanges` passed an unhandled `async (batch) => { ... }` function to Tauri's `listen` event listener with no try/catch. When `reconcileVaultChanges` or `queryFullGraphIndex` encountered `(code: 5) database is locked`, the returned promise rejected unhandled.
  - "+" button doing nothing: `createNoteInVault` wrote to disk, then synchronously awaited SQLite indexing (`persistNote`) before updating workspace state or opening the tab. When the DB was locked, `createNoteInVault` threw, leaving an orphan file on disk with no index row and no tab opened. Furthermore, `AppTabs` was wired to `handleCreateNote`, which invoked `setPendingRenameNote` and stole focus to the sidebar file tree's inline rename input rather than focusing the editor.
- **UI Decoupled from Indexer**:
  - `createNoteInVault` now writes the file to disk via `writeNote`, immediately updates `useWorkspaceStore` (`allNotePaths` and `notesContent`), and dispatches background indexing.
  - Tab opens immediately in milliseconds; UI never blocks or fails due to SQLite lock contention or indexing delays.
  - No orphan files remain unrepresented in workspace state.
- **Retry with Exponential Backoff (`retryOnSqliteBusy`)**:
  - Implemented `retryOnSqliteBusy` in `apps/desktop/src/vault/retryOnSqliteBusy.ts` for idempotent operations, with exponential backoff (up to 3 retries) specifically targeting `SQLITE_BUSY` / `(code: 5) database is locked`.
- **Full Error Handling in `useVaultSession.ts`**:
  - Wrapped `subscribeVaultChanges` handler completely in `try/catch`, added `retryOnSqliteBusy` around `reconcileVaultChanges`, wrapped graph index refresh in `try/catch`, and attached `.catch()` to the listener registration promise. Zero unhandled promise rejections.
- **Tab Bar "+" Wiring & Editor Focus**:
  - Added `handleCreateNoteFromTabs` in `App.tsx` passing to `AppTabs`: creates an untitled note (`Untitled.md`, `Untitled 1.md`, etc.), opens it in a new tab, and focuses the editor without triggering sidebar file tree rename.
  - Added editor focus via `view?.focus()` in `EditorArea.tsx` upon view mounting and active note change.
- **ADR-0169**:
  - Authored `docs/adr/0169-ui-decoupling-from-sqlite-index-and-unhandled-rejection-resilience.md` and registered it in `DECISIONS.md`.
- **Verification**:
  - Added unit test suite `retryOnSqliteBusy.test.ts` (8 tests).
  - Added concurrency & lock robustness suite `newNoteCreation.test.ts` (4 tests) proving: DB held locked note creation, 10 rapid concurrent clicks generating unique files and tabs with no overwrites, note creation while full vault index is running, and independent entry-point verification.
  - All 91 test files and 314 unit tests pass in `@app/desktop`; ESLint passed with 0 errors and 0 warnings.

**File Tree Drag UI, Pure Validation, and Drop Feedback**

### Completed
- **Task 1 (Commit `4933593`)**: Fixed stale drag preview by building a synchronous, lightweight flat preview pill (`fileTreeDragPreview.ts`) with Phosphor SVG icon, truncated filename, and multi-selection badge, rendered offscreen and set via `event.dataTransfer.setDragImage()`. Added `fileTreeDragPreview.test.ts` (3 tests).
- **Task 2 (Commit `30a65a1`)**: Implemented pure drop validation (`getDropEffect.ts`) attached to both `dragenter` and `dragover` events. Purely validates self, descendants, current parent folder, hidden directories (`.git`), valid folders, vault root, and file-row parent resolution. Added `getDropEffect.test.ts` (12 tests).
- **Task 3 (Commit `6e37318`)**: Added deferred source row dimming (`opacity: 0.5`, `data-is-dragging="true"`) via `requestAnimationFrame` (preventing dimming from being captured into the drag image snapshot), `:active { cursor: grabbing; }` (with OS cursor ownership documentation), and global window-level `dragend` / `Escape` listeners for reliable cleanup. Added `useFileTreeDrop.test.ts` (8 tests).
- **Task 4 (Commit `88c51a9`)**: Added flat drop target feedback (`data-drop-target="true"` 1px focus border and background token on folder rows, `data-drop-root="true"` inset outline on tree root), container event delegation, 600ms hover-to-expand delay for collapsed folders with immediate timer cancellation on target change or drag leave, and `prefers-reduced-motion: reduce` transition disabling.
- Added ADR-0157.
- **Verification**: All 25 FileTree tests and 222 total desktop unit tests pass; ESLint passes with 0 errors. Native macOS visual cursor changes and drag ghost rendering remain UNVERIFIED due to headless execution environment.

### Next
- Manual visual acceptance of drag preview pill, grabbing cursor, folder drop outlines, and hover-to-expand in a running macOS Tauri GUI session.

**Git Versioning Phase 1 — automatic local version history**

### Completed
- Added automatic 2-second post-save batching after the existing 750 ms editor
  save debounce. A batch stages only its saved Markdown paths and creates one
  readable local Git commit; no commit runs per keystroke.
- Added useful automatic messages and the Command Palette **Save version now**
  action for an immediate manual commit.
- Moved native Git work into an async `spawn_blocking` command and serialized
  the complete init/stage/check/commit operation with a Git mutex. No SQLite
  state or second database queue was introduced.
- Verified actual fresh-vault Git logs for multi-note auto and manual commits;
  scheduler/desktop/Rust tests pass. A 2.1 MB real Git commit held maximum JS
  input-loop latency to 1.00 ms (111 ms total), below 50 ms. Added ADR-0153.

### Next
- Git Versioning Phase 2: local history list, readable diffs, and safe restore;
  do not add remotes or credentials.

**Git Versioning Phase 0 — Git engine and local-only architecture**

### Completed
- Evaluated `git2-rs@0.21.0`: active release/issue activity and an actual
  Tauri release build, but a real `Repository::open` call measured +645,392
  bytes (+630 KiB). Rejected because dynamic JavaScript loading cannot remove
  statically linked libgit2 from the desktop binary.
- Added the dependency-free system-Git initializer and a deferred TypeScript
  loader. A fresh vault becomes a valid, remote-free repository with no manual
  Git command; the test confirms staged content is only Markdown and generated
  index/cache files are excluded.
- Confirmed offline operation directly (init, remote inspection, staging, and
  cached diff with zero remotes) and added that test to every desktop staging
  platform job.
- Verified desktop web build, focused Rust test, `cargo check`, and release
  build. Existing Rust dead-code and Sass deprecation warnings remain
  unrelated. Added ADR-0152 and indexed it.

### Next
- Git Versioning Phase 1: implement debounced automatic local commits without
  blocking typing; verify the real local log and input latency.

**AI Features Phase 7 — Performance and Regression Closeout**

### Completed
- Audited the complete AI bundle graph. The initial entry measured `363,212` raw bytes / `114,995` gzip and contained no AI provider, transport, embedding, vector, settings-panel, Q&A, or indicator symbols. Deferred AI chunks measured `8,139` bytes for `AISubsystem`, `3,092` shared support, and `276` for the indicator. Added ADR-0146.
- Ran the real 350-file large-vault fixture through the embedding scheduler. The event-loop/input latency measured `2.83ms`, below the 50ms test threshold; the package test passed.
- Re-ran automated checks: `@app/ai-qa` `2/2`, `@app/ai-runtime` `5/5`, `@app/ai-embeddings` `7/7` including the real-file benchmark, desktop AI/status tests `6/6`, lint, Rust `cargo check`, and web build passed.
- Audited the decision index. ADR-0140 remains unchanged; ADR-0142 covers Remediation B, ADR-0144 now records Remediation A, and ADR-0145 records Remediation C as still blocked. No separate A/B/C follow-up ADRs existed before this audit.
- Blocking verification: semantic/suggest latency at real provider scale, network-level per-feature payload tests, live consent/revocation sequence, real model citation correctness, Tauri keychain restart, and clicking a citation into the correct note/location could not be performed without a configured running Tauri/cloud environment. These are explicit blockers, not passed by mocks.
- Next: provide a real Tauri acceptance environment, wire the canonical citation opener, then rerun Phase 7 before declaring the AI plan closed.

**AI Features Phase 6 — Settings, Provider Management, and Cloud Indicator**

### Completed
- Extended the existing Settings dialog with AI provider management. Cloud is available; local is accurately unavailable per ADR-0133. API keys continue through the ADR-0120 keychain flow, and failed validation is persisted as a visible provider status.
- Added independent controls for semantic search, suggested links, and ask-your-vault. Cloud consent remains a prerequisite; disabling cloud clears all feature consent and the secure key.
- Added ADR-0143. The existing status bar shows `Cloud AI ready` at rest and `Cloud AI transmitting` around Q&A provider requests. It loads persisted cloud consent on launch and updates immediately on settings changes.
- Verification: `@app/ai-qa` tests `2/2`, `@app/ai-runtime` tests `5/5`, embeddings tests `6/6`, desktop Q&A/consent/status tests `6/6`, lint, Rust `cargo check`, and desktop web build passed. Full desktop typecheck remains blocked by existing workspace errors; live Tauri keychain/restart acceptance is still unavailable.
- The required second human review of the indicator wording remains open. Phase 7 should review the copy and wire the persisted feature toggles into every production search/suggestion call site.
- Next: Phase 7 performance and regression pass.

**AI Features Phase 5 — Ask-Your-Vault Q&A**

### Completed
- Added `@app/ai-qa` retrieval/generation using the existing `SqliteEmbeddingStore` and `AIProvider.embed`/`complete` boundaries. Retrieval is capped at eight chunks: enough context for grounded answers while bounding cloud disclosure per query.
- Ask-vault checks its own consent callback before any embedding request. Cloud consent alone does not authorize ask-vault, preserving ADR-0135's granular model and ADR-0140's higher-exposure checkpoint.
- Added migration v5 to retain chunk text in `embedding_chunks`; v4 was not edited. Citations are projected from the exact retrieved rows used to build the chat request, including note path, heading, and line range.
- Added lazy `AskYourVaultPanel` UI with a visible `Cloud AI active` indicator, answer/error states, and clickable source callbacks. No React or provider internals leak into the Q&A package contract.
- Verification: `@app/ai-qa` typecheck/lint/tests passed (`2/2`); panel and consent tests passed (`3/3`); existing embeddings tests passed (`6/6`); Rust `cargo check` passed; desktop web build passed.
- Live adversarial questions against the large vault, network-level exact payload inspection, valid cloud answer quality, invalid-key UI through Tauri, and source-note navigation were not honestly claimable in this environment because no running configured Tauri session/provider credential was available. These are acceptance blockers, not silently replaced with mock quality claims.
- Next: Phase 6 settings/provider management UI, including durable provider status, feature toggles, reauthentication/error actions, and real Tauri acceptance tests.

**AI Features Phase 5 — Gap 1: Cloud Transport, Key Flow, Consent Persistence**

### Completed
- Added `OpenAICompatibleTransport` behind the existing `AIProvider` interface. Defaults are OpenAI-compatible `/v1`, `text-embedding-3-small`, and `gpt-4o-mini`; endpoint/models remain configurable because Phase 0 did not name a vendor. No HTTP dependency was added.
- Added real Tauri Rust `keyring` commands using a separate `com.davinci.notes.ai-provider` service and provider-id account, plus lazy desktop adapters and a minimal consent-first/key-validation flow. Keys never enter SQLite, localStorage, or files.
- Added namespaced persisted consent for cloud, semantic search, suggest-links, and ask-vault. Disable-all writes sequentially to preserve the existing SQLite write discipline.
- Verification: `@app/ai-runtime` tests passed `5/5`; runtime typecheck passed; Rust `cargo check` passed; desktop web build passed. The production assets totaled `8,283,088` bytes; the base entry remained free of AI transport/provider/key/consent symbols, while the deferred `AISubsystem` chunk was `6,331` bytes, confirming the lazy boundary. Desktop full typecheck remains blocked by pre-existing `vaultUpdateCounter`, design-system color, and older SearchDialog fixture typing errors.
- Live valid-provider success, OS-keychain restart persistence, and real Tauri consent restart verification remain environment-dependent because no running Tauri session/provider credential was available. Invalid/rate-limit/server/network behavior is covered by actual transport tests with HTTP responses and rejected fetches. The user-supplied key was not logged, stored, bundled, or used.
- Added ADR-0141 and ADR-0142. ADR-0140 itself was not edited. Remaining blockers are durable chunk text and a production source-location opener.

**AI Features Phase 5 — Ask Your Vault**

### Completed
- Extended the existing content `SearchDialog`, not the Cmd+K fuzzysort quick switcher, with an opt-in `Exact`/`Semantic` mode.
- Reused the existing `150ms` search debounce and added a three-character minimum for semantic provider calls. Semantic rows show a distinct `Semantic match` label and heading/source-line location.
- Added `searchEmbeddings()` to the lazy-loadable embedding package. It embeds the query through `AIProvider.embed` and queries Phase 2's `SqliteEmbeddingStore`.
- Added ADR-0138 for mode placement, consent visibility, threshold, and result distinction.
- Verification: embedding package typecheck/tests pass (`6/6`); SearchDialog tests pass (`3/3`) with jsdom; Cmd+K component tests remain passing. AI-disabled mode renders no semantic control, and enabled mode invokes the semantic callback. Real note-content relevance results remain blocked on missing provider transport/vector population from Phase 0.
- Added `suggestLinks()` with independent feature gating, 450ms embedding-aligned debounce, top-5/0.78 starting defaults, and current-note exclusion.
- Added `SuggestLinksPanel` below backlinks in the existing right sidebar. It renders nothing when disabled or empty and inserts `[[vault/path.md]]` through the existing editor adapter insertion boundary.
- Added ADR-0139. Verification: embedding package 6/6 tests, SearchDialog 3/3 tests, Cmd+K 2/2 tests, and insertion test 1/1 pass. Real threshold trials and relevance results remain blocked on the missing live provider transport/vector population.
- No Q&A runtime or UI was added. Shipping one would either bypass the required distinct consent gate, send empty retrieved context, or invent a parallel source-text lookup.
- Added proposed ADR-0140 with the consent, retrieval-N, exact-transmission, citation, and error-state contract. It is indexed in `DECISIONS.md`.
- Blockers to clear before implementation: real provider/key transport and feature-state persistence from Phase 0, plus chunk-text persistence/source resolution from Phase 2. Phase 6 settings/provider management follows after those are resolved.

## Last Session

**AI Features Phase 2 — Vector Storage and Indexing**

### Completed
- Evaluated sqlite-vec's current activity, Rust packaging, extension loading, open integration issues, and portability risks. It remains pre-v1 and does not cleanly integrate with the app's `tauri-plugin-sql` connection, so no native extension dependency was added.
- Added migration v4 for `embedding_chunks` in the existing `vault-index.db`; v1 remains frozen. Existing WAL, `synchronous=NORMAL`, `busy_timeout`, and serialized write-lock behavior remain unchanged.
- Added `SqliteEmbeddingStore` for packed Float32 BLOB persistence and application-side cosine ranking, retaining Phase 1 chunk IDs, citation locations, hashes, and model IDs.
- Verification: migration schema applied in SQLite CLI with `WAL`, `synchronous=NORMAL`, and `busy_timeout=10000`; package typecheck/lint and 6 tests pass. At 350 chunks, cosine ranking measured `0.67ms` against the existing `<5ms` interactive responsiveness target. This is fixture-scale only, not a claim for many-thousand-chunk vaults. The existing JS DB lock and WAL path remain unchanged; concurrent read/write coverage is limited to the existing lock/PRAGMA design because Tauri's live connection is unavailable in the package test runner.
- Next: Phase 3 semantic search UI, with a larger corpus benchmark before search-as-you-type guarantees.

## Last Session

**AI Features Phase 1 — Embedding Infrastructure**

### Completed
- Added `@app/ai-embeddings` with heading/paragraph chunking, source note/heading/line metadata, bounded 2,000-character windows, incremental content-hash reconciliation, model-tagged vectors, and stale-chunk removal.
- Wired generation through the Phase 0 `AIProvider.embed` method. The scheduler coalesces note bursts at the existing vault watcher `450ms` settle boundary, uses the existing indexing batch size of `50`, and yields after each provider batch so editor work is not blocked.
- Added `createEmbeddingIndex()` behind `AISubsystem`'s dynamic import. The initial Vite entry/modulepreload graph remains free of AI subsystem symbols; embeddings are not statically imported by app startup.
- Added unit fixtures for heading/paragraph locations, one-chunk incremental regeneration, stale-key handling, and watcher-boundary coalescing.
- Added ADR-0136 covering chunking, citation mapping, dedicated embedding model choice, hash invalidation, and batching.
- Verification: `@app/ai-embeddings` typecheck, lint, and 4 tests pass. The 350-note fixture contains 350 notes; spot checks produced one heading-scoped chunk per sample note. The multi-batch event-loop probe measured `0.85ms` input latency. An edit changed only `a.md#root:3:3:0:0` after the initial IDs `a.md#root:1:1:0:0` and `a.md#root:3:3:0:0`. The desktop web entry remains `361,530` raw bytes / `114,530` gzip, with zero AI symbols in `dist`; the Phase 0 cloud-only launch decision remains unchanged. Vector storage/querying is next, including sqlite-vec evaluation.

## Last Session

**Theme Ecosystem Phase 2 — Local Loader and Settings**

### Completed
- Added theme discovery and malformed-manifest isolation in [discoverThemes.ts](apps/desktop/src/themes/discoverThemes.ts), using the Phase 1 `@app/theme-api` schema validator.
- Added [ThemeLifecycleManager.ts](apps/desktop/src/themes/ThemeLifecycleManager.ts) with one active theme, persisted active ID, append-before-remove stylesheet replacement, stale-switch generation guards, and cleanup on unload.
- Added the Tauri adapter for `<vault>/.davinci/themes` and SQLite active-theme persistence, then initialized it with the same vault lifecycle used by plugins.
- Added [ThemeSettingsList](apps/desktop/src/components/ThemeSettingsList/ThemeSettingsList.tsx), a separate settings component following the existing `PluginSettingsList` pattern. It lists name/ID/version, selects a theme, restores default styling, and reports skipped folders.
- Phase 1's single-stylesheet light/dark decision is honored. The current app has no independent light/dark setting; its base stylesheet remains dark, so no separate mode-switch integration was possible in this phase.
- Verification: theme manager tests pass for malformed discovery isolation, computed-style A/B switching, return to base styling, and rapid repeated switching with exactly one injected style node. Settings component tests pass for activation and error display. `@app/theme-api` tests (6) and desktop lint pass. Full desktop typecheck remains blocked by the pre-existing `vaultUpdateCounter` and design-system color typing errors.
- No CSS content restriction was added; that remains Phase 3. The ambiguous/inconsistent token aliases documented by Phase 1 were not silently refactored.

**Theme Ecosystem Phase 3 — CSS Safety Review**

### Completed
- Reviewed the actual Phase 2 injection boundary and documented decisions for external `url()`, external `@import`, and CSS-only DOM-state exfiltration in [theme-css-safety.md](docs/theme-css-safety.md).
- Chose documentation plus Phase 4 registry review rather than a load-time sanitizer. This preserves legitimate fonts/images, avoids a parser dependency and foreground switch cost, and avoids a brittle regex filter that could be bypassed.
- Registry review is stricter for external imports: reject them by default because imported CSS can change after approval. Review all external URLs and reject tracking identifiers or state-encoding beacons.
- Added a fixture test proving the Phase 2 loader preserves an external font/image URL and external import unchanged, making the documented behavior executable. No runtime enforcement was added.
- CSS-only exfiltration is considered lower risk than plugin code but non-zero because app metadata exists in DOM attributes; selectors and beacon-like URLs must be reviewed manually.
- Verification: theme API tests (6), theme loader/settings tests (6), desktop lint, and `git diff --check` pass. Full desktop typecheck remains blocked by unrelated existing workspace errors.

**Theme Ecosystem Phase 4 — Registry and Browser Integration**

### Completed
- Extended the local registry seed format with `themes` alongside `plugins`, and extended the submission README with theme release and CSS review requirements.
- Generalized the existing GitHub release-resolution boundary so plugin and theme entries share repository parsing, `versions.json` compatibility resolution, HTTP client, and archive extraction.
- Added theme archive inspection/validation against `@app/theme-api`, `minAppVersion` and release ID/version checks, stylesheet presence checks, safe staged installation under `.davinci/themes`, and uninstall.
- Added the Theme Registry browser section. Installing confirms and auto-activates the theme; updates reuse the same path; uninstall deactivates an active theme first and reloads discovery so default styling returns.
- Existing plugin browser code continues using the same registry client and plugin install path; registry parser and plugin release tests remain passing.
- Verification: theme API tests (6), registry tests (3), theme lifecycle tests (4), settings tests (2), desktop lint, and `git diff --check` pass. Full desktop typecheck remains blocked by unrelated workspace `vaultUpdateCounter` and design-system color typing errors.
- The dedicated GitHub registry could not be cloned or updated in this session because DNS/network access was unavailable. The remote catalog was previously an empty plugin-only catalog; real theme entry, release, install, update, and uninstall verification remain open until that repository is updated with a test theme.

## Last Session

**AI Features Phase 0 — Provider, Privacy, and Consent Model**

### Completed
- Added dependency-free `@app/ai-api` contracts for `embed` and `complete`, capability/mode metadata, `AIProviderError` codes, and `AISecretStore`; added delegating `CloudAIProvider` and `LocalAIProvider` adapters in `@app/ai-runtime` without inference code.
- Added `loadAISubsystem()` with a genuine dynamic import and kept it out of the app startup import graph. Consent UI is exported only from the dynamically imported subsystem.
- Added ADRs [0132](docs/adr/0132-ai-provider-abstraction-and-lazy-load-boundary.md), [0133](docs/adr/0133-local-ai-model-feasibility-gate.md), [0134](docs/adr/0134-ai-cloud-consent-flow.md), and [0135](docs/adr/0135-ai-feature-granular-consent.md), all indexed in `DECISIONS.md`.
- Local-model gate: embedding-only `nomic-embed-text-v1.5` Q4_K_M is 84.1 MB, Qwen2.5 3B Q4_K_M is 1.93 GB with weaker chat quality, and Qwen2.5 7B Q4_K_M is 4.68 GB with better quality but unsuitable as a default burden for ordinary 8 GB-class machines. Full local inference is deferred; cloud is the only launch option.
- Consent is blocking and provider-named, states what leaves the device, says on-device AI is unavailable, and is reversible. Feature consent is granular across semantic search, suggest-links, and ask-vault.
- API keys must use the existing ADR-0120 Tauri Rust `keyring` pattern in a separate AI namespace; no second persistence path was introduced.
- Bundle verification: `pnpm --filter @app/desktop build:web` passed. Default entry plus modulepreloads measured 1,376,898 raw bytes / 435,482 gzip; no AI-specific provider, consent, loader, or model strings appeared in `apps/desktop/dist`.
- Verification: `@app/ai-api` typecheck/lint/tests (2) passed, `@app/ai-runtime` typecheck/lint passed, consent tests (2) passed, desktop lint passed, and the production build passed. Full desktop typecheck remains blocked by existing `vaultUpdateCounter` and design-system color typing errors.
- The expected `plans/ai-integration-plan/ai-features-build-plan.md` does not exist in this checkout; this session used the task specification as the scope authority and did not infer missing earlier decisions.

## Previous Session

**Plugin Ecosystem Phase 7 — Publishing Template**

### Completed
- Added `registry/plugins.json` and `registry/README.md` documenting the dedicated GitHub registry, author-owned release repositories, PR submission, and lightweight validation requirements.
- Added registry parsing, GitHub release/`versions.json` compatibility resolution, ZIP archive validation, install, update, and uninstall helpers.
- Added `PluginBrowser` to Settings. It has loading/offline states, install consent with Phase 5 permissions, update detection, and unload-before-reload/uninstall lifecycle handling through `PluginLifecycleManager`.
- Added archive checks for safe plugin IDs, manifest ID/version matches, `minAppVersion`, required main entry, and archive path traversal.
- Verification: plugin-api 20 tests pass; plugin-runtime 11 tests pass with lint/typecheck; registry resolver 2 tests pass; desktop lint passes. Full desktop typecheck remains blocked by the pre-existing workspace `vaultUpdateCounter` and design-system color typing errors.
- Real external install/update/uninstall verification remains blocked until a published test plugin and registry repository entry are supplied.
- Populated and pushed `https://github.com/AhmedWanneni/davinci-notes-plugins` at commit `c2ebdca` with `plugins.json`, `registry.schema.json`, submission README, dependency-free validation, and GitHub Actions CI.
- Repointed the browser from the placeholder owner to `https://raw.githubusercontent.com/AhmedWanneni/davinci-notes-plugins/main/plugins.json`. The format and fetch mechanism did not need redesign.
- The real registry fetch returns the committed empty catalog successfully. Install and plugin-loader verification remain blocked because the registry has no test entry or author release artifact yet.
- Added the starter plugin with a visible command that writes and reads a vault file, plus TypeScript build and packaging scripts using only a development-time TypeScript dependency.
- Verified the README workflow: fresh `npm install` and `npm run build` produced `dist/manifest.json`, `dist/main.js`, and `dist/versions.json`; the compiled command registered and completed a vault round-trip; a temporary integration test loaded the built package through `PluginLifecycleManager` and invoked its command successfully; the files were copied into the Phase 2 `.davinci/plugins/sample-vault-command/` layout; and a release ZIP was created and inspected.
- No scaffolding CLI was added; the template is the single source of truth. The template surfaced a publishing/API gap: `@app/plugin-api` is not currently distributed as an external SDK, and the loader injects `DavinciPlugin` as a runtime global, so the starter carries a small ambient declaration for the demonstrated surface.

## Previous Session

**Plugin RPC Phase 2b-2a follow-up — synthetic host plumbing activation**

### Completed
- Wired the main-side `listenForPluginHostRequests` subscription from `usePluginStore.initPlugins`, but only when the explicitly probed `plugin-runner` webview exists. The host listener is dynamically imported and cleaned up when the vault changes.
- Added the `DAVINCI_PLUGIN_RPC_SYNTHETIC=1` probe trigger. After the listener is registered it asks the runner to issue one `vault.read` and three overlapping `vault.read` calls through `window.__davinciPluginRpc.request`; responses remain correlated by request ID.
- Added notification logging for the single and concurrent results and kept the zero-plugin path free of runner/listener creation.
- Rust check, desktop ESLint for the touched TypeScript modules, and the production web build pass. Native GUI execution remains unverified in this agent environment; Ahmed must run the supplied local runbook.

**Plugin Ecosystem Phase 5 — Permission Enforcement**

### Completed
- Added `PluginVault`, `PluginCommands`, and `PluginSettings` contracts and exposed `vault`, `commands`, and `settings` on `DavinciPlugin`.
- Added runtime path validation, command/settings registries, lifecycle cleanup, and desktop adapters.
- Wired plugin commands into the existing lazy command palette and declarative settings tabs into Settings.
- Added fixture coverage for vault round-trip, traversal rejection, restart persistence, per-plugin data isolation, unload/re-enable registry behavior, and watcher write-loop behavior.
- Verification: plugin-api 20 tests pass; plugin-runtime 8 tests pass and lint passes; focused desktop palette/settings tests 5 pass. Full desktop typecheck remains blocked by pre-existing workspace `vaultUpdateCounter` and design-system color typing errors.
- Added `workspace.registerView/openLeaf/closeLeaf/focusLeaf/isViewOpen`, a host-owned plugin leaf, and DOM-only `createEl`/`createText` helpers. Disabled plugins tear down their mounted view.
- Added wrapped editor content, selection, insertion, and content-change APIs. The wrapper never exposes `EditorView` or `EditorState`; CM6 syntax, extensions, transactions, commands, decorations, history, and view plugins remain intentionally unwrapped.
- Added the combined DOM/editor fixture and real CM6 adapter test. Runtime: 9 tests pass; editor adapter: 1 test passes; plugin-api: 20 tests pass. Full desktop typecheck remains blocked by the same pre-existing errors.
- Added centralized permission mapping and call-boundary enforcement: vault read/list, vault write/delete, commands, settings, workspace, and editor read/write operations each map to explicit manifest permissions.
- Added immutable permission snapshots to prevent mid-session manifest mutation from escalating privileges. Added requested-permission visibility to the installed plugin settings list.
- Added adversarial fixtures covering no-permission denial, declared-permission success, escalation attempts, traversal regression, and command cleanup on disable.
- Verification: plugin-runtime 11 tests pass with lint/typecheck; plugin-api 20 tests pass. Focused desktop settings tests pass. Full desktop typecheck remains blocked by pre-existing workspace `vaultUpdateCounter` and design-system color typing errors.
- **`DavinciPlugin` base class**: Added to `packages/plugin-api/DavinciPlugin.ts`, re-exported from `@app/plugin-api` index. Two lifecycle hooks: `onload()` and `onunload()`.
- **`packages/plugin-runtime`** (new package):
  - `pluginTypes.ts`: `PluginRecord`, `PluginStatus`, `PluginFileSystemAdapter`, `PluginStateStorage`, `PluginConstructor`.
  - `evaluatePluginModule.ts`: Safe `new Function(…)` evaluator; extracts `module.exports` / `export default` class extending `DavinciPlugin`.
  - `discoverPlugins.ts`: Scans plugin dirs, validates manifests, detects ID collisions (rejects second, keeps first).
  - `PluginLifecycleManager.ts`: Full enable/disable/unloadAll, `onStateChange` subscription, enabled-IDs persistence, error isolation.
  - `index.ts` barrel + `pluginLifecycle.test.ts` (6 adversarial fixtures: crashing `onload`, malformed manifest, ID collision, mid-session disable, re-enable cycle, restart persistence).
- **Monorepo wiring**: `tsconfig.json` `@app/plugin-runtime` path, `.eslintrc.js` `plugin-runtime` element + boundary rules, `apps/desktop/package.json` + `vite.config.ts` aliases.
- **Desktop Settings UI**: `PluginSettingsList` component + `.module.scss` + barrel + 3 jsdom tests; wired into `SettingsDialog` with `Divider`. `usePluginStore` (Zustand) initialises on vault open in `App.tsx`.
- **Desktop adapter**: `desktopPluginAdapter.ts` implements `PluginFileSystemAdapter` (Tauri plugin-fs `readDir`/`readTextFile`) and `PluginStateStorage` (SQLite `enabledPlugins` setting).

## Next Up (in order)

1. **Web Clipper Phase 3 (part 2) — the TS/UI half of the desktop receiver**: Phase 3 part 1 (the Rust core) is done and inert; the listener is reachable only through `clipper_enable`. Now wire it up: `apps/desktop/src/clipper/clipperService.ts` listens for `clipper:clip-received`, calls the canonical helpers (`createNoteInVault`, new `appendToNoteInVault`) and returns the outcome through `clipper_submit_result`; the Settings "Web Clipper" section (enable toggle, show/copy the token, the bound port, rotate, revoke) with stories + tests. `appendToNoteInVault` must **create** the note when the target is missing (documented outcome for plan §5 check 5; never truncate). Any step that touches vault-index.db must follow the standing withDbLock/WAL concurrency rules. Owner-local: real-browser clip timing and native GUI checks for Phases 2a/2b/3. Then plan Phases 4–8.
2. **Web Clipper Phase 3 (part 3) — extension transport**: `saveNote` in `apps/web-clipper`'s `clipSessionDeps` seam posts to loopback (narrow `http://127.0.0.1/*` host permission; no CORS on the desktop side), so the "Add to DaVinci Notes" button goes live, plus the closed-app queue (ADR-0178).
3. **Editor styling tokens Phase 3**: Consume the approved `--editor-obsidian-*` tokens without redefining the legacy editor token set.
4. **Tray Phase 3**: Dynamic menu items (recent notes list, active note name, vault status).
5. **Git Versioning Phase 2**: add local history/diff UI and safe restore against the real local Git log; no remotes.
6. **Resolve AI Phase 5 blockers**: add real provider/key transport and consent-state persistence; extend vector storage with chunk text/source resolution before ask-your-vault or Phase 6 settings.
7. **Manual Re-Test of OAuth Sign-In**: Execute interactive OAuth sign-in flow and verify consent display shows both `drive.file` and `drive.appdata` permissions, token presence in OS keychain, refresh/restart persistence, and sign-out deletion.
8. **Stabilization pass Phase 1** (`plans/stablize.md`): dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
9. **Plugin Ecosystem Phase 8**: Publishing a real sample plugin and adding its verified registry entry.
10. **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
11. **Unlinked Mentions Detection**
12. **Inline Property Editing**
13. **Outline Scroll Synchronization**
14. Add success/warning semantic color tokens
15. Chromatic / Playwright screenshot regression

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.
- **AI feature plan artifact**: `plans/ai-integration-plan/ai-features-build-plan.md` is missing; recover it before treating any undiscovered prior AI decision as authoritative.
- **Web Clipper decisions (Proposed, need owner input)**: transport (ADR-0173), extraction budget (ADR-0174 — the measured size is now ~100 KB gzip for Defuddle core + Turndown, not the 86.4 KB bundlephobia figure, and the browser popup costs another ~71 KB gzip for React + the design system, taking the popup chunk to 170,650 B gzip; the owner has not yet accepted either cost), popup data flow (ADR-0179 — draft vs payload and the template-switching split), the **page-size cap** (the plan's 2 MiB belongs to the Phase 3 transport; nothing caps capture today), attachments phase placement, multi-vault semantics, pairing UX, queue caps, token storage, and Reader/Interpreter/logic scope. Full list in `web-clipper-feature-plan.md` §10. The `tauri-plugin-deep-link` Rust ≥ 1.90 check **is done** (Phase 3 part 1): it needs 1.90 against the declared `1.77.2` and macOS schemes are install-time only, so the deep link stays deferred and the transport is loopback-only + manual pairing (ADR-0173, "Phase 0 verification outcome"). Still owner-approved-by-default only: the 2 MiB body cap and the per-field caps in `clipper_validate.rs` (ADR-0180, "Open decisions") and whether `clipper_status`/`ack` are the final Settings API.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.
