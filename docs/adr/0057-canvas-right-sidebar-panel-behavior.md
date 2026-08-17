# ADR-0057: Canvas right sidebar panel behavior

## Status
Accepted

## Context
The right sidebar (Linked Mentions, Outline, Local Graph) is designed for markdown note tabs. When a canvas tab is active, these panels display misleading or stale data:
- **BacklinksPanel**: Canvas files are not indexed for wikilinks; the panel would incorrectly show "0 backlinks" instead of conveying that the concept doesn't apply
- **NoteOutline**: Extracts H1–H6 headings from markdown content; canvas JSON content produces zero headings, which looks like an empty outline rather than a non-applicable one
- **LocalGraphPanel**: Canvas files have no outgoing wikilink edges in the SQLite graph index; again a misleading 0-node result
- **StatusBar**: Computes property/word/char counts from markdown frontmatter + body; applying that to canvas JSON yields meaningless numbers

Three options were considered:
1. **Hide the right sidebar entirely** when a canvas tab is active — clean but jarring (sidebar visually pops in/out on tab switch)
2. **Build canvas-appropriate equivalents** — e.g. a card-outline listing, canvas-local card-link graph; valuable but out of scope for v1 integration
3. **Explicit "not applicable" empty states per panel** — no layout shift, no misleading zeroes, clear messaging; lowest effort and correct

## Decision
Option 3. Both `RightSidebar` and `StatusBar` gate their note-specific subtrees on a boolean `isCanvasActive = activePath?.endsWith(".canvas")`:
- **RightSidebar**: Each section body swaps `BacklinksPanel` / `NoteOutline` / `LocalGraphPanel` for a Typography "not available for canvas" empty message in the same subsection container
- **StatusBar**: When canvas is active, shows a single "Canvas file" chip instead of backlink/property/word/char counts
- **PropertiesBlock** (above the editor in `EditorArea`): already branch-gated since `PropertiesBlock` lives only in the non-canvas rendering arm

Sidebar collapse state (`isRightSidebarOpen`) is preserved independently of tab type — layout stays stable across tab switches.

## Consequences
- No stale or misleading note data leaks into canvas-tab views; the boundary is explicit and user-visible
- Zero bundle cost: no new imports, no canvas-package dependency in the app shell, pure conditional JSX
- Layout is stable across note ↔ canvas tab switches (no sidebar appear/disappear jank)
- Future: if canvas outline / canvas-local graph panels are built, they slot into the same branches without touching the decision structure
