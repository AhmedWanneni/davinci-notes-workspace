# Implementation Plan — Canvas Phase 7: Image and Video Cards

Phase 7 adds image and video card support to `@app/canvas` adhering strictly to the JSON Canvas 1.0 open specification, ADR-0004's plain-file philosophy (path-based file references, never base64), and the project's performance guidelines.

---

## User Review Required

> [!IMPORTANT]
> **Media Node Data Model**: In JSON Canvas 1.0, media cards (images and videos) use the exact same `CanvasFileNode` (`type: "file"`, `file: "path/to/media.ext"`) as markdown note embeds. No new node type is introduced.
>
> **Plain File Reference (No Base64)**: Consistent with ADR-0004, media cards store only a relative file path (e.g. `attachments/diagram.png` or `recordings/demo.mp4`) in the `.canvas` JSON file. Binary media is never serialized directly into `.canvas` files.
>
> **Rendering & Fit Choice**:
> - **Images**: Standard `<img>` with `object-fit: contain`, `loading="lazy"`, `decoding="async"`. `contain` is chosen to avoid unexpected cropping of user diagrams, charts, and photos during card resizing.
> - **Videos**: Standard `<video>` with `controls`, `preload="metadata"`, and `object-fit: contain`.
>
> **Resize Behavior**:
> - **Images**: Aspect-ratio-locked by default (`keepAspectRatio={true}` on `NodeResizer`) to prevent distortion, snapping width and height to the 24px grid on resize completion.
> - **Videos & Notes**: Free-form resizing (`keepAspectRatio={false}`).
>
> **Media Creation Paths**:
> 1. **File Tree Drag & Drop**: Dragging any media file from the file tree sidebar onto the canvas.
> 2. **Clipboard Paste**: Pasting image data (`Cmd+V` / `Ctrl+V`) onto the canvas. Binary bytes are written to the active vault under `attachments/Pasted image YYYYMMDDHHMMSS.png` using a new `write_binary_file` Tauri command, and a `CanvasFileNode` referencing that path is created at the viewport center / cursor position.
> 3. **OS File Drag & Drop**: Dropping external image/video files into the canvas saves them into `attachments/` and creates canvas cards at the drop coordinates.

---

## Proposed Changes

### 1. Media Model, Utilities & Subcomponents (`packages/canvas`)

#### [NEW] [mediaCardUtils.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/mediaCardUtils.ts)
- `getFileCardType(filePath: string): "markdown" | "image" | "video" | "unknown"`
- Helper lists for supported image extensions (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`, `.ico`, `.avif`) and video extensions (`.mp4`, `.webm`, `.ogg`, `.ogv`, `.mov`, `.mkv`, `.m4v`).
- `generatePastedMediaFilename(extension: string): string` generating `attachments/Pasted image YYYYMMDD-HHmmss.png`.

#### [NEW] [useMediaUrl.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useMediaUrl.ts)
- Hook to resolve vault-relative file paths into renderable URLs using `resolveMediaUrl` from `CanvasEditorContext`, with fallback for tests and relative paths.

#### [NEW] [MediaCardView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/MediaCardView.tsx)
- Renders standard `<img>` or `<video>` elements with error fallback if missing or corrupted.
- Uses `loading="lazy"`, `decoding="async"`, and `preload="metadata"`.

#### [NEW] [FileCardHeader.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardHeader.tsx)
- Extracted from `FileCardNode.tsx` to keep files under the 200-line soft cap.
- Displays dynamic icon (`Image`, `Video`, or `FileText`), filename title, subpath badge (for markdown), and action buttons (swap file, open file, narrow to heading for markdown).

#### [MODIFY] [FileCardNode.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardNode.tsx)
- Refactored to coordinate `FileCardHeader`, `MarkdownView` (for `.md`), and `MediaCardView` (for images/videos).
- Applies `keepAspectRatio={isImage}` on `NodeResizer`.
- Line count reduced from 242 lines to ~120 lines.

#### [MODIFY] [FileCardNode.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardNode.module.scss)
- Styles for media container, `<img>` (`object-fit: contain`), `<video>`, and broken media error state using design tokens.

---

### 2. Canvas Interactions, Drag & Drop, and Clipboard Paste

#### [NEW] [useCanvasDropPaste.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/useCanvasDropPaste.ts)
- Handles `onDragOver`, `onDrop` (both internal note drag and external file drops), and `onPaste` (wikilink paste and image blob paste).
- Saves pasted/dropped images via `onSaveMediaFile` and calls `createFileCard`.

#### [MODIFY] [CanvasEditorContext.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasEditorContext.ts)
- Adds `resolveMediaUrl?: (path: string) => string | Promise<string>` and `onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>`.

#### [MODIFY] [CanvasView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.tsx)
- Incorporates `useCanvasDropPaste`, keeping `CanvasView.tsx` under 200 lines.

---

### 3. Desktop Shell & Vault Asset I/O (`apps/desktop` & `src-tauri`)

#### [MODIFY] [fs.rs](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src-tauri/src/fs.rs)
- Extend `collect_markdown_paths` to include supported media extensions (`png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, `mp4`, `webm`, etc.) so media files inside vault folders appear in the file tree and can be dragged onto the canvas.
- Add `write_binary_file(app: AppHandle, path: String, data: Vec<u8>) -> Result<(), String>` using vault path resolution and automatic parent directory creation.

