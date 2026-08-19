# ADR-0068: Editor List and Task Live Preview

## Status

Accepted.

## Context

Phase 5 of the Editor Markdown Formatting work adds rendered ordered and
unordered lists, interactive task items, and list-aware hard breaks to the
single CodeMirror live-preview path established by ADR-0062. The behavior has
to remain responsive in long notes and preserve Markdown as the source of
truth.

## Decision

- `listExtension` owns list-marker and task-marker decorations. It examines
  only CodeMirror visible ranges and replaces off-active-line syntax with
  small DOM widgets; `livePreviewExtension` no longer separately decorates
  `ListMark`.
- Checkbox interaction dispatches a CodeMirror transaction which changes the
  Markdown bracket marker. It never mutates the DOM as storage. A space means
  incomplete; every non-space marker means completed. Toggling completed to
  incomplete writes a space, and toggling incomplete to completed writes the
  canonical `x` marker.
- No artificial nesting-depth limit is imposed. Markdown lists may mix types
  at any valid depth; work stays bounded because decorations scan visible
  ranges rather than recursively walking the entire document.
- Tab and Shift+Tab retain CodeMirror's `indentWithTab` behavior. Phase 5 adds
  coverage but no custom indentation command.
- Shift+Enter in an ordered list creates a Markdown hard break and continues
  at that item’s content indentation, preserving one numbered item rather than
  creating a new numbered marker.

## Consequences

- Task state is durable portable Markdown and stays synchronized through the
  editor's normal change listener.
- The extension adds no dependency and does no full-document per-keystroke
  scan. Its combined behavior must continue to meet the 5 ms benchmark.
- Active editable lines keep raw Markdown syntax, consistent with the Phase 3
  and Phase 4 live-preview interaction model.
