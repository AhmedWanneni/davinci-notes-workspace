# ADR-0063: Direct CodeMirror Soft-Line-Break Decorations

## Status

Accepted.

## Context

ADR-0062 found that CommonMark already recognizes paragraph and hard-break
semantics, but the existing `livePreviewExtension` is a viewport-only
`ViewPlugin`. Phase 2 must replace soft paragraph newlines with a visible
space while retaining hard breaks and blank paragraph boundaries.

CodeMirror requires decorations that replace line breaks (and therefore alter
vertical layout) to be supplied directly from editor state, rather than from
an indirect viewport decoration provider.

## Decision

Add a small direct `StateField<DecorationSet>` in `@app/editor` for soft
paragraph line breaks. It decorates only newlines inside parsed `Paragraph`
nodes that are not CommonMark hard breaks, replacing each with one inline
space widget. The existing viewport-only `livePreviewExtension` remains
responsible for inline Markdown syntax marks.

The extension rebuilds only when document content changes; settings changes
do not touch note content or trigger disk/index writes. No new package is
introduced.

The Phase 2 acceptance criteria specifies the same rendered paragraph mapping
for default and Strict Line Breaks modes: soft newlines join, two trailing
spaces and Shift+Enter are hard breaks, and blank lines separate paragraphs.
Consequently, this phase persists and exposes the Strict Line Breaks preference
using the existing settings mechanism, but it does not introduce a separate
visual mapping beyond those shared rules.

## Consequences

- Soft lines visually join, hard breaks retain their physical break, and blank
  lines remain paragraph boundaries without changing the markdown source.
- The direct field adds a bounded parser/tree scan during an edit. Its cost is
  measured against the existing 1,000-line editor latency benchmark before
  completion; it must remain under the project’s 5 ms target.
- This is still one CodeMirror live-preview rendering path, consistent with
  ADR-0003 and ADR-0048; it is not a parallel renderer.
