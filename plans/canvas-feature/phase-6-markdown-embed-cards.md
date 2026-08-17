# Implementation Plan — Canvas Phase 6: Markdown File Embed Cards

Embed existing vault notes as canvas cards, reusing the existing CodeMirror 6 live-preview markdown renderer from `@app/editor` (read-only mode), supporting drag-and-drop from the file tree, file swapping, text-card-to-file conversion, live syncing across edits, and heading narrowing.

## User Review Required

> [!NOTE]
> - **Renderer reuse**: Following ADR-0003, ADR-0027, and `PERFORMANCE.md`, we will reuse CodeMirror 6 in read-only mode (`EditorState.readOnly.of(true)`, `EditorView.editable.of(false)`) without `history`, `keymap`, or `autocomplete`. This adds **0 KB** new dependencies, avoids shipping a second markdown parser (e.g. `marked`/`remark`), and delivers 100% visual consistency with the main note editor.
> - **Native HTML5 Drag and Drop**: Note rows in `FileTree` become draggable with MIME type `application/vnd.davinci.note` (and `text/plain` fallback). Dropping on `CanvasView` computes canvas coordinates via React Flow's `screenToFlowPosition` and creates a file-embed card.
> - **Heading narrowing (`subpath`)**: Implemented via a pure regex-based markdown section extractor (`extractSectionByHeading`), allowing cards to embed specific headings (e.g. `# Architecture`) up to the next heading of equal/higher level.

## Open Questions

None. The JSON Canvas 1.0 spec (`type: "file"`, `file: string`, `subpath?: string`) and existing project architecture provide all required primitives.

---

## Proposed Changes

### Editor Package (`packages/editor`)

#### [NEW] [editorTheme.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/editorTheme.ts)
- Extract `editorTheme` and `editorHighlightStyle` from `Editor.tsx` so both the full editor and the read-only markdown renderer share identical syntax styling while keeping file line counts under 150 lines.

#### [MODIFY] [Editor.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/Editor.tsx)
- Import `editorTheme` and `editorHighlightStyle` from `editorTheme.ts`.

#### [NEW] [MarkdownView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/MarkdownView.tsx)
- Lightweight read-only CodeMirror markdown view component.
- Uses `EditorState.readOnly.of(true)`, `EditorView.editable.of(false)`, `markdown()`, `syntaxHighlighting(editorHighlightStyle)`, `livePreviewExtension`, and `wikilinkExtension`.
- Read-only DOM styling (no cursor/caret, scrollable body, wikilink navigation).

#### [MODIFY] [index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/index.ts)
- Export `MarkdownView`, `MarkdownViewProps`, `editorTheme`, `editorHighlightStyle`.

---

### Canvas Package (`packages/canvas`)

#### [MODIFY] [package.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/package.json)
- Add `@app/editor: "workspace:*"` dependency.

#### [MODIFY] [vitest.config.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/vitest.config.ts)
- Add alias for `@app/editor` and `@app/indexer`.

#### [MODIFY] [canvasConstants.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasConstants.ts)
- Add `DEFAULT_FILE_CARD_WIDTH = 400`, `DEFAULT_FILE_CARD_HEIGHT = 320`, `MIN_FILE_CARD_WIDTH = 200`, `MIN_FILE_CARD_HEIGHT = 120`, and `createFileCardId()`.

#### [NEW] [subpathUtils.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/subpathUtils.ts)
- Pure functions `extractSectionByHeading(content, subpath)` and `extractHeadings(content)` for heading narrowing.

#### [NEW] [subpathUtils.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/subpathUtils.test.ts)
- Unit tests verifying section extraction across H1–H6 levels, code block ignoring, and whitespace normalization.

#### [NEW] [FileCardNode.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardNode.module.scss)
- SCSS module for file cards: header bar (icon, title, subpath badge, action buttons), scrollable body (`nopan`), selection/color borders, handles.

#### [NEW] [FileCardNode.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardNode.tsx)
- React Flow custom node for `type: "file"`.
- Renders `MarkdownView` with note content from store/cache, heading subpath extraction, grid-snapped `NodeResizer`, 4 connection handles, and header actions (Open note, Swap file, Narrow heading).

