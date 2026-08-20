# ADR-0079: Separate full-text Search from the Command Palette

## Status
Accepted

## Context

The existing `CommandPalette` is a Quick Switcher: it uses `fuzzysort` to match note titles/paths, offers note creation on Enter, and exposes commands such as Settings. It does not search note content, parse operators, or own a search-results view. Tag-click search needs a real results surface without changing those navigation semantics.

## Decision

Build a separate, dedicated Search entry point and results UI alongside the Command Palette. Give it its own shortcut/action and query state. The Command Palette remains a fast fuzzy path/title switcher and keeps its current creation behavior.

## Consequences

- Full-text and operator queries can evolve without degrading quick switching.
- Tag widgets can invoke Search with an equivalent `tag:` query.
- Search adds a lazy-loaded non-critical UI path, consistent with `PERFORMANCE.md`.
