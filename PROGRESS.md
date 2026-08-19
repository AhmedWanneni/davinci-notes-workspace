# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Stabilization Phase 1 — note CRUD** — delete and duplicate complete (ADR-0064); move and real-app dogfooding remain. Note CRUD continues to use canonical vault operations for filesystem, SQLite, graph, and workspace state.

## Last Session

**Editor Markdown Formatting — Phase 3: Inline Formatting Completeness (@app/editor) (ADR-0066)**

### Completed
- Enabled built-in GFM `Strikethrough` extension from `@lezer/markdown` in `@app/editor` (`Editor` and `MarkdownView`).
- Implemented dedicated `@lezer/markdown` `highlightExtension` using delimiter parser matching `==highlight==` syntax with custom `highlightTag`.
- Styled `t.strikethrough` (`textDecoration: "line-through"`) and `highlightTag` (`backgroundColor: "var(--color-bg-highlight, rgba(241, 196, 15, 0.3))"`, `borderRadius: "var(--border-radius-sm, 2px)"`, `padding: "0 2px"`) in `editorHighlightStyle`.
- Updated `livePreviewExtension.ts` to match `EmphasisMark`, `StrikethroughMark`, and `HighlightMark` for hiding delimiters off-active-line, and decorated `Escape` node backslashes (`node.from` to `node.from + 1`) with `cm-markdown-syntax` so backslashes hide in rendered view while displaying literal characters without triggering formatting.
- Verified nested and combined forms (`***bold+italic***`, `___under combined___`, `**bold with _nested italic_**`, `==highlight with **bold**==`, `~~strike with ==highlight==~~`).
- Added comprehensive unit tests in `inlineFormattingExtension.test.tsx` (10 passing tests) covering core inline styles, combined/nested forms, character-scoped escaping, active line editing, wikilink co-occurrence, and read-only `MarkdownView` rendering.
- Added `@app/editor` minor changeset and ADR-0066.

### Verification
- 10 inline formatting tests passing.
- 5 horizontal rule tests passing.
- 4 line break tests passing.
- 25 canvas test suites (179 tests) passing (zero regressions in canvas embeds).
- Editor benchmark typing latency: **4.319 ms per keystroke** (under 5 ms target).
- `@app/editor` typecheck, lint, build pass cleanly.

**Editor Settings Ownership — package contract correction (ADR-0065)**

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

**Stabilization Phase 1 — canonical note delete and duplicate (ADR-0064)**

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

**Editor Markdown Formatting — Phase 2 line-break semantics (ADR-0063)**

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

**Editor Markdown Formatting — Phase 1 audit (ADR-0062)**

### What was audited

- Created ignored regression fixture: `test-vault/editor-markdown-formatting-audit.md`, covering every requested Obsidian syntax variant.
- Verified the configured CodeMirror parser, decorations, keymaps, styles, link handling, and editor settings without changing `@app/editor`.
- Recorded all results in [ADR-0062](docs/adr/0062-editor-markdown-formatting-gap-audit.md): CommonMark basics are present but several live-preview/interactions are partial; strikethrough, highlight, task lists, image dimensions/rendering, footnotes, and Obsidian comments are missing.
- Confirmed `markdown()` uses strict CommonMark. Optional Lezer GFM support is installed but not configured. No Strict Line Breaks setting or distinct app reading mode exists.

### Scope discipline

No implementation files under `packages/editor/` changed, and no dependency was added. The audit preserves the single CodeMirror renderer chosen in ADR-0003/0048 and introduces no runtime or bundle cost.

---

**Obsidian-style H1 ↔ filename sync (ADR-0060)**

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
| **ADR-0059** | Creation-time `initialNoteContent` unchanged; rename “no sync” superseded by ADR-0060 |

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

## Next Up (in order)

1. **Stabilization pass Phase 1** (`plans/stablize.md`): implement note move and dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
2. **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
3. **Editor Markdown Formatting — Phase 4: Links & Images** (using ADR-0062 gap audit).
4. **Unlinked Mentions Detection**
5. **Inline Property Editing**
6. **Outline Scroll Synchronization**
7. Add success/warning semantic color tokens
8. Chromatic / Playwright screenshot regression
9. Fix `CanvasBenchmark.test.ts` lint

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.
