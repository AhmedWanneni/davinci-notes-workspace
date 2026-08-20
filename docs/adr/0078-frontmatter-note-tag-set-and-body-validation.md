# ADR-0078: Frontmatter tag bodies and merged note tag sets

## Context

Phase 1 defined tag rules for inline `#tag` tokens. Phase 3 needs to accept YAML `tags:` frontmatter entries without the leading hash, merge them with inline tags, and hand Phase 4 a stable per-note contract.

## Decision

- Extend the shared tag package with body-only validation/normalization helpers (`isValidTagBody`, `normalizeTagBody`) and `TagRegistry` body methods, rather than copying a second frontmatter-specific validator.
- Represent note tags as a `NoteTagSet` with three arrays: `frontmatter`, `inline`, and `all`. Each array contains canonical `Tag` objects, and `all` preserves first-seen order across the note.
- Keep frontmatter parsing itself in `@app/indexer`, which already owns YAML parsing. Add a thin `parseNoteTags(frontmatter, body)` wrapper there so desktop note hydration can build the merged set from one place.
- No new frontmatter rendering widget is added in this phase because the app does not currently have one. Frontmatter remains plain YAML source; the parsing contract is the deliverable here.

## Consequences

- Phase 4 can consume a single explicit tag-set structure without guessing at casing, deduplication, or source priority.
- Frontmatter and inline tag handling share one rule set and one registry, so the behavior cannot drift.
- If frontmatter UI rendering is added later, it can reuse the same `NoteTagSet` contract instead of inventing a second tag representation.