#### [MODIFY] [lib.rs](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src-tauri/src/lib.rs)
- Register `fs::write_binary_file` in Tauri invoke handler.

#### [MODIFY] [vaultCommands.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/vault/vaultCommands.ts)
- Add `writeBinaryFile(path: string, data: Uint8Array): Promise<void>`.

#### [MODIFY] [FileTree.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/FileTree/FileTree.tsx)
- Render `Image` / `Video` icons for media rows in the file tree.

#### [MODIFY] [EditorArea.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EditorArea/EditorArea.tsx)
- Provide `resolveMediaUrl` using `convertFileSrc` and `onSaveMediaFile` using `writeBinaryFile` to `CanvasView`.

---

### 4. Tests & Documentation

#### [NEW] [MediaCardView.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/MediaCardView.test.tsx)
- Unit tests for image rendering (`object-fit`, `loading="lazy"`), video rendering (`controls`, `preload="metadata"`), error fallback, and media classification.

#### [MODIFY] [FileCardNode.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/FileCardNode.test.tsx)
- Tests for file card rendering with images and videos, file swapping, and aspect ratio prop binding.

#### [MODIFY] [CanvasView.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.test.tsx)
- Test dragging and dropping media paths and pasting images onto the canvas.

#### [NEW] `docs/adr/0050-canvas-media-cards-path-references.md`
- Log ADR for path-based media referencing and lazy `<img>`/`<video>` rendering.

#### [NEW] `docs/adr/0051-canvas-clipboard-paste-and-external-media-vault-storage.md`
- Log ADR for saving pasted/dropped binary assets into `attachments/` folder.

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md) & [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Append new ADRs in the Canvas table and update progress log.

---

## Verification Plan

### Automated Tests
1. Run canvas package unit tests:
   ```bash
   pnpm --filter @app/canvas test
   ```
2. Run full monorepo test suite:
   ```bash
   pnpm test
   ```
3. Run lint check:
   ```bash
   pnpm lint
   ```
4. Run type check:
   ```bash
   pnpm --filter @app/canvas typecheck && pnpm --filter @app/desktop typecheck
   ```

### Manual Verification Flow
1. **Drag media file**: Drag an image (`.png`/`.jpg`) or video (`.mp4`/`.webm`) from the sidebar file tree onto the canvas -> verifies card is created with media icon, title, and proper rendering.
2. **Resize card**: Resize image card -> verifies aspect ratio is locked and snaps to grid; resize video card -> verifies free-form resizing.
3. **Paste image**: Copy an image to clipboard, click canvas, press `Cmd+V` -> verifies image is written to `attachments/` on disk as a `.png` file, card is created, and `.canvas` file contains relative path `attachments/Pasted image...`.
4. **Persistence round-trip**: Close and reopen canvas tab -> verifies all media cards reload with correct file references.
