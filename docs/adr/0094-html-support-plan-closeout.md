# ADR-0094: HTML Support plan closeout

## Status

Accepted

## Decision

HTML support uses the standalone DOMPurify-backed `@app/sanitize` package
(ADR-0089). Rendering is limited to the exact tags and constrained `class` /
`style` policy defined by ADR-0090. Block HTML requires matching tags on
contiguous nonblank lines (ADR-0091); inline HTML is rendered through the same
sanitizer and shares Markdown strikethrough treatment for `<s>` (ADR-0092).

The captured HTML source range is opaque to Markdown and tag decoration passes,
while Markdown and tags outside that range remain active (ADR-0093). The
editor's integrated regression suite confirms that tag-looking text inside
sanitized `<div>` and `<span>` content is not treated as a real tag.

`<iframe>` and web-page embeds remain outside this plan. Canvas is a separate
JSON/React Flow surface and does not render note HTML; any future canvas HTML
feature requires its own security review and sanitizer integration.

## Consequences

- All note HTML reaching the editor DOM is sanitized immediately before
  `innerHTML` assignment.
- HTML support composes with the existing editor/tag pipeline without adding a
  second parser or sanitizer policy.
- A future embed feature cannot infer permission from this allowlist.
