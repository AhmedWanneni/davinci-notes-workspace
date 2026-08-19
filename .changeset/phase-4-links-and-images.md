---
"@app/editor": minor
---

Phase 4 — Links & Images: full link/image live-preview rendering in @app/editor

- Unified `linkExtension` replaces standalone `wikilinkExtension` (backward-compat re-export kept); handles wikilinks, markdown internal links, external links, and `<autolink>` URLs in a single extension
- Markdown internal links `[text](path.md)` resolve through the same `parseLinks` indexer lookup as wikilinks; broken-link state (dashed underline) is consistent across both link types
- External links `[text](https://...)` and autolinks `<https://...>` render as clickable, open via `onExternalLinkClick` or `window.open`
- Space-escaping: `%20`-encoded URLs and `<angle-bracket>`-wrapped URLs with literal spaces are parsed and navigated correctly
- New `imageExtension` renders `![alt](url)` inline via async `ImageWidget` with `loading=lazy`/`decoding=async`; never blocks typing
- Dimension syntax `![alt|640x480](url)` (explicit width×height) and `![alt|100](url)` (width-only, auto height) applied to rendered `<img>` element
- Both extensions iterate `view.visibleRanges` only — keystroke latency 4.627 ms on 1 000-line/350-note/100-wikilink/50-image document (under 5 ms target)
- 8 new Phase 4 tests; 27/27 editor tests passing (Phase 2 line-break + Phase 3 inline + Phase 4 links/images); zero canvas regressions
- ADR-0067 logged
