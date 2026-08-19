# Phase 5 — Lists & Tasks plan

1. Add a `listExtension` beside the existing viewport-only live-preview,
   link, and image extensions. It will replace off-active-line list markers
   with lightweight bullet/ordinal widgets and replace task markers with a
   checkbox widget. `livePreviewExtension` will stop owning `ListMark` so
   there is one list decoration owner.
2. A checkbox widget click will dispatch a CodeMirror transaction that changes
   only the marker character between a space and `x`; no DOM mutation or
   external state is involved. Any non-space marker is completed visually and
   toggles to a space; a toggled-on item always writes `x`.
3. Retain CodeMirror's existing `indentWithTab` keymap for Tab and Shift+Tab;
   it already supports single and multi-line selections through Markdown's
   native indentation commands. Add targeted regression tests rather than a
   parallel indentation implementation.
4. Make `insertHardLineBreak` list-aware: Shift+Enter in an ordered list adds
   the Markdown hard-break sequence plus a continuation indentation matching
   that item’s content column, so it remains one numbered item. Outside ordered
   lists it keeps Phase 2's exact two-space hard-break behavior.
5. Record that toggled-on tasks write `x`. Do not set an artificial nesting
   depth limit: the parser and visible-range decoration pass support arbitrary
   valid Markdown nesting without traversing the whole document.

## ADR-worthy decisions flagged before implementation

- Canonical task completion marker: `x`.
- No product-imposed list nesting cap; viewport-bounded rendering is the
  performance safeguard.
