# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Stabilization Phase 1 — note CRUD** — delete and duplicate complete (ADR-0064); move and real-app dogfooding remain. Note CRUD continues to use canonical vault operations for filesystem, SQLite, graph, and workspace state. The Editor Markdown Formatting Phases 1–8 build plan is complete (ADR-0072).

## Last Session

**Editor Markdown Formatting — Phase 8: Escaping Edge Cases (@app/editor) (ADR-0072)**

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

**Editor Markdown Formatting — Phase 7: Quotes, Footnotes & Comments (@app/editor) (ADR-0071)**

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

**Bug Fix — Inline Code Visual Styling (@app/editor)**

### Root cause and fix
- Reproduced with the existing CodeMirror JSDOM harness; the Markdown parser emitted `InlineCode`/`CodeMark`, and `livePreviewExtension` hid the delimiters correctly for both single- and double-backtick spans.
- The code content had only the generic `t.monospace` highlight rule, whose font family was the same editor font and had no visual background, border, or distinct color. Extended that existing rule with accent color, secondary background, subtle border, small radius, and padding; no parallel decoration system was added.
- Added coverage for single-word and multi-word spans, distinct highlighted content, delimiter behavior, double-backtick literals, cursor editing, and the existing benchmark.

### Verification
- Phase 6 focused suite: 37 tests passing.
- `@app/editor` typecheck, lint, and build pass; latency remains under the existing `<5 ms` benchmark assertion.
- Added a patch changeset for `@app/editor`.

**Editor Markdown Formatting — Phase 6: Code Blocks (@app/editor) (ADR-0070)**

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

**Bug Fix — Ordered List Numbers Not Rendering (@app/editor) (ADR-0069)**

**Bug Fix — Ordered List Numbers Not Rendering (@app/editor) (ADR-0069)**

### Root cause and fix
- Reproduced through the existing CodeMirror JSDOM harness (the package has no dev/playground script). Static `1.` / `1)` lines and unordered markers rendered correctly; the failure occurred only during incremental entry because `listExtension` skipped every active-line marker. The raw `1. ` source remained, but no ordered decoration/widget existed.
- Updated the existing list decoration path to render only the ordered numeral/delimiter on the active line. Unordered markers and task checkbox widgets retain their raw active-line editing behavior; item text remains a normal editable range.
- Added ADR-0069 (superseding the active-line portion of ADR-0068) and a patch changeset for `@app/editor`.

### Verification
- Regression coverage now types `1. ` character-by-character and confirms the active `1.` widget, while existing coverage verifies `1.` / `1)` rendering, multiple numbered items, unordered bullets, cursor editing, and mixed list content.
- `@app/editor` and desktop typecheck/lint pass; 30 focused list, line-break, inline, links/images, and benchmark tests pass. Expanded benchmark measured **1.043 ms/keystroke**, under 5 ms.

**Editor Markdown Formatting — Phase 5: Lists & Tasks (@app/editor) (ADR-0068)**

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

**Editor Markdown Formatting — Phase 4: Links & Images (@app/editor) (ADR-0067)**

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
3. **Unlinked Mentions Detection**
4. **Inline Property Editing**
5. **Outline Scroll Synchronization**
6. Add success/warning semantic color tokens
7. Chromatic / Playwright screenshot regression
8. Fix `CanvasBenchmark.test.ts` lint

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.
