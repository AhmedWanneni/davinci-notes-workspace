# ADR-0077: Tag badges in `@app/editor` preserve first-seen display casing and use a click stub

## Context

Phase 1 established a shared tag registry with case-insensitive identity and first-seen display casing. Phase 2 needs the editor to render tags inline without reimplementing matching logic, while keeping the source markdown as the canonical document state.

## Decision

- Render matched tags in `@app/editor` as inline replacement badges using the shared `matchTags`/`TagRegistry` APIs from `@app/core-types`.
- Display the first-seen casing for each tag identity within the editor session. The badge text is a visual projection of the source, not a rewrite of the markdown document.
- Route clicks through an `onTagClick(tagKey)` callback that currently defaults to a no-op stub. This is the integration point for the future search/filter action; the editor does not implement search itself in Phase 2.

## Consequences

- Tags read clearly as badges while the markdown source remains the single source of truth.
- Later occurrences of the same tag identity render with the registry's first-seen casing rather than the literal characters typed in that location.
- Future search integration can consume the normalized tag key from the click callback without changing the rendering pipeline.
