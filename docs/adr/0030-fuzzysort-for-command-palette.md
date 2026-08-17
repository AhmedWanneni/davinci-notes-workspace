# ADR-0030: `fuzzysort` for the command palette

## Status
Accepted

## Context
Quick switcher needs extremely fast fuzzy title matching with match highlighting across thousands of notes, without main-thread overhead.

## Decision
Use `fuzzysort` (~6 KB gzipped) for the command palette / quick switcher.

## Consequences
- Instant (<1 ms) title matching; built-in `result.highlight(...)` gives Sublime/Obsidian-style match visualization without extra code.
- Aligns with `PERFORMANCE.md` rules to avoid heavy libraries.
