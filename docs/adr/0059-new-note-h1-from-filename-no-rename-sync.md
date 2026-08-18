# ADR-0059: New-note H1 from filename; no auto-sync on rename

## Status
Superseded (rename sync) — see [ADR-0060](0060-bidirectional-h1-filename-sync.md). Creation-time H1 behavior remains in force.

## Context
New notes should open with `# <filename-stem>\n\n` as their first line (e.g. `Meeting Notes.md` → `# Meeting Notes`). The canonical creation path (`createNoteInVault`, ADR-0058) needed a single place to derive that content so every entry point (sidebar, tab bar, command palette, wikilink click, daily note) behaves consistently.

A separate product question: when a note is renamed later, should the first H1 update to match the new filename (Obsidian-style), or stay as written at creation time?

## Decision
- **`initialNoteContent(path)`** in `apps/desktop/src/vault/` is the single source for default markdown body: `# <basename-without-.md>\n\n`.
- **`createNoteInVault(path, content?)`** calls `initialNoteContent(path)` when `content` is omitted. All standard creation entry points use this default.
- **Explicit `content` override** is reserved for canvas text-card → file conversion, where the card body (not the filename) should become the note body.
- **Rename does not auto-sync the H1** (set-once at creation). Filename and heading may diverge after the user edits either independently. When file-tree rename is implemented (stabilization Phase 1), do not add Obsidian-style H1 rewriting unless deliberately scoped — it requires heuristics (only rewrite when H1 still matches the old name) and is out of scope for creation-only work.
- **Existing notes are never modified** by this logic; it applies only on the creation path.

## Consequences
- Wikilink-created notes (`[[Some Link]]` → `Some Link.md`) get `# Some Link` automatically via the shared helper.
- Untitled notes (`Untitled.md`, `Untitled 1.md`, …) get matching H1s (`# Untitled`, `# Untitled 1`).
- Future rename implementation must document whether it updates wikilinks only (data integrity) or also note bodies (editorial choice) — this ADR settles the body/H1 question: no auto-sync.
