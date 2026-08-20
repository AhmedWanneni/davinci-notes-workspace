# ADR-0076: Unicode rule for tag matching

## Context

The tag specification allows letters, numbers, `_`, `-`, `/`, emojis, and
other commonly accepted Unicode symbols, but a vague Unicode rule would make
editor and indexer behavior diverge.

## Decision

After `#`, a tag accepts Unicode letters (`\\p{L}`), numbers (`\\p{N}`),
combining marks (`\\p{M}`), symbols (`\\p{S}`), underscore, hyphen, slash,
and the zero-width joiner (`U+200D`). Unicode punctuation is otherwise a
boundary, so commas, periods, and exclamation marks end a match. The complete
tag must contain at least one character that is not a Unicode number, which
rejects `#1984` but accepts `#y1984`, `#_`, and emoji tags. Empty slash
segments are rejected.

## Consequences

- `#café`, `#🚀`, and `#inbox/to-read` are valid; `#1984` is not.
- Whitespace and punctuation terminate extraction, so `#tag with spaces`
  yields the match `#tag` when scanning text, while the full string is not a
  valid tag.
- Future syntax changes require a new ADR rather than silently broadening the
  shared grammar.
