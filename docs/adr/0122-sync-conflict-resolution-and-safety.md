# ADR-0122: Sync conflict resolution policies and safety boundaries

## Status

Accepted

## Context

Phase 4 requires resolving conflicts detected during sync diffing without data loss.
Conflict scenarios include overlapping text edits on `.md` files, simultaneous edits on `.canvas` files, binary file collisions, and edit-vs-delete mismatches.

Line-based diff3 merge on structured JSON files (such as `.canvas`) risks inserting inline conflict markers (`<<<<<<<`) or syntax errors that cause `JSON.parse` to fail, rendering canvas files unparseable and corrupt.
For text files, line-based three-way merge must be deterministic, preserve all conflicting hunks losslessly, and surface conflict state to the user.

## Decision

1. **Merge Library**:
   Use `node-diff3` (zero dependencies, ~3.5 KB gzip) in `@app/sync-client` for line-based three-way merging using the last-known common base manifest entry as the ancestor.
2. **Text Files (`.md`)**:
   Only `.md` files undergo line-based diff3 merge. Non-overlapping edits auto-merge cleanly. Overlapping edits receive inline markers (`<<<<<<<`, `=======`, `>>>>>>>`) and surface a `text-merge-conflict` UI flag for user review. Real parser testing confirms conflict markers do not crash or corrupt wikilink indexer resolution.
3. **JSON Canvas Files (`.canvas`)**:
   Treat `.canvas` files as atomic assets (non-text-mergeable). Simultaneous edits bypass text diff3 merge and trigger automatic copy-based resolution (`<name> (<device> copy).canvas`). This guarantees that both versions remain 100% valid JSON Canvas 1.0 files without syntax corruption.
4. **Binary & Asset Conflict Naming**:
   Binary files (`.png`, `.jpg`, `.pdf`) and `.canvas` files use `<name> (<device-name> copy).<ext>`. Filename collisions chain to the space-separated numeric suffix convention from ADR-0110 (`<name> (<device-name> copy) 1.<ext>`).
5. **Delete vs. Edit**:
   The edited version always wins over deletion (deletion treated as a no-op). The resolution is explicitly surfaced to the user via a structured notification/event (`delete-vs-edit-local-wins` or `delete-vs-edit-remote-wins`).

## Consequences

- Zero data loss across text, canvas, and binary files.
- `.canvas` files are protected from JSON syntax corruption.
- Conflict markers in `.md` files parse safely without breaking wikilink indexer extraction.
- Clear user visibility into all conflict resolution actions and overridden deletions.
