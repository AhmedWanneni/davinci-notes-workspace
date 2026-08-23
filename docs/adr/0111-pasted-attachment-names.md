# ADR-0111: Default names for nameless pasted files

## Status

Accepted

When clipboard file data has no name, paste handling creates
`pasted-<timestamp>.<extension>`. The extension comes from the clipboard MIME
type for the Phase 1 allowlist (for example `image/png` becomes `.png`). An
unknown MIME type uses `.bin`, which Phase 2's format validation rejects with
the normal structured unsupported-format error rather than writing an
unidentifiable file.

Named clipboard files retain their original name and are passed unchanged to
the Phase 2 writer, which remains responsible for validation and collision
suffixes. Paste writes are awaited asynchronously and syntax is inserted only
after the write succeeds.
