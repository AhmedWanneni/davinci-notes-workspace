# ADR-0114: Typed embed-link resolution and explicit ambiguity

## Status

Accepted

Embed resolution reuses `@app/indexer`'s shared wikilink candidate lookup and
the Attachments allowlist. It classifies accepted files as image, audio, video,
or PDF and Markdown files as notes. Note headings are checked against supplied
note content; a missing heading returns `heading-not-found`, while a missing
target returns `unresolved`.

When multiple vault-relative files match a basename, embed resolution returns
`ambiguous` with sorted candidates instead of silently choosing a file. This is
deliberately stricter than ADR-0020's legacy note-navigation behavior, because
rendering an attachment against the wrong file is materially misleading.
