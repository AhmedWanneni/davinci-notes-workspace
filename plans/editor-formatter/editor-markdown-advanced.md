# Editor Advanced Formatting — Build Plan

Target: bring `@app/editor` up to parity with Obsidian's *advanced*
formatting syntax (https://obsidian.md/help — Advanced formatting
syntax): tables, Mermaid diagrams, and MathJax/LaTeX math.

Builds on the completed basic-formatting plan (Phases 1–8: line
breaks, inline formatting, links/images, lists/tasks, code blocks,
quotes/footnotes/comments, escaping). Same discipline: one phase, one
concern, checkpoint before moving on. Read `AGENTS.md`, `DECISIONS.md`,
`PROGRESS.md`, `PERFORMANCE.md` before every session. Consult
`DECISIONS.md` (the ADR index) only — do not read the full `docs/adr/`
directory; open a specific ADR only if the index points to one directly
relevant. Log new decisions as new ADRs, indexed in `DECISIONS.md`.

All work stays inside the `@app/editor` package unless a phase
explicitly requires a new dependency or cross-package change — flag
that before doing it.

---

## Phase 9 — Tables

**Goal**: full table syntax, rendering, and Live Preview editing
affordances.

- Parse pipe-delimited tables with a hyphen header-separator row
  (`| --- | --- |`), including the loose form without leading/trailing
  pipes and without perfect cell alignment
- Header row requires at least two hyphens per column — verify parser
  matches this exact threshold, not stricter
- Column alignment via colons in the separator row: left (`:--`),
  center (`:--:`), right (`--:`) — render aligned accordingly
- Inline formatting inside table cells (bold/italic/highlight/links/
  wikilinks from earlier phases) must still render correctly inside
  a cell
- Escaped pipe (`\|`) inside a cell renders as a literal pipe without
  breaking the column boundary — needed for wikilink aliases
  (`[[Note\|Alias]]`) and resized image embeds inside table cells
- Live Preview context-menu affordances (right-click to add/delete
  row/column, sort, move, align) — decide scope: full parity vs. a
  reduced set for v1; log as ADR if reduced
- "Insert Table" command producing a basic empty editable table

**Checkpoint**: a table with mixed alignment, inline formatting, and an
escaped-pipe cell renders correctly; row/column edit affordances (at
minimum add/delete) work in Live Preview.

---

## Phase 10 — Mermaid Diagrams

**Goal**: `mermaid` code blocks render as diagrams instead of plain
code.

- Detect a fenced code block with the `mermaid` language tag (building
  on Phase 6's code-block/language-tag handling) and render it via the
  Mermaid library instead of syntax-highlighted text
- Support at minimum: flowcharts (`graph TD` / `graph LR`), sequence
  diagrams, and confirm the rendering approach generalizes to other
  Mermaid diagram types without special-casing each one
- Bundle-size check: Mermaid is not small — confirm the cost against
  `PERFORMANCE.md`'s dependency rule and log it, same discipline as
  the canvas plan's React Flow addition
- Internal-link nodes: support the `class NodeId internal-link;`
  convention, rendering those nodes as clickable links into the vault
  via the existing indexer integration (reused from Phase 4's link
  resolution, not a new lookup mechanism)
- Special-character node names wrapped in double quotes (e.g.
  `A["⨳ special character"]`) must parse and link correctly
- Decide and document whether Mermaid diagrams render live as you type
  (re-render on every keystroke) or on a debounce/blur, per the
  <5ms keystroke latency constraint — live re-rendering of a complex
  diagram on every keystroke is a likely performance risk

**Checkpoint**: a flowchart and a sequence diagram both render
correctly from their code blocks; an internal-link node navigates to
the correct note; keystroke latency holds while editing near (but not
inside triggering constant re-render of) a diagram block.

---

## Phase 11 — Math (MathJax / LaTeX)

**Goal**: inline and block math expressions render correctly via
MathJax.

- Block math: `$$ ... $$` (can span multiple lines), rendered as a
  centered LaTeX expression
- Inline math: `$ ... $`, rendered inline within a line of text
- Confirm rendering doesn't conflict with any existing use of `$` in
  the editor (unlikely, but verify no collision with other syntax)
- Bundle-size check for MathJax against `PERFORMANCE.md`, same as
  Mermaid — log the cost
- Decide live-as-you-type vs. debounced rendering for math blocks,
  same performance reasoning as Phase 10's diagrams
- Confirm basic LaTeX correctness with a matrix/determinant example
  (per the doc's own example) and an inline exponential example

**Checkpoint**: block and inline math both render correctly for the
doc's example expressions; keystroke latency holds during normal
typing elsewhere in the document.

---

## Phase 12 — Regression & Integration Pass

**Goal**: confirm advanced formatting composes correctly with
everything from the basic-formatting plan (Phases 1–8), and with each
other.

- Tables containing links/images/inline formatting (already covered in
  Phase 9, re-verify here in combination with Phase 10/11 additions)
- A Mermaid diagram or math block placed inside/adjacent to a list item
  or blockquote doesn't break surrounding list/quote decorations
- Escaping (Phase 8) still works correctly and doesn't interfere with
  table pipes, Mermaid fences, or math dollar-signs
- Full keystroke-latency re-check across a document containing a mix
  of tables, diagrams, math, and all basic-formatting elements
- Update `PROGRESS.md` with a closing summary noting the advanced-
  formatting plan is complete, and log a final ADR indexing all
  decisions made across Phases 9–12

**Checkpoint**: a single test document combining tables, diagrams,
math, and every basic-formatting element from Phases 1–8 renders
correctly with no regressions and acceptable performance.

---

## Sequencing Notes

- Phase 9 (tables) has no dependency on Phases 10/11 and could be
  built in parallel or first regardless of order.
- Phases 10 (Mermaid) and 11 (Math) both introduce a sizable new
  dependency and both raise the same "live vs. debounced rendering"
  performance question — consider resolving that question once, as a
  shared ADR, rather than re-deciding it per phase.
- Phase 12 is a deliberate final integration pass, not optional
  cleanup — do not skip it, since this plan's elements are the most
  likely in the whole project to visually collide with basic
  formatting (table pipes vs. escaping, code-fence-like math/diagram
  blocks vs. Phase 6/7 code and quote handling).