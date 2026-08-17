# ADR-0029: Backlinks panel layout & context-snippet strategy

## Status
Accepted

## Context
Backlinks must be instantly findable without scanning the vault, and context snippets must show the link without mutating the SQLite schema.

## Decision
`BacklinksPanel` is a dedicated right sidebar in `App.tsx`. It queries the SQLite `links` table indexed on `target_path` via `queryBacklinkSources`. For context snippets, source note content is loaded (from memory or cached IPC read) and parsed with `parseLinks` on demand.

## Consequences
- Snippets render in <5 ms; no schema change or migration needed for snippets.
- Live updates synchronized with watcher reconciliation & Zustand save triggers.
