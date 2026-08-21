# ADR-0090: HTML sanitizer allowlist and constrained CSS policy

## Status
Accepted

## Decision

The only allowed elements are `u`, `s`, `span`, `div`, `table`, `tr`, and `td`,
plus safe HTML comments. The only allowed attributes are `class` and `style`.
Class values contain only whitespace-separated ASCII letters, digits, `_`, and
`-` tokens.

Style values are reduced to these properties: `color`, `background-color`,
`font-weight`, `text-decoration`, and `text-align`. Colors accept hex, rgb/rgba,
hsl/hsla, or alphabetic named colors; font weight accepts normal, bold, or
100–900; text decoration accepts none, underline, or line-through; text-align
accepts left, right, or center. `url()`, `expression()`, `javascript:`,
`data:`, unknown properties, and malformed declarations are removed.

Scripts, style blocks, iframes, all event-handler attributes, and all URL-bearing
attributes are removed. `<iframe>` is explicitly out of scope. Comments are
preserved only as comment nodes after their comment delimiters are normalized;
the sanitizer still processes all element content.

## Consequences

This is intentionally narrower than generic safe HTML. Custom styling is
limited to a reviewable property/value policy, and future additions require a
new security review and tests.
