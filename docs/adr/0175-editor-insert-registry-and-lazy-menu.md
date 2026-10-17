# ADR-0175: Editor Insert Registry and Lazy Menu

## Status

Accepted

## Context

The editor needs a consistent way to insert Markdown and HTML constructs from a header menu without pulling rendering dependencies into startup or duplicating templates across UI entry points.

## Decision

- Define immutable insert items in `@app/editor` with an id, group, label, icon, keywords, and snippet-producing `build()` function.
- Load the registry dynamically only when the header insert menu opens. The menu uses existing Radix Popover primitives; no dependency is added.
- Apply an item through CodeMirror `snippet()`, with the editor selection captured before menu focus. Block items receive surrounding blank-line padding; inline items do not.
- Keep recent entries in the current menu session for Phase 1. Persisted history is deferred until a vault-scoped settings/storage policy is specified.

## Consequences

- New insertion entry points reuse the same templates and CodeMirror placeholder semantics.
- Registry code is excluded from the initial desktop bundle; opening the menu does not load Mermaid or KaTeX.
- Snippet placeholder traversal uses existing CodeMirror autocomplete support and produces one undoable document change.
