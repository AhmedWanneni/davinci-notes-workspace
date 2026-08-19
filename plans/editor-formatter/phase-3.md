# Implementation Plan — Phase 3: Inline Formatting Completeness (@app/editor)

Ensure all inline markdown formatting tokens render correctly in `@app/editor` (both interactive `Editor` and read-only `MarkdownView`), including bold, italic, strikethrough, highlight (`==`), combined/nested styles, and backslash-escaping, while maintaining keystroke latency under 5ms and preserving wikilink integration.

## User Review Required

> [!IMPORTANT]
> - `@lezer/markdown` already exports the GFM `Strikethrough` extension. We will enable it directly.
> - For Highlight (`==text==`), we implement a dedicated Lezer `highlightExtension` using `@lezer/markdown`'s delimiter parsing protocol (`cx.addDelimiter(...)`).
> - Escaping will mark the leading backslash character `\` with `.cm-markdown-syntax` so that rendered/inactive lines hide the backslash and display literal text (e.g. `\*\*text\*\*` renders as `**text**` without bold formatting), while the active line displays the editable backslash.

## Proposed Changes

### `@app/editor`

#### [NEW] [highlightExtension.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/highlightExtension.ts)
- Define `highlightTag = Tag.define()` and custom Lezer `MarkdownExtension` for `==` delimiter parsing using `cx.addDelimiter`.
- Exports `highlightExtension` and `highlightTag`.

#### [MODIFY] [editorTheme.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/editorTheme.ts)
- In `editorHighlightStyle`, add styling for `t.strikethrough` (`textDecoration: "line-through"`) and `highlightTag` (`backgroundColor: "var(--color-bg-highlight, rgba(241, 196, 15, 0.3))"`, `borderRadius: "var(--border-radius-sm, 2px)"`, `padding: "0 2px"`).
- In `editorTheme` and `readOnlyEditorTheme`, ensure `.cm-markdown-syntax` hiding and active line reveal work smoothly for all delimiter marks and escape characters.

#### [MODIFY] [livePreviewExtension.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/livePreviewExtension.ts)
- Replace outdated `EmphasisSymbol` with `EmphasisMark`.
- Add `StrikethroughMark`, `HighlightMark`, and `Escape` (`node.from` to `node.from + 1` for the backslash char).

#### [MODIFY] [Editor.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/Editor.tsx)
- Configure `markdown({ extensions: [Strikethrough, highlightExtension] })`.

#### [MODIFY] [MarkdownView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/MarkdownView.tsx)
- Configure `markdown({ extensions: [Strikethrough, highlightExtension] })`.

#### [MODIFY] [index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/index.ts)
- Re-export `highlightExtension` and `highlightTag`.

---

### Tests & Benchmarks

#### [NEW] [inlineFormattingExtension.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/state/inlineFormattingExtension.test.tsx)
- Test bold (`**`, `__`), italic (`*`, `_`), strikethrough (`~~`), highlight (`==`).
- Test combined bold+italic (`***`, `___`) and nested forms (`**bold with _italic_**`).
- Test backslash escaping (`\*\*`, `\*`, `\=\=`, `\~\~`, `\#`, `\``, `\|`) and verify per-character scoping (`\*not italic* but *this is italic*`).
- Test wikilinks on the same line as inline formatting (`**bold** [[Wikilink]] ==highlight==`).
- Test read-only `MarkdownView` rendering for all inline forms.

---

### Documentation & Tracking

#### [NEW] [docs/adr/0066-inline-markdown-formatting-and-highlight-extension.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/adr/0066-inline-markdown-formatting-and-highlight-extension.md)
- Document inline formatting decisions, Strikethrough reuse, custom Highlight extension, and Escape node decoration.

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Add ADR-0066 row to the index table.

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Update Last Session and Next Up.

#### [NEW] [.changeset/inline-formatting-completeness.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/.changeset/inline-formatting-completeness.md)
- Changeset patch for `@app/editor`.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @app/desktop test src/state/inlineFormattingExtension.test.tsx`
- Run `pnpm --filter @app/desktop test src/state/EditorBenchmark.test.ts` (verify <5ms keystroke latency)
- Run `pnpm --filter @app/editor typecheck` and `pnpm --filter @app/editor lint`
- Run full repo typecheck & lint.
