# ADR-0040: Obsidian-style CSS Grid app shell

## Status
Accepted

## Context
Desktop shell should match the Obsidian UI composition: top tabs, icon rail, collapsible sidebars, editor, properties block, right sidebar, status bar.

## Decision
Restructure `apps/desktop`'s app shell with CSS Grid:
- Root `.app-shell`: `grid-template-rows: auto 1fr auto` (Top Tab Bar, Main Body Grid, Status Bar); middle body `grid-template-columns: 40px auto 1fr auto` (Icon Rail, Collapsible File Tree, Editor Area, Collapsible Right Sidebar).
- **DOM preservation on collapse**: sidebars toggle via `data-collapsed="true"` (width to 0) rather than conditional unmounting — preserves scroll positions, expanded tree nodes, and active tab states.
- **IconRail**: single navigation entry point (File Tree, Search Cmd+K, Global Graph, Daily Notes, Settings, Close Vault), removing ad-hoc sidebar buttons.
- **PropertiesBlock**: above the editor, renders YAML frontmatter (tags as `#tag` badges, wikilinks, dates, authors) with collapsible accordion.
- **Right sidebar**: stacked Linked Mentions (`BacklinksPanel`), Unlinked Mentions placeholder, Note Outline (H1–H6), and Local Graph.
- **StatusBar**: thin footer with vault state, backlink/property/word/character counts computed from note content.

## Consequences
- Shell matches the Obsidian mental model; DOM state survives sidebar collapses without unmount.
- 12 test suites (33 unit tests) passing; entry bundle <22 KB raw / <8 KB gzip.
