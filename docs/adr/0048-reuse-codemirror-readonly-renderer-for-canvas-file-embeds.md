# ADR-0048: Reusing CodeMirror 6 read-only live-preview renderer for canvas file embeds

## Status
Accepted

## Context
Phase 6 introduces file-embed cards to render markdown notes on the canvas. Two architectural options exist for rendering note contents inside cards:
1. **Add a second markdown-to-HTML parser** (e.g. `marked`, `remark`, or `markdown-it`) dedicated to cards.
2. **Reuse CodeMirror 6 live-preview renderer from `@app/editor` in read-only mode**.

## Decision
Reuse CodeMirror 6 in read-only mode via a shared `MarkdownView` component in `@app/editor`:
- `MarkdownView` mounts CodeMirror with `EditorState.readOnly.of(true)`, `EditorView.editable.of(false)`, and excludes interactive extensions like `history`, `keymap`, `autocomplete`, and blinking cursors.
- Reuses the existing `markdown()`, `syntaxHighlighting(editorHighlightStyle)`, `livePreviewExtension`, and `wikilinkExtension` configured with workspace link navigation.
- Extracted shared highlight styles and themes into `packages/editor/editorTheme.ts` to keep file line counts under 150 lines.

## Consequences
- **0 KB bundle overhead**: No second markdown engine is downloaded or bundled (saving ~30–50 KB).
- **100% visual consistency**: File embeds render headings, bold, italic, code, and wikilinks with identical tokens and typography as the main editor tabs.
- **Single rendering path**: Enhancements to syntax highlighting or link rules automatically apply to both main editor and canvas file embeds.
- Cards remain strictly read-only for Phase 6; full inline canvas editing is deliberately deferred to avoid split-brain editor state conflicts.
