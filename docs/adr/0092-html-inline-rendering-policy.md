# ADR-0092: Inline HTML rendering policy

## Status
Accepted

## Decision

Inline `<u>`, `<s>`, `<span>`, and same-line `<div>` elements use a dedicated
CodeMirror replacement-widget pass, but call the Phase 1 sanitizer before any
DOM assignment. `<s>` uses the same `line-through` treatment as Markdown GFM
strikethrough; `<u>` uses the matching underline treatment. HTML comments are
sanitized and replaced with an empty widget, matching the hidden behavior of
native Markdown comments.

The source example `<span style="font-family: cursive">...</span>` is covered
end-to-end. Under ADR-0090, `font-family` is intentionally not an approved CSS
property, so the style attribute is retained only as an empty sanitized
attribute and the text remains visible. The sanitizer policy is not loosened
for this example.
