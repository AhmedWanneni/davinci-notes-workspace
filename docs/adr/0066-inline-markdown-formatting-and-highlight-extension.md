# ADR-0066: Inline Markdown Formatting & Highlight Extension

## Status

Accepted.

## Context

Phase 3 requires complete, robust support for inline markdown formatting tokens
(bold `**` / `__`, italic `*` / `_`, strikethrough `~~`, and Obsidian-style
highlight `==`), nested and combined styles, and character-level backslash escaping.

ADR-0062 documented that CommonMark handles bold and italic, but strikethrough
and highlight were missing. `@lezer/markdown` provides a built-in GFM
`Strikethrough` extension, but highlight (`==`) requires a custom Lezer delimiter
extension. Furthermore, backslash escaping emitted `Escape` nodes whose `\`
character was not hidden in live preview rendering.

## Decision

1. Enable the built-in `@lezer/markdown` `Strikethrough` extension in `Editor`
   and `MarkdownView`.
2. Implement a dedicated, lightweight `@lezer/markdown` `highlightExtension` using
   `cx.addDelimiter(...)` matching `==` delimiters and associating with a custom
   `highlightTag`.
3. In `editorHighlightStyle`, define styling for `t.strikethrough` (`line-through`)
   and `highlightTag` (`var(--color-bg-highlight, rgba(241, 196, 15, 0.3))`).
4. Update `livePreviewExtension.ts` to match `EmphasisMark`, `StrikethroughMark`,
   and `HighlightMark` for hiding delimiters off-active-line, and decorate the
   backslash character (`node.from` to `node.from + 1`) of `Escape` nodes with
   `cm-markdown-syntax` so escaped characters display literally while hiding the
   backslash in rendered view.
5. Re-export `highlightExtension`, `highlightTag`, and `Strikethrough` from
   `@app/editor`'s barrel `index.ts`.

## Consequences

- All core inline formatting (bold, italic, strikethrough, highlight, combined,
  and nested) renders cleanly across both interactive `Editor` and read-only
  `MarkdownView`.
- Backslash escaping scopes strictly per-character, suppressing formatting
  without leaking across the line.
- Wikilinks and syntax highlighting continue to work seamlessly alongside inline
  formatting tokens.
- Keystroke typing latency on 1,000-line documents remains under the project's
  5ms budget (~4.3ms measured).
- Preserves the single CodeMirror 6 rendering pipeline (ADR-0003, ADR-0048).
