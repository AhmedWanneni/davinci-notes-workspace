# ADR-0097: Cursor-gated HTML block source

## Status

Accepted

## Context

Structural HTML block replacements are intentionally laid out outside
`.cm-line` (ADR-0096), but a full-range replacement is navigated as one unit
when it remains mounted. Without the editor's existing live-preview toggle,
arrow navigation can jump over the hidden Markdown source instead of allowing
the cursor to enter it.

## Decision

The HTML block StateField uses the main selection cursor to determine whether
the cursor is inside a block's source range. Editable views omit that block's
structural decoration while the cursor is inside, revealing the raw source;
selection changes rebuild the decoration set so the block re-renders when the
cursor leaves. Cursor positions at the range boundaries remain rendered,
matching the existing Mermaid/math cursor-gated convention. Read-only views
always render HTML.

## Consequences

- Arrow keys, Home/End, and direct selection can reach and edit HTML source.
- The implementation uses the same selection-driven decoration refresh as
  other rendered editor blocks and adds no mouse-only state.
- HTML sanitization still runs whenever a rendered block is rebuilt after
  document changes; inline HTML behavior is unchanged.
