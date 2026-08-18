# ADR-0060: Bidirectional H1 ↔ filename sync (Obsidian-style)

## Status
Accepted (supersedes the rename half of ADR-0059)

## Context
ADR-0059 set H1 from filename at **creation** and deferred rename sync. Users expect Obsidian-like behavior: editing the first `#` heading renames the file; renaming in the file tree updates the H1. Both directions must share one canonical rename implementation (`renameNoteInVault`) to avoid the duplicate-path bugs seen with note creation (ADR-0058).

## Decision

### Canonical rename
- **`renameNoteInVault(oldPath, newPath, options?)`** is the single rename path: Rust `rename_note` IPC → wikilink text propagation (`updateWikilinksForRename`) → SQLite index update → workspace state (`applyNoteRenameState`).
- File-tree rename and H1-driven rename both call this function — no second implementation.

### Naming collisions (app-wide)
- **Create (notes/folders)**: auto-disambiguate with numeric suffix (`Untitled 1.md`, `New Folder 2`) — never overwrite.
- **Rename (notes/folders/H1-driven)**: if the target name already exists, **no-op** with console warning — never overwrite. Rust IPC also rejects existing destinations.
- On `updateNoteContent`, schedule **`scheduleH1DrivenRename`** debounced at **750 ms** (same as save debounce).
- Flush pending H1 rename on tab switch, close, and `saveAllDirty` (mirrors save flush).
- Extract first H1 from body (after frontmatter); **sanitize** invalid filename chars (`\ / : * ? " < > |`); skip if empty/invalid.
- **Collision**: if target path already exists, **do not rename** — log a warning; H1 and filename may diverge. Never overwrite an existing file (Rust `rename_note` also rejects existing destinations).
- **Loop guard**: compare sanitized H1 stem to current filename stem case-insensitively; skip rename if they already match.

### Filename → H1 (file tree)
- Double-click a `.md` row to inline-rename; calls `renameNoteInVault` with **`syncH1FromFilename: true`** (rewrites first H1 to new stem).
- **Loop guard**: after H1 sync, H1 matches filename → H1-driven rename scheduler no-ops on next content update.

### Relation to ADR-0059
- Creation-time `initialNoteContent` unchanged.
- ADR-0059's "no auto-sync on rename" is **superseded** for both directions by this ADR.

## Consequences
- Wikilinks pointing at the old stem are updated in all vault notes when either rename trigger fires.
- Invalid or empty H1 does not corrupt filenames.
- Future rename entry points (command palette, etc.) must call `renameNoteInVault` only.
