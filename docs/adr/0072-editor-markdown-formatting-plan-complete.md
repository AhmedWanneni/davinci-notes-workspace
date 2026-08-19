# ADR-0072: Editor Markdown formatting plan complete

## Status

Accepted

## Context

Phases 1–8 completed the planned basic Markdown live-preview build for
`@app/editor`. The implementation uses one CodeMirror 6 renderer with Lezer
Markdown parsing, visible-range decorations, and small focused extensions.

## Decision index

| Phase | ADR | Decision |
|---|---|---|
| 1 | [0062](0062-editor-markdown-formatting-gap-audit.md) | Audit baseline and single CodeMirror rendering path |
| 2 | [0063](0063-direct-codemirror-soft-line-break-decorations.md) | Direct soft-line-break decorations and hard-break command |
| 3 | [0066](0066-inline-markdown-formatting-and-highlight-extension.md) | Complete inline formatting with strikethrough/highlight |
| 4 | [0067](0067-markdown-internal-links-and-image-embeds.md) | Unified links and async image embeds |
| 5 | [0068](0068-editor-list-task-live-preview.md), [0069](0069-active-ordered-list-marker-visibility.md) | List/task live preview and active ordered markers |
| 6 | [0070](0070-editor-code-block-language-coverage.md) | Code blocks and limited JS/TS-family embedded grammar |
| 7 | [0071](0071-editor-footnote-and-inline-footnote-scope.md) | Quotes, footnotes/comments, and read-only inline-footnote scope |
| 8 | This ADR | Escape matrix verification and plan closure |

## Decision

Treat the Phase 1 gap audit and ADRs 0063–0071 as the accepted decision record
for the completed formatting plan. Phase 8 confirms per-character CommonMark
escapes, hidden backslashes, escaped `1\\.` list markers, and preservation of
adjacent real formatting. No new syntax or dependency is added in the final
pass.

Future Markdown work starts as a separately scoped phase with its own ADR and
must preserve the existing single rendering path and performance budget.

## Consequences

The basic-formatting plan has a stable indexed stopping point. Future sessions
can consult ADR-0072 plus the linked ADRs without reopening the completed
phase sequence or introducing parallel parsing/rendering systems.
