# ADR-0071: Footnote and inline-footnote scope in the editor

## Status

Accepted

## Context

Phase 7 adds footnote references and definitions to the existing CodeMirror
live-preview path. Obsidian treats inline footnotes (`^[text]`) as a reading
view feature, while this package also provides the read-only `MarkdownView`
used by canvas/file embeds.

## Decision

Render numbered footnote references and definition markers in both editable
`Editor` and read-only `MarkdownView`. Support inline footnotes only in
read-only `MarkdownView`; editable live preview leaves `^[text]` as ordinary
editable Markdown text.

Comments are visibly marked in `Editor` and removed by the existing read-only
`MarkdownView` path. No click-to-jump interaction is added in this phase.

## Consequences

The editor matches Obsidian's inline-footnote restriction without building a
new reading-mode system. Numbering is derived from visible references so the
annotation work remains viewport-bounded and within the keystroke budget.
