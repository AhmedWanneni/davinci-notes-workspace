# ADR-0109: Attachment location settings and pure resolution

## Status

Accepted

Attachment settings use the existing serializable preference pattern and are
intended to be stored through the existing SQLite `settings` key/value API,
not a second persistence path. The model has four modes: vault root,
specified folder, the current note's containing folder, and a named subfolder
under that containing folder. The settings object always carries both
mode-specific strings so later UI can switch modes without schema changes.

`resolveAttachmentFolder` performs no filesystem access. A saved note's folder
is the directory before its final path segment; nested note paths remain
nested. An unsaved note has no containing folder and therefore resolves to the
vault root for note-folder mode or directly to the configured subfolder for
note-subfolder mode. Specified folders are returned even when absent; Phase 2
owns creation. Paths use `/` separators, preserve an explicitly absolute
specified path, and normalize trailing separators.
