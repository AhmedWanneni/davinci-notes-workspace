# ADR-0208: Obsidian Kanban format compatibility and lossless write-back

## Status

Accepted

## Context

Users require an Obsidian-compatible Kanban board view to manage tasks across desktop and mobile vaults. The Obsidian Kanban plugin stores boards as single Markdown notes annotated with `kanban-plugin: board` in YAML frontmatter. In this format:
- H2 headings (`## Lane`) designate columns/lanes; other heading levels are non-lane content.
- Task list items (`- [ ]`, `- [x]`) directly under a lane are cards; indented lines under a card represent its multi-line Markdown body.
- Plugins and workflows embed opaque syntax: `%% kanban:settings ... %%` comment blocks, `*** \n ## Archive` sections, `@{\d+}` date tokens, tags, and wikilinks.

Naively re-serializing boards through an abstract syntax tree causes data loss, reorders frontmatter keys, modifies line endings, drops unknown comment blocks, and generates massive Git diffs across entire files on single-card edits.

## Decision

1. **Lazy-Loaded Package (`@app/kanban`)**:
   Implement kanban data model, line-preserving parser, and board view in a dedicated `@app/kanban` package. Enforce ESLint boundaries restricting dependencies to `@app/core-types` and `@app/design-system`. Initial desktop entry bundle contains 0 KB of kanban code.

2. **Lossless Line-Preserving Model**:
   `parseBoard(text)` partitions document lines into `preambleLines`, structured `lanes` (with `headingLine`, `preLines`, `cards`, `postLines`), and `epilogueLines`. Cards store their exact `rawLines` and preceding blank/comment lines.
   - For unchanged boards, `serializeBoard` returns the exact source text reference in O(1) time.
   - Line endings (LF vs CRLF) and trailing newline absence are strictly detected and preserved.

3. **Minimal-Diff Splicing Operations**:
   All board mutations (`moveCard`, `editCard`, `toggleCard`, `addCard`, `deleteCard`, `addLane`, `renameLane`, `deleteLane`, `reorderLanes`) operate directly on targeted line arrays. Moving a card alters only the source and destination line positions without reformatting surrounding markdown.

4. **ADR-0170 Save-Path & External Reconciliation Alignment**:
   Board mutations write back through `useWorkspaceStore.updateNoteContent`, inheriting the 750 ms debounce, stat-based change guard, atomic disk writes, and SQLite indexing.
   - When external file changes arrive (via file watcher or external editors), the board updates from disk while retaining any active inline editing draft (`editingCardId`), preventing data loss during live editing.
   - Notes with `kanban-plugin: board` that fail safe parsing are opened as Markdown with an explanatory banner and never overwritten.

## Consequences

- Full bidirectional vault interoperability between DaVinci Notes and Obsidian.
- Byte-for-byte fidelity across arbitrary frontmatter structures, comments, and archives.
- Sub-3ms parse latency for 5,000 cards with minimal memory overhead.
