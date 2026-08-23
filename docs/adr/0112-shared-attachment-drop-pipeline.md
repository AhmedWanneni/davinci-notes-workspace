# ADR-0112: Shared paste and drop attachment pipeline

## Status

Accepted; refinement of Phase 3

Paste and external file-drop handlers share `handleIncomingFiles`: files are
processed in OS order, each delegates to the existing Phase 1 resolver and
Phase 2 writer callback, successful syntax is inserted together, and failures
are reported individually. This preserves successful files in a partial drop
instead of making the batch all-or-nothing. Text-selection drag behavior is
left to CodeMirror because the drop handler only claims events containing
files.

The editor adds a token-based dashed outline while a file drag is over the
editor and removes it on leave or drop. No attachment rendering was added.
