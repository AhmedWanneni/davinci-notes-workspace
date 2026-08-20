# ADR-0081: General search v1 operator scope

## Status
Accepted

## Context

The search prerequisite for Tags Phase 5 needs an actual operator parser, but Obsidian exposes a much larger operator surface than v1 needs. The first consumer is `tag:` and its nested descendant semantics from the Phase 4 tag index.

## Decision

V1 supports:

- unqualified terms: case-insensitive note-content search;
- quoted exact phrases: `"project kickoff"`;
- `tag:value` and `tag:#value`, normalized to the Phase 4 tag key without `#`, case-insensitively;
- boolean exclusion with a leading `-`, including `-tag:archive` and `-"old phrase"`.

Multiple positive terms/operators are ANDed; exclusions remove matches. `tag:value` matches the exact tag and descendants (`inbox` matches `inbox/to-read`), while a nested query does not match ancestor-only tags. `path:`, `file:`, `line:`, `section:`, date operators, wildcards, OR/grouping, regex, property/frontmatter operators, and explicit content-vs-title controls are deferred.

## Consequences

- The parser remains small and predictable while satisfying tag search.
- `#` is optional syntax and is normalized away before index lookup.
- Deferred operators are recorded here rather than becoming undocumented behavior.
