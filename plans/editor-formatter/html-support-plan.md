# HTML Support Feature — Build Plan

Target: implement Obsidian-style sanitized HTML support (per the "Use HTML in
Obsidian" doc): HTML sanitization, block-level HTML rendering, common inline
HTML usage (comments, `<u>`, `<span>`/`<div>`, `<s>`), and the two documented
limitations (no Markdown inside HTML, HTML blocks must be self-contained/no
blank lines). `<iframe>` / embedding web pages is a separate, larger feature —
explicitly out of scope here (see below).

This is a **security-sensitive** feature, unlike the editor-formatting or tags
plans. Sanitization is the foundation everything else sits on — no phase past
Phase 1 renders any HTML until sanitization is in place and tested. Treat this
with the same "one phase, one concern, checkpoint before moving on" discipline
as other plans, but do not skip or compress Phase 1 to move faster.

Like tags, this spans more than one package — sanitization is a security-
critical shared concern (belongs in its own scoped package, not buried inside
`@app/editor`, so it can be audited/updated independently), while block/inline
HTML detection and rendering belongs in `@app/editor` alongside the existing
Markdown decoration pipeline.

Read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `PERFORMANCE.md` before every
session. Consult `DECISIONS.md` (the ADR index) only — do not read the full
`docs/adr/` directory; open a specific ADR only if the index points to one
directly relevant. Log new decisions as new ADRs, indexed in `DECISIONS.md` —
this plan will generate more security-relevant ADRs than most (sanitizer
choice, allowlist contents, tag/attribute policy), so be diligent about
logging rationale, not just the decision.

---

## Phase 1 — HTML Sanitization Core

**Goal**: a sanitization function exists, is unit-tested against real attack
vectors, and is the *only* path any HTML content will ever pass through. No
rendering yet.

- Choose a sanitization approach and library (e.g. DOMPurify or equivalent) —
  weigh bundle size per `PERFORMANCE.md`'s standing constraint (check
  bundlephobia, confirm tree-shakeable/lazy-loadable since HTML-in-notes is
  not used in every note) against security maturity; do not hand-roll a
  sanitizer. Log the choice and rejected alternatives as an ADR.
- Define the allowlist precisely, scoped to what this doc documents as
  supported usage, not "all safe HTML":
  - Comments (`<!-- -->`)
  - `<u>`, `<s>`
  - `<span>`, `<div>` — including `style` and `class` attributes (needed for
    the CSS-snippet/custom-styling use case the doc describes), but define
    exactly which CSS properties/values are permitted in inline `style` (raw
    `style` passthrough is itself an injection vector — e.g. `expression()`,
    `url()` with `javascript:`, etc.) — log this as its own ADR, it's a real
    security decision, not a detail
  - `<table>`, `<tr>`, `<td>` (used in the doc's own self-contained-block
    example)
  - Explicitly confirm `<script>`, `<style>` (block-level), event handler
    attributes (`onclick`, `onerror`, etc.), and `javascript:`/`data:` URLs
    in any attribute are stripped — write a test for each, don't assume the
    library's defaults match this app's policy without verifying
- `<iframe>` is NOT included in this allowlist — it's explicitly out of scope
  (see below) even though the source doc references it
- Decide where this package lives (e.g. a new `@app/sanitize` or similar,
  not folded into `@app/editor` or a root-level `utils.ts` per `AGENTS.md`'s
  banned-filenames rule) and log the placement as an ADR
- Unit tests: every allowlisted tag/attribute renders through; every known
  attack vector (script injection, event handlers, `javascript:` URLs, CSS
  injection via `style`, malformed/nested tags meant to confuse a naive
  parser) is stripped or neutralized. Include the exact example from the
  source doc (a `<script>` pasted into a note) as a named test case.

**Checkpoint**: sanitizer is implemented, unit-tested against an explicit
attack-vector list (not just happy-path tags), and importable as a standalone
package — no editor integration or rendering yet.

---

## Phase 2 — Block-Level HTML Detection & Rendering

