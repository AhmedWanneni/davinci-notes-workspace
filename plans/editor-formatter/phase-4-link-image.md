# Implementation Plan — Phase 4: Links & Images (@app/editor)

Implementation of full link and image Markdown formatting, live-preview decorations, dimension parsing, and click handling in `@app/editor`.

## User Review Required

> [!NOTE]
> Per the user request, Markdown-style internal links `[text](path.md)` will resolve through the existing indexer lookup (`parseLinks` / `buildNoteNameIndex` / `notePaths`) consistent with wikilinks, and will share the same resolved/unresolved broken-link styling (`.cm-link-unresolved` dashed underline) and navigation behavior. This architecture decision will be recorded as ADR-0067.

## Proposed Changes

### `@app/editor` (`packages/editor/`)

#### [MODIFY] [editorTheme.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/editorTheme.ts)
- Add styling tokens and classes for:
  - `.cm-link`: accent color, pointer cursor.
  - `.cm-link-resolved`: standard link styling.
  - `.cm-link-unresolved`: dashed underline `border-bottom: 1px dashed var(--color-text-accent)` (broken link state).
  - `.cm-link-external`: external link styling.
  - `.cm-image-embed`: inline image container styling with responsive maximum width.
  - `.cm-image-error`: fallback styling for failed images with clean border styling.
- Update both `editorTheme` and `readOnlyEditorTheme`.

#### [NEW] [linkExtension.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/linkExtension.ts)
- Implement `linkExtension({ notePaths, sourcePath, onLinkClick, onExternalLinkClick })`:
  - Parses and decorates:
    1. **Wikilinks**: `[[Target]]`, `[[Target|Alias]]`, `[[Target#Heading]]`, `[[Target#^block]]`. Resolves against `notePaths`. Hides brackets and target segment off-active-line.
    2. **Markdown internal links**: `[text](path.md)`, `[text](../path.md)`, `[text](note)`. Resolves against `notePaths` / `sourcePath`. Shows broken-link state if unresolved.
    3. **External links**: `[text](https://...)`, `[text](<https://... with space>)`, `[text](https://...%20...)`, and autolinks `<https://...>`.
  - Space-escaping support for `%20` encoded and `<...>` wrapped URLs containing spaces.
  - Off-active-line syntax hiding: hides `[`, `](`, `url`, `)` delimiters, presenting clean clickable link text.
  - Click handling:
    - Internal/wikilink: calls `onLinkClick(targetRaw)`.
    - External: calls `onExternalLinkClick` or `window.open(url, "_blank", "noopener,noreferrer")`.
  - Re-export `wikilinkExtension` as a backward-compatible alias for existing consumers.

#### [NEW] [imageExtension.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/imageExtension.ts)
- Implement `imageExtension`:
  - Parses image syntax: `![alt](url)`, `![alt|WIDTHxHEIGHT](url)`, `![alt|WIDTH](url)`, `![WIDTHxHEIGHT](url)`, `![WIDTH](url)`.
  - Supports `<url with spaces>` and `%20` encoded URLs.
  - Defines `ImageWidget` (`WidgetType`):
    - Sets `img.loading = "lazy"` and `img.decoding = "async"` for non-blocking asynchronous loading.
    - Applies width and height styling directly based on parsed dimensions.
    - Handles `onerror` with fallback error indicator.
  - In Live Preview (`Editor`):
    - Off-active-line: replaces image Markdown range with `ImageWidget`.
    - Active line: reveals raw Markdown syntax for live editing.
  - In Read-Only mode (`MarkdownView`):
    - Always replaces image range with `ImageWidget`.

#### [MODIFY] [livePreviewExtension.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/livePreviewExtension.ts)
- Refine syntax delimiter decorations so they coordinate cleanly with `linkExtension` and `imageExtension`.

#### [MODIFY] [Editor.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/Editor.tsx) & [MarkdownView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/MarkdownView.tsx)
- Include `imageExtension` and updated `linkExtension`.
- Forward optional `onExternalLinkClick`.

#### [MODIFY] [index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/index.ts)
- Export `linkExtension`, `imageExtension`, and types.

---

### Tests & Documentation

#### [NEW] [linksAndImagesExtension.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/state/linksAndImagesExtension.test.tsx)
- Test suite covering:
  1. Wikilinks rendering, alias hiding, broken link indicator, and click dispatch.
  2. Markdown internal links resolution, broken link indicator, and click dispatch.
  3. External links: clickable, `%20` and `<...>` space escaping.
  4. External images: inline rendering, `|640x480` and `|100` dimension parsing, aspect ratio.
  5. Active line revealing and editing.
  6. Read-only `MarkdownView` rendering.
  7. Combinations/regressions: bolded wikilinks, links with italic inside, highlighted links, strikethrough links.

#### [MODIFY] [EditorBenchmark.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/state/EditorBenchmark.test.ts)
- Verify typing latency remains < 5ms with full link & image extensions.

#### [NEW] [0067-markdown-internal-links-and-image-embeds.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/adr/0067-markdown-internal-links-and-image-embeds.md) & [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Log ADR-0067 for internal markdown link resolution consistency and image embed dimension parsing.

#### [NEW] Changeset
- Add minor changeset for `@app/editor`.

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Update with Phase 4 completion and metrics.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @app/desktop test src/state/linksAndImagesExtension.test.tsx`
- Run `pnpm --filter @app/desktop test src/state/inlineFormattingExtension.test.tsx`
- Run `pnpm --filter @app/desktop test src/state/EditorBenchmark.test.ts`
- Run `pnpm --filter @app/editor typecheck && pnpm --filter @app/editor lint && pnpm --filter @app/editor build`
- Run `pnpm turbo run test`

### Manual / Integration Verification
- Verify that wikilinks, markdown internal links, external links, and images render correctly with active-line reveal in both `Editor` and `MarkdownView`.
