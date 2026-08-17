# ADR-0043: Native `<textarea>` for canvas text cards, not CodeMirror

## Status
Accepted

## Context
Text card content is plain text only; embedding full CM6 instances inside every text card would add DOM complexity and bundle overhead per card.

## Decision
Edit text-card content with a lightweight native `<textarea>`. Full CodeMirror 6 editing (`@app/editor`) remains dedicated to note-editor tabs.

## Consequences
- Canvas stays lightweight; CM6 bundle is not multiplied across cards.
- Text cards still round-trip through the JSON Canvas ↔ React Flow translation layer preserving `id`, `x`, `y`, `width`, `height`, `text`, `color` without extending the spec schema.
