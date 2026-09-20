# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

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

**Emoji icons — Task 1 library boundary complete; Tasks 2–5 next**
Frimousse `0.3.0` (MIT, React peer `^18 || ^19`) and pinned
`emojibase-data@17.0.0` (MIT) replace the rejected emoji-mart option. The
desktop build/dev preparation script copies only English `data.json` (775,157
raw / 98,003 gzip bytes) and `messages.json` (6,499 raw / 1,595 gzip bytes)
from the installed package to ignored local static assets. Frimousse fetches
those two files after its root mounts; it provides search, categories, skin
tones, keyboard navigation, virtualization, local cache, and native-support
filtering. The picker component remains to be wired lazily in Task 4, so its
final emitted-chunk measurement and offline picker interaction remain
UNVERIFIED. The existing Tauri CSP is `null` before and after; no remote origin
was permitted. ADR-0159 records this decision. The current sync manifest does
not include `.davinci/icons.json` because its Rust manifest walker only includes
known note/media extensions; Task 3 must add an explicit sync-safe path and a
per-key conflict merge rather than whole-file last-writer-wins.

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

**File Tree Context Menu, Click-Away Dismissal, and Folder Actions (CRUD)**

### Completed
- **Task 1 (Commit `1946c6a`)**: Identified root cause of unclosable context menu (hand-built `div` with absolute positioning lacking outside click/blur/escape listeners). Implemented `useContextMenuDismiss.ts` with capture-phase document `pointerdown` (so `data-tauri-drag-region` does not swallow dismissal events), Escape key, window blur, and scroll listeners. Added `FileTreeContextMenu.test.tsx` (5 tests).
- **Task 2 (Commit `854cbe6`)**: Added structured menu options for files (`Open`, `Rename`, `Duplicate`, `Delete`), folders (`New note`, `New folder`, `Rename`, `Delete`), and root empty space (`New note`, `New folder`). Added arrow-key navigation (`ArrowUp`/`ArrowDown`/`Home`/`End`), shortcut hints (`F2`, `⌫`), danger styling, and suppression on hidden/system entries (`.git`, `.obsidian`). Extracted `useTreeExpandedFolders.ts` to keep `FileTree.tsx` ≤ 250 lines (246 lines).
- **Task 3 (Commit `b1135ed`)**: Implemented folder-scoped note and folder creation. Updated `createNewNote` and `createNewFolder` to accept parent folder paths, auto-expand parent tree branches, and immediately trigger inline rename focus via `pendingRenameNote` and `pendingRenameFolder`. Added `useTreeExpandedFolders.test.ts` (4 tests).
- **Task 4 (Commit `8fd4891`)**: Implemented batched folder rename in `renameFolderInVault.ts` with filename stem validation, illegal character replacement, collision detection, and atomic descendant note re-indexing in SQLite within a single `withDbLock` + `withDbTransaction` batch. Migrated save timers, dirty note buffers, and open tabs. Added `renameFolderInVault.test.ts` (4 tests).
- **Task 5 (Commit `e3a89ee`)**: Added native Rust command `delete_folder` in `fs.rs` and `lib.rs` with canonical root safety and `resolve_in_vault`. Implemented `deleteFolderInVault.ts` with recursive descendant note removal from SQLite (`notes`, `fts_notes`, `links`), graph cleanup, tab closure, and prompt confirmation dialog in `FileTree`. Added `deleteFolderInVault.test.ts` (4 tests).
- Added ADR-0158.
- **Verification**: All 71 desktop test files and 239 total tests pass; ESLint passes with 0 errors. Native macOS visual click-away on window chrome regions and native prompt dialogs remain UNVERIFIED due to headless execution environment.

### Next
- Manual visual acceptance of file tree context menu dismissal, keyboard navigation, and folder CRUD actions in a running macOS Tauri GUI session.

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

1. **Git Versioning Phase 2**: add local history/diff UI and safe restore against the real local Git log; no remotes.
2. **Resolve AI Phase 5 blockers**: add real provider/key transport and consent-state persistence; extend vector storage with chunk text/source resolution before ask-your-vault or Phase 6 settings.
3. **Manual Re-Test of OAuth Sign-In**: Execute interactive OAuth sign-in flow and verify consent display shows both `drive.file` and `drive.appdata` permissions, token presence in OS keychain, refresh/restart persistence, and sign-out deletion.
4. **Stabilization pass Phase 1** (`plans/stablize.md`): dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
5. **Plugin Ecosystem Phase 8**: Publishing a real sample plugin and adding its verified registry entry.
6. **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
7. **Unlinked Mentions Detection**
8. **Inline Property Editing**
9. **Outline Scroll Synchronization**
10. Add success/warning semantic color tokens
11. Chromatic / Playwright screenshot regression

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.
- **AI feature plan artifact**: `plans/ai-integration-plan/ai-features-build-plan.md` is missing; recover it before treating any undiscovered prior AI decision as authoritative.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.
