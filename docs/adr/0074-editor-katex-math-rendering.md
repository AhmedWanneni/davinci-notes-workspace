# ADR-0074: KaTeX math rendering in the editor

## Context

The editor needs inline and multi-line block LaTeX without adding a heavy
always-loaded renderer or doing expensive typesetting on every keystroke.
Phase 10 established cursor-gated rendering with a 150 ms debounce for
external changes.

## Decision

Use KaTeX 0.18.4, dynamically imported only when a math widget is mounted.
Its installed package footprint is approximately 4.3 MB, substantially
smaller than the Mermaid dependency already accepted for diagrams. KaTeX's
supported TeX surface includes the required `vmatrix`, fractions, scripts,
and common inline expressions. No current product requirement depends on a
MathJax-only extension or the broader MathJax package ecosystem.

Block and inline math use CodeMirror replacement widgets. Block source is
cursor-gated exactly like Mermaid: the raw `$$` source is editable while the
cursor is inside, and the rendered expression returns on exit. External
changes refresh after 150 ms. Inline math is also hidden on the active line
in editable mode to prevent typesetting work during typing; read-only views
render it immediately.

KaTeX is called with `throwOnError: true`; parse failures become an inline
error placeholder instead of escaping into the editor. KaTeX's stylesheet is
included with the math extension, while the JavaScript renderer remains lazy.

## Consequences

- The determinant/matrix and exponential examples render without MathJax's
  larger runtime or extension surface.
- Documents requiring MathJax-specific TeX packages may need a future
  renderer decision; they are not silently claimed as fully compatible.
- The same cursor/debounce policy now applies to Mermaid and math and is a
  reusable baseline for future rendered syntax.
