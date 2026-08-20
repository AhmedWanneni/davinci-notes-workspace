# ADR-0075: Place tag parsing in `@app/core-types`

## Context

Tag matching and canonical identity are needed by both `@app/editor` and
`@app/indexer`. Neither consumer should depend on the other, and this phase
must not bring UI, CodeMirror, YAML, or indexing side effects into the parser.

## Decision

Place the pure tag model, matcher, nesting decomposition, and canonical-casing
registry in `@app/core-types`. This package already contains dependency-free
shared models and is already a dependency of both editor and indexer. No new
shared-package pattern is needed.

## Consequences

- Editor and indexer can import one implementation and cannot drift on tag
  boundaries or nesting semantics.
- `@app/core-types` remains UI-independent and has no runtime dependency
  beyond the platform's Unicode regular-expression support.
- Vault extraction and rendering are intentionally deferred to later phases.
