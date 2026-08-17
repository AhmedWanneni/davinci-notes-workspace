# ADR-0003: Use CodeMirror 6, not ProseMirror/Tiptap

## Status
Accepted

## Context
Markdown must stay the source of truth; live preview is a decoration layer, not a separate WYSIWYG document model. ProseMirror is WYSIWYG-first and fights "raw markdown is the file."

## Decision
Use CodeMirror 6 for the note editor (the same editor Obsidian uses).

## Consequences
- Markdown remains the file format; live preview renders on top.
- Editing a note and reading the file stay in sync by construction.
- Later phases embed CM6 only where full editing is needed, not for small overlay fields (see ADR-0043).
