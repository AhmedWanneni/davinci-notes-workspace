# ADR-0091: Contiguous nonblank HTML block boundaries

## Status
Accepted

## Decision

An HTML block starts on a line whose trimmed content begins with an opening
HTML tag. The detector tracks matching opening/closing tag names until the
root closes. Every line from the opening tag through that close must be
nonblank; a blank line aborts the whole block and leaves its source literal.
Self-closing tags and comments do not affect the stack. The captured source is
sanitized before it is assigned to a DOM widget.

This follows the existing CodeMirror visible-range replacement-widget pattern
used by multi-line diagrams/tables and keeps edits, undo, redo, and initial
loads on the same document-change rebuild path.
