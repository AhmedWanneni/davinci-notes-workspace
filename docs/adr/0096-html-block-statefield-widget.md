# ADR-0096: Mount HTML blocks as structural CodeMirror widgets

## Status

Accepted; supersedes the mounting detail in ADR-0091

## Context

HTML blocks were initially supplied by a `ViewPlugin` as inline
`Decoration.replace` ranges on each source line. That allowed the block DOM to
participate in a `.cm-line`'s line-height and caused `.cm-activeLine` to grow
around block content. CodeMirror 6 rejects structural `block: true`
decorations when they are provided by a view plugin.

## Decision

HTML blocks use `Decoration.replace({ block: true })` over the complete source
range, with the decoration set supplied by a `StateField` and exposed through
`EditorView.decorations`. The widget is therefore laid out between editor
lines, not inside a `.cm-line`. The field rebuilds on document changes so
initial load, typing, paste, undo, and redo all re-detect and re-sanitize the
block. Inline HTML remains on its existing view-plugin replacement path.

## Consequences

- The HTML block root is a structural sibling of editor lines and no longer
  contributes to an active line's height.
- The block range is replaced atomically, preserving sane cursor boundaries
  before and after the widget while the source remains editable through normal
  CodeMirror transactions.
- Block decorations are built for the current note document rather than only
  visible ranges; this is bounded by the open document and avoids an
  unsupported plugin-level structural decoration.
