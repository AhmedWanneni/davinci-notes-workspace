# ADR-0062: Editor Markdown Formatting Gap Audit

## Status

Accepted — audit baseline for subsequent formatting work.

## Context

`@app/editor` is a CodeMirror 6 live-preview wrapper. Before extending it,
this audit compares the current implementation with the requested Obsidian
basic-formatting syntax variants. It is documentation-only: no editor source,
dependencies, or rendering behavior changed.

## Audit method

- Created the ignored scratch note
  `test-vault/editor-markdown-formatting-audit.md`, containing every requested
  syntax case.
- Parsed it with the exact configured `markdown()` language and inspected the
  editor extensions, theme, keymaps, settings, and link handlers.
- Checked CodeMirror's bundled Markdown keymap for list continuation and the
  configured `indentWithTab` binding. The app has no separate reading-mode
  renderer; `MarkdownView` uses the same parser and decoration extensions.

The wrapper calls `markdown()` with its default strict CommonMark base. Its
installed Lezer package includes optional GFM task-list and strikethrough
extensions, but the current configuration does not enable them.

## Gap table

| Element / exact variants | Status | Verified current behavior and handler |
|---|---|---|
| Paragraphs: single Enter, two trailing spaces, Shift+Enter, double Enter; Strict Line Breaks | ⚠️ partial | CommonMark parses single Enter as a soft continuation, two trailing spaces as `HardBreak`, and a blank line as a paragraph boundary. There is no `Shift-Enter` binding, so it is not a forced hard break, and no Strict Line Breaks setting/mode exists. `markdown()` parser only. |
| ATX headings `#` through `######` | ⚠️ partial | All six parse. `editorHighlightStyle` gives custom typography only to h1–h4; h5/h6 receive no heading-specific typography. `markdown()` + highlight style. |
| Bold `**` / `__`, italic `*` / `_`, nested bold+italic, combined `***` / `___` | ✅ works correctly | Strict CommonMark parses emphasis/strong combinations; syntax marks are hidden away from the active line. `markdown()` + `livePreviewExtension`. |
| Strikethrough `~~` | ❌ missing entirely | The optional Lezer `Strikethrough` GFM extension is not enabled; no style/decorator exists. |
| Highlight `==` | ❌ missing entirely | No parser extension, highlight tag, or decoration recognizes it. |
| Backslash escapes `* _ # \` \| ~` | ⚠️ partial | CommonMark emits `Escape` nodes, preserving literal meaning, but `livePreviewExtension` does not decorate/hide escape syntax. |
| Wikilinks `[[Note]]` | ✅ works correctly | `wikilinkExtension` uses `@app/indexer` `parseLinks`, hides brackets/targets in live preview, resolves against note paths, and handles clicks. |
| Markdown-style internal links `[text](path.md)` | ⚠️ partial | CommonMark parses and styles the link, and the indexer records markdown links, but the editor only supplies click navigation for wikilinks. |
| External links, `%20` URLs, and `<angle-bracket>` URLs | ⚠️ partial | CommonMark parses normal links and percent-escaped URLs; angle URLs parse as `Autolink`. They receive syntax highlighting but no external-link click/open handler. |
| External image embeds and `|WIDTHxHEIGHT` / `|WIDTH` dimensions | ❌ missing entirely | CommonMark recognizes ordinary image syntax only as source tokens. The editor does not render an image; `|…` stays part of the URL and no Obsidian dimension parser exists. |
| Blockquotes | ⚠️ partial | CommonMark parses `Blockquote`, but the live-preview decorator does not hide/style `QuoteMark`, and there is no blockquote presentation styling. |
| Unordered `-` / `*` / `+`, ordered `1.` / `1)`, and ordered-list Shift+Enter | ⚠️ partial | All markers parse. CodeMirror's normal Enter command continues and renumbers ordered lists, but Shift+Enter has no dedicated hard-break/list-preserving binding. Markers are hidden off the active line without replacement list presentation. |
| Tasks `[x]`, `[ ]`, `[?]`, `[-]` | ❌ missing entirely | No task-list extension or checkbox decoration. Strict CommonMark does not treat these as task items; arbitrary markers have no special handling. |
| Mixed nested ordered/unordered/task lists | ⚠️ partial | Ordered/unordered nesting parses; task items do not. No rendered nested-list/task presentation. |
| Tab / Shift+Tab list indent and unindent | ✅ works correctly | `keymap.of([...defaultKeymap, …, indentWithTab])` binds Tab to indent and Shift+Tab to unindent; Markdown indentation rules apply. |
| Horizontal rules `***`, `---`, `___`, spaced variants | ✅ works correctly | All requested variants parse as `HorizontalRule` with `markdown()`; no additional plugin is needed. |
| Inline code single backtick and double-backtick literal escape | ⚠️ partial | Both parse as `InlineCode`, including a literal backtick in the double-delimited form. `CodeMark` is not hidden by `livePreviewExtension`, so delimiters remain visible. |
| Backtick/tilde fenced blocks (3+), indented/tab code, language tags | ⚠️ partial | Fenced and indented code parse, including 3+ backtick/tilde fences and `CodeInfo`; `markdown()` receives no `codeLanguages`, so language-tagged code has no syntax highlighting. |
| Nested fences: longer outer fence and mixed backtick/tilde | ✅ works correctly | CommonMark fenced-code parsing honors a longer enclosing fence and treats inner/mixed fences as code content when appropriate. `markdown()` parser. |
| Footnotes: numbered, multiline continuation, named, inline `^[…]` | ❌ missing entirely | No footnote parser extension, decorations, or reading renderer. The syntax remains ordinary text/links. |
| Comments `%%inline%%` and multi-line `%%…%%` | ❌ missing entirely | No Obsidian comment parser/decorator. Text remains visible in editor; there is no app reading/preview mode in which it could be hidden. |
| Numbered-list escape `1\.` | ✅ works correctly | CommonMark parses the backslash as `Escape` and retains the line as a paragraph rather than an ordered list. |

## Decision

Treat this table as the verified Phase 1 scope baseline. Do not claim support
because a capability happens to exist in an installed Lezer package: it must
be configured and receive compatible live-preview rendering and interaction
coverage first.

Any follow-up should preserve the current single CodeMirror rendering path
(ADR-0003 and ADR-0048). It should enable or implement only the necessary
parser/decorator behavior, avoiding a second Markdown engine and its bundle
cost.

## Consequences

- Later phases can prioritize missing syntax (tasks, strikethrough, highlight,
  images/dimensions, footnotes, comments) separately from visual/interaction
  gaps in existing CommonMark support.
- The ignored scratch note is available for regression testing but is not
  product content and is not committed.
- No dependency or runtime-cost change was made by this audit.
