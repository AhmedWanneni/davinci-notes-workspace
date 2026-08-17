# ADR-0022: `yaml` package for frontmatter parsing

## Status
Accepted

## Context
YAML frontmatter needs parsing in `@app/indexer`.

## Decision
Use the `yaml` npm package (~25 KB min gzip per bundlephobia). Acceptable for indexer-only use; not shipped in the initial editor bundle until vault indexing runs.

## Consequences
- Malformed YAML returns `{ frontmatter: {}, error }` without throwing; missing frontmatter returns `{}`.