#### [NEW] [FileCardNode.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardNode.test.tsx)
- Unit tests verifying file card rendering, subpath handling, missing file fallback, and action buttons.

#### [MODIFY] [canvasNodeTypes.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasNodeTypes.ts)
- Register `file: FileCardNode`.

#### [MODIFY] [CanvasEditorContext.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasEditorContext.ts)
- Extend context with `allNotePaths`, `notesContent`, `readNoteContent`, `onOpenFile`, `onNodeFileChange`, `onCreateNote`, `onConvertTextCardToFile`.

#### [NEW] [useCanvasFileOps.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasFileOps.ts)
- Extracted hook for file-node operations: `createFileCard`, `swapNodeFile`, `convertTextCardToFile`, and note content resolution/caching.

#### [MODIFY] [CanvasContextMenu.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasContextMenu.tsx) & [useCanvasContextMenu.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasContextMenu.ts)
- Context menu options:
  - File node: Color swatch, "Swap file", "Open note in editor", "Delete card".
  - Text node: Color swatch, "Convert to note", "Delete card".
  - Canvas pane: "Add text card", "Add note embed", "Add group".

#### [MODIFY] [useCanvasInteractions.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasInteractions.ts)
- Wire `useCanvasFileOps` into canvas interactions, drag-and-drop, and context menu.

#### [MODIFY] [CanvasView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.tsx)
- Accept `allNotePaths`, `notesContent`, `readNoteContent`, `onOpenFile`, `onCreateNote`.
- Handle HTML5 `onDragOver` and `onDrop` for dragging notes from sidebar to canvas.
- Support paste for wikilinks/paths.

#### [MODIFY] [CanvasView.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.test.tsx)
- Integration tests for file node rendering, drag-and-drop file card creation, context menu convert/swap actions.

#### [MODIFY] [index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/index.ts)
- Re-export `FileCardNode`, file constants, `subpathUtils`.

---

### Desktop App (`apps/desktop`)

#### [MODIFY] [FileTree.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/FileTree/FileTree.tsx)
- Enable `draggable={isFile}` and `onDragStart` with `application/vnd.davinci.note` and `text/plain`.

#### [MODIFY] [EditorArea.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EditorArea/EditorArea.tsx)
- Pass `allNotePaths`, `notesContent`, `readNoteContent` (`readNote`), `onOpenFile` (`openNote`), `onCreateNote` to `LazyCanvasView`.

---

### Project Configuration & Documentation

#### [MODIFY] [.eslintrc.js](file:///Users/ahmedwaanneni/Desktop/davinci-notes/.eslintrc.js)
- Allow `canvas` package to import from `editor` in boundaries configuration.

#### [NEW] [docs/adr/0048-reuse-codemirror-readonly-renderer-for-canvas-file-embeds.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/adr/0048-reuse-codemirror-readonly-renderer-for-canvas-file-embeds.md)
- ADR documenting the decision to reuse CodeMirror 6 read-only live preview for file embeds rather than adding a second markdown parser.

#### [NEW] [docs/adr/0049-html5-drag-and-drop-for-canvas-file-embeds.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/adr/0049-html5-drag-and-drop-for-canvas-file-embeds.md)
- ADR documenting the scoped HTML5 Drag and Drop interaction for note-to-canvas creation.

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Add ADR-0048 and ADR-0049 to Canvas decisions table.

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Update Current Focus, Last Session, and Next Up.

---

## Verification Plan

### Automated Tests
- Run `npm test` across all packages (`@app/indexer`, `@app/design-system`, `@app/editor`, `@app/canvas`, `@app/desktop`).
- Run `npm run lint` across the monorepo to enforce ESLint boundaries, file length limits (≤250 lines), and naming conventions.

### Manual / Integration Verification
- Verify file node data round-tripping with JSON Canvas 1.0 files (`file`, `subpath`, `x`, `y`, `width`, `height`, `color`).
- Verify drag-and-drop from `FileTree` onto canvas creates a file node at drop coordinates.
- Verify live synchronization: editing an open note in `useWorkspaceStore` immediately reflects in the canvas file card.
- Verify "Swap file" and "Convert text card to file" flows.
- Verify heading narrowing extracts the exact heading section up to the next heading of same/higher level.
- Verify resize reflow and handle connections on file cards.
