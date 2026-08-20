# Tags Feature — Build Plan

Target: implement Obsidian-style tags (https://obsidian.md/help —
Working with tags): inline `#tag` syntax, YAML `tags` property, tag
search, nested tags, and a Tags view.

Unlike the editor-formatting plans, this feature spans more than one
package — tag detection/rendering belongs in `@app/editor`, but tag
indexing/search belongs wherever the vault-wide indexer already lives
(`@app/indexer`, per the canvas plan's reference to it), and the Tags
view is an app-level UI surface. Treat this as its own track, same
"one phase, one concern, checkpoint before moving on" discipline as
the other plans.

Read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `PERFORMANCE.md`
before every session. Consult `DECISIONS.md` (the ADR index) only —
do not read the full `docs/adr/` directory; open a specific ADR only
if the index points to one directly relevant. Log new decisions as new
ADRs, indexed in `DECISIONS.md`.

---

## Phase 1 — Tag Parsing Rules & Data Model

**Goal**: define what a valid tag is, with no rendering/UI yet.

- Define the tag-matching rule precisely, per spec:
  - Starts with `#`
  - Allowed characters: letters, numbers, underscore, hyphen, forward
    slash (for nesting), and "commonly accepted Unicode" (emoji/
    symbols) — decide a concrete Unicode range/approach rather than
    leaving this vague; log as ADR
  - Must contain at least one non-numerical character (`#1984` invalid,
    `#y1984` valid)
  - No blank spaces (camelCase/PascalCase/snake_case/kebab-case are
    the user's workaround, not something the parser needs to handle
    specially beyond just allowing those characters)
  - Case-insensitive matching, but display uses first-seen casing
    (`#Tag` then `#TAG` both display as `#Tag`) — this requires a
    canonical-casing registry, not just string comparison
- Define nested tag semantics: `#inbox/to-read` is a tag whose parent
  is `#inbox`; searching/filtering for `inbox` should match both
- Decide where this parsing logic lives — likely a shared
  package/util usable by both `@app/editor` (for inline detection) and
  `@app/indexer` (for vault-wide extraction), so the rule is defined
  once, not duplicated. Log the placement decision as an ADR.
- Unit tests for the matching rule: valid/invalid examples from the
  spec, edge cases (numeric-only, emoji tags, nested with multiple
  levels, mixed case first-seen casing)

**Checkpoint**: tag-matching logic is defined, unit-tested, and
importable from both the editor and indexer packages — no UI yet.

---

## Phase 2 — Inline Tag Detection & Rendering (Editor)

**Goal**: `#tag` typed in the editor body renders as a recognizable,
clickable tag — building on the editor's existing decoration pattern.

- Detect valid tags per Phase 1's rule as you type, using the shared
  parsing logic (not a reimplementation)
- Render matched tags with distinct styling (pill/badge style, per
  whatever design-token convention the app uses for similar inline
  elements — check existing decoration styling from the formatting
  plan's Phase 3/4 rather than inventing new tokens)
- Clicking a tag triggers a search/filter action (wire to whatever the
  app's search entry point is — coordinate with Phase 4 below for the
  actual search behavior; this phase can stub the click handler if
  search isn't built yet, but the affordance/styling must be correct)
- Invalid near-tag text (e.g. `#1984`, or a `#` followed immediately by
  a space) must NOT render as a tag — verify against Phase 1's edge
  cases directly in the editor
- Regression check: tags inside headings, list items, blockquotes, and
  table cells (if Phase 9 of the formatting plan is done) still render
  correctly

**Checkpoint**: typing valid and invalid tag examples in the editor
shows correct rendering/non-rendering for each; tags inside other
block elements still render correctly.

---

## Phase 3 — YAML `tags` Property Support

**Goal**: tags declared in frontmatter are recognized identically to
inline `#tag` usage.

- Parse the `tags:` YAML list in frontmatter (reuse existing
  frontmatter/YAML parsing if the app already has it for other
  properties — check before adding a new YAML parser dependency)
- Tags from frontmatter and tags from inline `#tag` usage in the body
  must be merged into one canonical set per note — a note's "tags"
  isn't just body tags or just frontmatter tags, it's both
- Confirm frontmatter tag values follow the same validity rules as
  Phase 1 (case-insensitive matching, nesting via `/`) even though
  they're not prefixed with `#` in YAML
- Live Preview rendering of the frontmatter block (if the editor
  already has a frontmatter view/widget) should show these consistent
  with inline tag styling, or at minimum be clearly recognizable as
  tags

**Checkpoint**: a note with both frontmatter tags and inline tags
shows a correctly merged, deduplicated tag set (verify via whatever
debug/inspection method is available before Phase 4's search UI
exists).

---

## Phase 4 — Vault-Wide Tag Index (Indexer)

**Goal**: the indexer tracks every tag across every note, keeping it
current as notes change.

- Extend `@app/indexer` (or wherever vault-wide indexing lives) to
  extract tags per note using Phase 1's shared parsing logic, from
  both body and frontmatter (Phase 3)
- Build a reverse index: tag → list of notes containing it, updated
  incrementally as notes are edited/created/deleted (reuse whatever
  incremental-update mechanism the indexer already has for other
  indexed data — wikilinks, etc. — rather than a full re-scan per
  keystroke)
- Nested tag semantics in the index: querying `inbox` must return
  notes tagged `#inbox` AND notes tagged `#inbox/to-read`,
  `#inbox/processing`, etc.
- Canonical-casing registry: first-seen casing wins for display, but
  lookups must be case-insensitive — implement this at the index level
  since it's a vault-wide concern, not per-note

**Checkpoint**: editing a note's tags (adding, removing, renaming case)
correctly and promptly updates the vault-wide tag index; a nested-tag
query returns the correct matching set.

---

## Phase 5 — Tag Search

**Goal**: `tag:#meeting` (or `tag:inbox` for nested matching) works as
a search operator, and clicking a tag in a note searches for it.

- Add the `tag:` operator to the existing search implementation
  (assuming one exists — if search is a separate unbuilt feature
  entirely, flag that as a blocking dependency rather than building a
  parallel mini-search here)
- Wire Phase 2's tag-click handler to actually execute this search
- Confirm nested-tag matching works through the search operator the
  same way it does in the raw index (Phase 4)

**Checkpoint**: searching `tag:#meeting` and `tag:inbox` both return
correct, correctly-nested results; clicking a tag in the editor
executes the equivalent search.

---

## Phase 6 — Tags View

**Goal**: a dedicated panel/view listing all tags in the vault,
matching Obsidian's Tags view.

- A command (via the command palette, per the app's existing command
  mechanism) to show/open the Tags view
- List all tags from the vault-wide index (Phase 4), with nested tags
  shown as children of their parent tag (tree structure, not a flat
  list)
- Selecting a tag in this view triggers the same search as clicking a
  tag inline (reuse Phase 5's search wiring)
- Tag count per entry (how many notes use this tag) — a natural and
  low-cost addition given the index already tracks this

**Checkpoint**: Tags view opens via command palette, shows a correct
nested tree of all vault tags with counts, and selecting a tag
searches correctly.

---

## Phase 7 — Regression & Integration Pass

**Goal**: confirm tags compose correctly with everything else already
built (editor formatting phases, canvas if applicable).

- Tags inside every block type from the editor-formatting plan (lists,
  tables, blockquotes, code blocks — tags inside a code block should
  NOT be detected as real tags, since code content is literal; verify
  this exclusion explicitly)
- Renaming a tag's casing in one location updates its canonical
  display everywhere (editor decorations, Tags view, search results)
- Performance check: a vault with many tags/many tagged notes doesn't
  degrade indexer update speed or search responsiveness — define a
  reasonable benchmark (e.g. 1000+ tagged notes) per PERFORMANCE.md's
  general discipline
- Update PROGRESS.md with a closing summary noting the tags plan is
  complete, and log a final ADR indexing all decisions made across
  Phases 1–7

**Checkpoint**: full regression sweep passes; large-vault tag
performance is acceptable.

---

## What's Deliberately Out of Scope

- **Tag renaming/management UI** (bulk rename a tag across the vault,
  merge two tags) — Obsidian has this as a separate feature; not
  covered by the base "Working with tags" doc, revisit as its own
  scoped effort if wanted later
- **Bases `hasTag` function integration** — the source doc mentions
  Bases (`file.hasTag("a")`), but that's a distinct, larger feature;
  out of scope here unless Bases already exists in the app and this is
  a small addition to it — confirm status before deciding

---

## Sequencing Notes

- Phase 1 (shared parsing logic) is foundational — get the matching
  rules exactly right here, since editor rendering (Phase 2), YAML
  merging (Phase 3), and indexing (Phase 4) all depend on the same
  definition of "valid tag." A mismatch between editor detection and
  indexer extraction is the most likely bug class in this whole plan —
  sharing one implementation is the guard against it, don't let
  Phase 2 and Phase 4 drift into separate regex implementations.
- Phase 5 (search) has a hard dependency: if the app doesn't have a
  general search feature yet, that's a prerequisite to check before
  starting this phase, not something to improvise inside it.
- Phase 6 (Tags view) is the most "optional/nice-to-have" phase if
  time-constrained — Phases 1–5 deliver the core, functional tag
  system; the view is a browsing convenience on top.