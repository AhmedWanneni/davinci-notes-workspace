# Editor Markdown Formatting — Build Plan

Target: bring `@app/editor` (CodeMirror 6 wrapper) up to parity with
Obsidian's basic editing/formatting syntax
(https://obsidian.md/help — Editing and formatting).

Current state (`@app/editor@0.1.0`): CodeMirror 6 wrapper with
live-preview decorations, custom typography, syntax highlighting,
wikilink autocomplete, debounced saving, <5ms keystroke latency.

Same discipline as the rest of the project: one phase, one concern,
checkpoint before moving on. Read `AGENTS.md`, `DECISIONS.md`,
`PROGRESS.md`, `PERFORMANCE.md` before every session. Consult
`DECISIONS.md` (the ADR index) only — do not read the full `docs/adr/`
directory; open a specific ADR only if the index points to one directly
relevant to the phase at hand. Log new decisions as new ADRs, indexed
in `DECISIONS.md`.

---

## Phase 1 — Audit & Gap List

**Goal**: know exactly what's implemented vs missing before writing code.

- Build a single test note exercising every syntax element from the
  Obsidian formatting doc: paragraphs, line breaks (default + strict),
  headings, bold/italic/strikethrough/highlight (incl. nested/combined),
  wikilinks, markdown-style internal links, external links (incl.
  space-escaping), external images (incl. dimension syntax), quotes,
  ordered/unordered/task lists (incl. nesting and custom task
  characters), horizontal rules, inline/block code (incl. nested
  fences), footnotes (incl. inline/multi-line/named), comments,
  backslash-escaping
- Run it through the current editor; record actual vs expected
  behavior for each element as ✅ works / ⚠️ partial / ❌ missing
- Log the gap table as a new ADR

**Checkpoint**: gap table complete and reviewed before any
implementation begins.

---

## Phase 2 — Line Break Semantics

**Goal**: match Obsidian's default and Strict Line Breaks behavior
exactly — this affects paragraph/block boundaries for everything else.

- Default mode: single `Enter` = soft continuation (same paragraph);
  two trailing spaces or `Shift+Enter` = hard line break
- Strict mode (togglable setting): single return with no trailing
  spaces merges the two lines; two+ trailing spaces = `<br>`; double
  return = new paragraph, regardless of trailing spaces
- Add a settings toggle for Strict Line Breaks if one doesn't exist

**Checkpoint**: all three behaviors verified against the doc's exact
examples, in both default and strict modes.

---

## Phase 3 — Inline Formatting Completeness

**Goal**: every inline style token works, including nested/combined
forms.

- Verify/implement: bold (`**`/`__`), italic (`*`/`_`), strikethrough
  (`~~`), **highlight (`==`)** — check this isn't missing
- Nested/combined: bold+italic (`***`/`___`), bold with nested italic
- Backslash-escaping of formatting characters, without breaking
  existing decoration logic

**Checkpoint**: style table from the doc renders identically,
including nested and escaped cases.

---

## Phase 4 — Links & Images

**Goal**: full link/image syntax including edge cases.

- Confirm wikilink autocomplete also *renders* correctly (not just
  completes)
- Markdown-style internal links (`[text](path.md)`) — decide whether
  these resolve through the same indexer as wikilinks; log as ADR
- External links, including space-escaping via `%20` and via
  `<angle-bracket>` wrapping
- External image embeds (`![alt](url)`) plus **dimension syntax**
  (`|640x480`, `|100` width-only with aspect-ratio scaling)

**Checkpoint**: internal, external, and image links (with/without
dimensions) render and are clickable/navigable.

---

## Phase 5 — Lists & Tasks

**Goal**: full list behavior including nesting and custom task markers.

- Ordered (`1.` / `1)`) and unordered (`-` / `*` / `+`) lists
- `Shift+Enter` inside an ordered list inserts a line break without
  breaking the numbering sequence
- Task lists (`- [ ]`) — **any character inside the brackets** counts
  as a "completed" style, not just `x`
- Nested lists with mixed types (ordered inside unordered, etc.)
- `Tab` / `Shift+Tab` indent/unindent commands
- Checkbox click-to-toggle in preview/reading mode, writing back to
  the underlying markdown

**Checkpoint**: deeply nested mixed lists behave correctly; indent
commands work; checkbox toggling updates markdown correctly.

---

## Phase 6 — Code Blocks

**Goal**: correct fencing, nesting, and syntax highlighting.

- Inline code (single backtick; double-backtick escape for literal
  backticks inside)
- Fenced blocks (3+ backticks or tildes); tab/4-space indentation as
  an alternate block syntax
- Language-tagged syntax highlighting — check current language
  coverage against what's needed; note any gap as ADR
- **Nested code fences**: outer fence must use more fence characters
  than any inner fence, or a different fence character type
  (backtick vs tilde) — add an explicit test for this

**Checkpoint**: a fence-in-fence and backtick-in-tilde example both
render correctly.

---

## Phase 7 — Quotes, Horizontal Rules, Footnotes, Comments

**Goal**: remaining block-level elements.

- Blockquotes (`>`)
- Horizontal rules (3+ of `*` / `-` / `_`, with or without spaces
  between characters)
- Footnotes: `[^1]` reference + `[^1]: text` definition; multi-line
  footnotes (2-space continuation); named footnotes; inline footnotes
  (`^[...]`, reading-view only — decide whether to support in Live
  Preview or match Obsidian's reading-view-only restriction, log as ADR)
- Comments (`%%inline%%` and multi-line block) — visible only in
  editing view, hidden in reading/preview

**Checkpoint**: footnote references/definitions render correctly
(numbered, jump-to-definition is a stretch goal); comments hidden
correctly per view mode.

---

## Phase 8 — Escaping Edge Cases

**Goal**: backslash-escaping works everywhere it should without
breaking normal syntax elsewhere.

- All escapable characters (`* _ # `` | ~`) render literally when
  backslash-escaped
- Numbered-list escape (`1\.`) prevents auto-list conversion —
  verify list-detection logic checks for the escaped period

**Checkpoint**: full escaping test matrix from the doc passes.

---

## Sequencing Notes

- Phase 2 (line breaks) gates most of what follows since it defines
  paragraph/block boundaries — do it early, not last.
- Phases 3–7 are largely independent and can be reordered based on
  what Phase 1's audit shows is most broken or highest-value.
- This plan covers Obsidian's *basic* formatting syntax only. Tables,
  callouts, math expressions, and diagrams live in Obsidian's
  "Advanced formatting syntax" doc — a separate, follow-up plan.
- Update `PROGRESS.md` at the end of every session. Log new decisions
  as ADRs, indexed in `DECISIONS.md`.