# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Stabilization Phase 1 — note CRUD** — delete, duplicate, and move functionality are implemented, unit tested, and UI wiring in `FileTree` confirmed correct. Note CRUD continues to use canonical vault operations for filesystem, SQLite, graph, and workspace state.

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

## Last Session

**Testing and Integration - Move Note Feature**

### Completed
- Fixed the failing `buildTags` test in `@app/indexer` by moving the dynamic `require` call to a top-level import.
- Created `apps/desktop/src/vault/moveNoteInVault.test.ts` to verify the `moveNoteInVault` functionality.
- Confirmed `moveNoteFromTree` action is properly implemented in `createNoteCrudActions`, integrated into the workspace store, and correctly wired in `FileTree.tsx` (D&D drop handler).

### Verification
- Full workspace test suite passes, including `@app/indexer` and the new `@app/desktop` tests.
- UI wiring of `moveNoteInVault` through `FileTree` components manually audited and confirmed.



**Tags Feature Phase 2 — Inline Tag Detection & Rendering (@app/editor) (ADR-0077)**

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

**Tags Feature Phase 1 — Tag Parsing Rules & Data Model (@app/core-types) (ADR-0075, ADR-0076)**

### Completed
- Placed the shared tag model and parser in `@app/core-types`, the existing dependency-free package already shared by `@app/editor` and `@app/indexer`.
- Implemented the exact Unicode-aware matching rule: letters, numbers, marks, symbols, `_`, `-`, `/`, and ZWJ are allowed; whitespace and punctuation terminate a tag; all-numeric bodies are rejected.
- Added nested-tag decomposition for `#a/b/c` and a canonical-casing registry that preserves the first-seen display form while matching case-insensitively.
- Updated the package’s internal runtime imports to `.js` specifiers so the built `dist` entrypoint can be loaded directly by Node.
- Logged the shared-package placement decision and the Unicode matching rule as ADR-0075 and ADR-0076.

### Verification
- `@app/core-types` unit tests pass for valid/invalid tags, nested decomposition, and canonical registry behavior.
- `@app/core-types` typecheck, lint, and build pass.
- Confirmed the built module imports cleanly from a plain Node/test context without React or CodeMirror dependencies.
- Added an `@app/core-types` patch changeset.

**Phase 11 — Math (@app/editor) (ADR-0074)**

### Completed
- Chose KaTeX 0.18.4 over MathJax for the current LaTeX scope: the required determinant/matrix and exponential expressions are supported, with an approximately 4.3 MB installed package footprint. The JavaScript renderer is dynamically imported.
- Added cursor-gated multi-line `$$ ... $$` block rendering and inline `$...$` rendering. Active editable lines retain raw math source; read-only views render inline math immediately.
- Added graceful invalid-LaTeX placeholders and KaTeX stylesheet/theme integration.
- Reused Phase 10's 150 ms external-update debounce and documented the MathJax-extension compatibility boundary in ADR-0074.

### Verification
- Determinant/matrix block, exponential inline math, cursor toggle, and invalid-LaTeX tests pass.
- Existing Mermaid, table, formatting, and editor benchmark coverage remains passing; package typecheck/lint/build pass.
- Added an `@app/editor` patch changeset.

**Phase 10 — Mermaid Diagrams (@app/editor) (ADR-0073)**

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

**Bug Fix / Feature — Live Editable Table Grid (@app/editor)**

### Root cause and fix
- Reproduced completed tables in Live Preview: Phase 9 detected valid blocks and marked cells, but rendered no grid; pipes and the separator remained ordinary text.
- Added grid rendering to the existing CodeMirror table decoration path. Rows use flex layout, cells use editable marks with equal column sizing and borders, delimiters are visually suppressed, and the separator row is hidden except while active for source editing.
- Cell content remains the CodeMirror document range, so direct typing updates the markdown source and existing context-menu mutations continue to operate on the same ranges. Escaped pipes are excluded from delimiter decoration and inline decorations remain inside cell ranges.

### Verification
- Added coverage for grid rows/cells/delimiters and editing a body cell while preserving pipe-delimited markdown.
- Table parsing, alignment, escaped-pipe, context-menu, line-wrapping, and benchmark tests pass; editor latency remains under `<5 ms`.
- No separate editable DOM state or dependency was added; no ADR was needed because this reuses the existing mark/decorations pattern rather than introducing a new widget architecture.

**Bug Fix — Enter After Ambiguous Table Header (@app/editor)**

### Reproduction and result
- Reproduced the reported sequence with the full editor keymap: pressing Enter after `| First name | Last name |` creates a normal newline.
- Confirmed the same behavior for `| text |`, multi-column pipe-like lines, and ordinary text following a pipe-like line.
- Confirmed Phase 9's `tableExtension` has no Enter keybinding; it only provides viewport decorations and the context menu. CodeMirror's existing default Enter command therefore remains responsible for newline insertion and is not swallowed by table logic.

### Verification
- Added regressions covering the ambiguous header, single-column-looking row, and following-line cases.
- Existing valid-table parsing and context-menu tests remain passing; no production change or changeset was required because the reported bug is not present in the current implementation.
- Editor performance verification remains under the existing `<5 ms` target.

**Bug Fix — Consistent Editor Line Wrapping (@app/editor)**

### Root cause and fix
- Confirmed the inconsistent behavior was deterministic by configuration: neither `Editor` nor read-only `MarkdownView` included CodeMirror's `EditorView.lineWrapping` extension, so long prose lines extended horizontally.
- Enabled `EditorView.lineWrapping` in both shared editor configurations.
- Removed table-cell shrink-to-fit styling (`display: inline-block` and minimum width) that could prevent cell content from wrapping once global wrapping was enabled.
- Preserved the intended code distinction with a scoped `.cm-line.cm-code-block` layout rule: fenced-code lines remain horizontally scrollable instead of being forced to wrap.

### Verification
- Long-line coverage passes for plain prose, lists, tables, blockquotes, and code-adjacent content; `.cm-lineWrapping` is present in the editor content.
- Table, line-wrapping, and benchmark tests pass; full editor regression verification remains under the existing `<5 ms` keystroke target.
- Added a patch changeset for `@app/editor`.

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

## Next Up (in order)

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

1. **Embed Web Pages Phases 1–5 complete**: iframe trust policy, raw iframe blocks, YouTube syntax sugar, and script-free tweet cards passed the closing security/integration sweep. Canvas web-page cards remain separately scoped. See [ADR-0104](docs/adr/0104-embed-web-pages-closeout.md). No further embed phases are planned unless a regression requires one.
2. **HTML Support cursor-navigation fix complete**: HTML blocks now reveal raw source while the selection cursor is inside their range, remain plain editable text during source edits, and re-sanitize only when re-rendered after the cursor leaves. This reuses the existing Mermaid/math selection-driven pattern; see [ADR-0097](docs/adr/0097-html-block-cursor-gated-source.md).

2. **Stabilization pass Phase 1** (`plans/stablize.md`): implement note move and dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
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
