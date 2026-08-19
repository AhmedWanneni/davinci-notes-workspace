# ADR-0073: Mermaid rendering and cursor-gated editor updates

## Context

Mermaid fenced blocks need rendered diagrams without making ordinary editor
typing pay the cost of parsing and rendering a complex SVG. The editor also
needs to keep the fenced source editable and preserve the existing CodeMirror
rendering path.

Mermaid 11.16.1 was selected for flowchart, sequence, and future diagram-type
coverage. The installed package footprint is approximately 83 MB including
its dependency tree; it is dynamically imported so Mermaid is absent from the
initial editor module path and only loads when a diagram widget is rendered.

## Decision

Mermaid diagrams render only when the cursor is outside their fenced block.
While the cursor is inside, the raw fence remains visible and editable. A
selection transition renders immediately; document changes are refreshed
after a 150 ms debounce. Invalid Mermaid input is caught and shown in an
inline error widget.

The widget extracts Mermaid source from the fence, renders through
`mermaid.render`, and binds `class NodeId internal-link;` nodes to the
editor's existing `onLinkClick` callback. This reuses the same vault/indexer
resolution path as Markdown links.

CodeMirror ViewPlugins cannot replace ranges containing line breaks. The
rendered block therefore uses one replacement widget per fenced source line:
the first line owns the SVG and continuation widgets keep the source range
covered without introducing a second renderer. This preserves the widget
pattern while respecting CodeMirror's decoration invariant.

## Consequences

- Flowcharts, sequence diagrams, and other Mermaid-supported types use one
  generic renderer instead of syntax-specific implementations.
- Mermaid's substantial dependency is deferred from initial loading, but is
  still an intentional package cost and must remain scoped to `@app/editor`.
- The diagram does not live-update on every keystroke; source editing is
  responsive and the diagram refreshes after leaving the block or after the
  short external-update debounce.
- Future math rendering should reuse the cursor-gated/debounced policy unless
  its rendering cost proves materially different.
