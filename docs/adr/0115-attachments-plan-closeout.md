# ADR-0115: Attachments plan Phases 1–7 closeout

## Status

Accepted

The Attachments plan is closed after Phases 1–7. The accepted decisions are:

- ADR-0108: centralized, case-insensitive attachment extension allowlist,
  still provisional because the authoritative reference was unavailable.
- ADR-0109: four serializable attachment-location modes using pure resolution
  and the existing settings persistence path.
- ADR-0110/0111: native filesystem writes with numeric collision suffixes and
  MIME-derived names for nameless pasted files.
- ADR-0112: shared ordered paste/drop pipeline with partial success and
  structured failure reporting.
- ADR-0113: specified folders validate/create at first use; invalid drafts stay
  local with inline validation.
- Phase 6: the existing recursive vault watcher was extended to accepted
  attachment formats. Attachments enter the vault path inventory for tree and
  wikilink resolution but are not parsed as Markdown or inserted into note
  SQLite indexes.
- ADR-0114: embed resolution reuses wikilink candidates, classifies accepted
  formats, and reports ambiguity and missing headings explicitly.

Regression verification confirms block-context insertion, note rename/delete
compatibility, indexer/watcher reconciliation, and no Tags/HTML parser conflict.
Attachment folder resolution and settings remain pure/UI-triggered paths; no
filesystem work occurs on every keystroke or render.

The Attachments plan does not include audio/video/PDF/note rendering. Embed
Files is a separate feature. Its Phase 1 resolution and Phase 2 image rendering
are now implemented independently; later embed kinds remain separately scoped.