**Goal**: a self-contained HTML block (per the doc's `<table>` example) is
detected, sanitized via Phase 1, and rendered in the editor.

- Detect HTML block boundaries per the doc's rule: the block must be complete
  and contiguous — a blank line inside breaks it. Define this precisely (what
  exactly constitutes "the block" — first HTML tag to matching close tag with
  no blank line between) and log as an ADR if the source doc's wording leaves
  any ambiguity
- Route detected block content through Phase 1's sanitizer before rendering —
  never render raw captured HTML directly, even transiently
- Render the sanitized block as actual HTML (not escaped/shown-as-text),
  consistent with how the editor renders other non-Markdown block content if
  a precedent exists (check existing decoration/widget patterns before
  inventing a new rendering path)
- Reproduce the doc's own negative example explicitly: the same `<table>`
  content but with a blank line inserted between `<tr>` and `<td>` must NOT
  render as a table — verify this breaks exactly as documented, not just
  "differently"
- Confirm sanitization runs on every edit to the block (paste, typing, undo),
  not only on initial load — a block that becomes malicious after an edit
  must still be caught

**Checkpoint**: a self-contained HTML block (e.g. the doc's table example)
renders correctly; the same content with a blank line inserted does not
render as HTML; sanitization is verified to run on every content path
(load, paste, edit), not just first render.

---

## Phase 3 — Inline HTML Elements

**Goal**: the doc's specific inline usages work as documented — comments,
`<u>`, `<span>`/`<div>` with style/class, `<s>`.

- `<u>` — underline rendering
- `<s>` — strikethrough. Check whether the app's Markdown formatting already
  implements `~~text~~` strikethrough (likely, per CommonMark/GFM) — if so,
  `<s>` should reuse the same visual treatment/token rather than a second
  strikethrough implementation; do not duplicate styling
- `<span>`/`<div>` with `style` and `class` — confirm the exact
  property/value allowlist from Phase 1 is what actually reaches the DOM;
  add an editor-level test (not just a sanitizer unit test) using the doc's
  own example (`font-family: cursive`)
- HTML comments (`<!-- -->`) — confirm these are hidden/non-rendering in
  Live Preview, consistent with how Markdown comments (`%%...%%`, if the app
  already supports that syntax) are hidden, per the doc's note that HTML
  comments are a fallback for Pandoc-style conversion, not the primary
  mechanism
- All of the above must pass through Phase 1's sanitizer identically to
  block-level HTML — no separate/looser inline path

**Checkpoint**: each documented inline usage (`<u>`, `<s>`, `<span>`/`<div>`
with style/class, HTML comments) renders correctly in the editor, sanitized
identically to block-level HTML, with no duplicate strikethrough
implementation if Markdown `~~~~` already exists.

---

## Phase 4 — No-Markdown-Inside-HTML Enforcement

**Goal**: match the doc's documented (intentional) limitation — Markdown
syntax inside an HTML element does not render as Markdown.

- Verify that Markdown syntax inside a sanitized HTML block/element is
  displayed literally (e.g. `**bold**` inside a `<div>` shows as literal
  asterisks, not bold) — this should likely fall out naturally from *not*
  running the Markdown parser on already-HTML-classified content, but verify
  explicitly rather than assuming
- Verify the doc's specific "appears to work but isn't" case: inline tags
  like `<span>` sitting *around* Markdown syntax that's actually being
  processed by the outer Markdown parser (not the HTML content itself)
  still renders correctly — i.e. confirm the boundary between "this is
  HTML content" and "this is Markdown text wrapped in an inline HTML tag"
  is correctly drawn, since the doc explicitly calls out that this
  distinction is easy to get wrong
- Add regression tests for both cases side by side so future changes can't
  collapse the distinction

**Checkpoint**: Markdown inside a genuine HTML block renders literally, not
processed; Markdown outside/around an inline HTML tag still renders
correctly — both cases covered by named regression tests.

---

## Phase 5 — Regression & Integration Pass

**Goal**: confirm HTML support composes correctly with everything else
already built (editor formatting phases, tags, canvas if applicable).

- HTML blocks/inline HTML inside other block types from the editor-
  formatting plan (lists, blockquotes, tables) and confirm no conflicts
- Confirm tags (`#tag`) typed inside a sanitized `<div>`/`<span>` are NOT
  detected as real tags (consistent with the code-block exclusion already
  established in the Tags plan's Phase 7) — HTML content should be treated
  as literal/opaque to the tag parser, log this as an ADR if not already
  covered
- Re-run Phase 1's full attack-vector test suite one more time in the
  integrated editor context (not just the isolated sanitizer package) —
  confirm nothing in the editor's rendering pipeline reintroduces risk
  (e.g. a widget that re-inserts unsanitized content on re-render)
- Performance check per `PERFORMANCE.md`: sanitization must not run
  synchronously on every keystroke for notes with large HTML blocks —
  confirm debouncing/batching consistent with how other per-keystroke work
  (indexing, tag detection) is already handled
- Update `PROGRESS.md` with a closing summary noting the HTML support plan
  is complete, append full session detail to `docs/HISTORY.md`, and log a
  final ADR indexing all decisions made across Phases 1–5

**Checkpoint**: full regression sweep passes, including the tag-detection
exclusion inside HTML; the complete attack-vector suite passes in the
integrated editor, not just the isolated sanitizer; performance is
acceptable on large HTML blocks.

---

## What's Deliberately Out of Scope

- **`<iframe>` / Embed web pages** — the source doc references this but
  points to a separate "Embed web pages" document. This is a distinct,
  larger feature (its own security surface — arbitrary remote content in an
  iframe is a different risk class than sanitized static HTML) and should
  be its own scoped plan, not folded in here.
- **Arbitrary/unrestricted HTML** — this plan implements the specific
  allowlisted usage the doc documents (comments, `<u>`, `<span>`/`<div>`,
  `<s>`, basic table tags), not general-purpose arbitrary HTML. Expanding
  the allowlist later is a deliberate, reviewed decision each time, not a
  default to grow toward.

---

## Sequencing Notes

- Phase 1 (sanitization) is the hard dependency for every other phase, more
  strictly than any "shared logic" dependency in prior plans — no phase 2+
  work should render HTML through anything other than Phase 1's sanitizer,
  even temporarily/for testing convenience. If a later phase finds itself
  needing to render something before sanitization, that's a sign the
  phase is scoped wrong, not a reason to add a bypass. Keep the sanitizer
  as its own standalone, independently-auditable package for this same
  reason — don't let it end up as a helper function inside `@app/editor`
  where it's easy to accidentally bypass.
- Phase 4 (no-Markdown-inside-HTML) is subtle and doc-specified as an
  intentional limitation — resist the temptation to "improve" this by
  making Markdown work inside HTML; that would be a deviation from spec,
  not a bug fix, and should go through an explicit ADR-logged discussion
  if ever proposed.