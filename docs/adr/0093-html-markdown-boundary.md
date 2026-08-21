# ADR-0093: Markdown and HTML content boundary

## Status
Accepted

## Decision

Captured HTML source is rendered only by the sanitized HTML widget; the
Markdown parser does not reinterpret its text content. Markdown markers such
as `**bold**` and `` `code` `` inside `<div>`, `<u>`, `<s>`, `<span>`, or
same-line inline `<div>` remain literal text. Markdown outside the captured
range continues through the existing Lezer/CodeMirror path and is processed
normally.

The boundary is the exact source range matched by the Phase 2/3 detector:
opening tag through matching close on a contiguous block or same-line inline
element. No nested Markdown parsing is introduced.
