# ADR-0095: Default styling for sanitized HTML tables

## Status

Accepted

## Context

Sanitized HTML tables are rendered inside the CodeMirror HTML block widget,
outside the Markdown table decoration path. Browser defaults therefore do not
provide the app's border and spacing language, while multiline source lines
must not create additional editor line boxes around the rendered block.

## Decision

The HTML block theme gives tables a collapsed, full-width border using the
existing thin-border and subtle-border tokens. Rows receive bottom dividers;
cells receive token-based horizontal/vertical padding and right dividers,
with the final row/cell divider removed. No shadows, gradients, or raw color
values are introduced. Inline styles that survive the Phase 1 sanitizer remain
inline styles and therefore retain normal CSS precedence over these defaults.

Continuation source lines are hidden after their sanitized HTML has been
mounted in the first replacement widget. The block widget has no additional
padding, so source indentation and line breaks cannot become artificial
vertical space.

## Consequences

- Sanitized tables have visible structure in both editable and read-only paths
  that reuse the HTML block theme.
- Multiline HTML retains its actual internal content while source-only lines
  do not affect layout.
- User styles remain constrained by ADR-0090; this decision does not broaden
  the sanitizer allowlist.
