# ADR-0067: Markdown Internal Links and Image Embeds in @app/editor

## Status

Accepted

## Context

Phase 4 of the Editor Markdown Formatting work (ADR-0062 gap audit baseline)
adds full link and image rendering to `@app/editor`. Three decisions required
explicit resolution:

1. **How to resolve `[text](path.md)` links** — through the same indexer
   lookup as wikilinks, or a separate path-resolution mechanism?

2. **What extension pattern to use** — extend the existing wikilink decorator,
   or build a parallel inline-parsing system?

3. **How to handle external image loading without blocking typing** — blocking
   synchronous `src` assignment, or async-safe approach?

## Decisions

### Decision 1: Markdown internal links resolve through the same indexer lookup as wikilinks

`linkExtension` calls `parseLinks` from `@app/indexer` for both wikilink and
markdown link types. The indexer already resolves markdown-style relative paths
against `sourcePath` using `normalizeVaultPath`. For the editor rendering pass,
links in the current visible chunk are resolved via `parseLinks`, with a
lightweight fallback (`resolveInternalMarkdownFallback`) for any edge cases
the indexer doesn't cover.

**Consequences:**
- A single resolution path — consistent behavior between wikilinks and
  markdown links: same broken-link indicator (dashed underline), same
  `onLinkClick` callback dispatch, same case-insensitive stem matching.
- No second lookup mechanism to maintain.
- `@app/editor` continues to consume only the `parseLinks` public API from
  `@app/indexer` — no cross-package internals touched.

### Decision 2: Unified `linkExtension` replaces `wikilinkExtension`; `wikilinkExtension` is a re-export alias

`wikilinkExtension.ts` now re-exports `linkExtension` as `wikilinkExtension`
for backward compatibility. The new `linkExtension` handles wikilinks,
markdown internal links, markdown external links, and `<autolink>` URLs in a
single coherent ViewPlugin — consistent with how bold/italic/etc. are handled
in `livePreviewExtension`.

Both `linkExtension` and `imageExtension` iterate over `view.visibleRanges`
per update (slicing the document chunk, running regex matches on the slice),
not the full document text. This keeps keystroke latency well within the 5 ms
target even on 1,000-line, 350-note documents with mixed links and images.

### Decision 3: Images load asynchronously with `loading="lazy"` and `decoding="async"`

`ImageWidget.toDOM()` sets both the property (`img.loading = "lazy"`) and the
HTML attribute (`img.setAttribute("loading", "lazy")`) to ensure compatibility
with JSDOM (tests) and the browser (Tauri WebView). Image loading is never
synchronous on the typing path. Active-line reveal suppresses the widget and
exposes raw Markdown, avoiding any re-render during fast typing.

## Space-escaping

Both `%20`-encoded URLs and `<angle-bracket>`-wrapped URLs with literal spaces
are handled:
- `sanitizeLinkDestination` strips `<>` wrappers before routing to external vs
  internal classification.
- `sanitizeImageUrl` does the same for `![alt](<url with spaces>)`.
- Tests verify that `decodeURI(img.src)` round-trips correctly for angle-bracket
  URLs.

## Image Dimension Syntax

`parseImageDimensions(rawAlt)` splits on the last `|` in the alt text:
- `![Logo|640x480](url)` → `{ alt: "Logo", width: 640, height: 480 }`
- `![Banner|300](url)` → `{ alt: "Banner", width: 300, height: undefined }` (auto height)
- `![800x600](url)` → `{ alt: "", width: 800, height: 600 }` (dimension-only, no alt text)

Width/height are applied as `style.width`/`style.height` on the `<img>` element
so they override CSS `max-width: 100%` only when explicitly requested.

## Internal vs. External Vault Images (`![[image.png]]`)

ADR-0062's gap table listed `![alt](url)` external image embeds as the Phase 4
scope. The `![[image.png]]` embed (Obsidian internal vault file embed) was
explicitly left out of scope for this phase — it requires vault-path-to-asset-URL
resolution (`convertFileSrc`), which is a desktop-layer concern. That belongs
in a later phase alongside the broader file-embed/transclusion feature.

## Consequences

- `@app/editor` now fully handles wikilinks, markdown internal/external links,
  autolinks, and external image embeds with dimension syntax.
- `wikilinkExtension` is backward-compatible (re-exports `linkExtension`).
- Keystroke latency measured at **4.627 ms** on the combined benchmark
  (1,000-line doc, 350 notes, 100 wikilinks, 50 markdown links, 50 images).
- No new npm dependency added; no indexer internals changed.
- 27 editor tests passing (8 Phase 4 + 10 Phase 3 + 5 horizontal rule + 4 line-break).
