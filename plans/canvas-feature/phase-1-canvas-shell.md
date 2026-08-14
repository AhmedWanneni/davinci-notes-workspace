# Canvas Feature: Phase 1 — Canvas Shell

This plan defines the step-by-step implementation for **Phase 1 (Canvas Shell)** of the Canvas feature per `plans/canvas-feature-plan.md` and the standing guidelines in `AGENTS.md`, `DECISIONS.md`, and `PERFORMANCE.md`.
---

## User Review Required

> [!IMPORTANT]
> **Persisted State & Viewport Position Decision**:
> - Per the official **JSON Canvas 1.0** specification, standard `.canvas` files exclusively persist `nodes` and `edges` arrays. Viewport/pan/zoom coordinates are intentionally not serialized into the `.canvas` file to preserve 100% interoperability with Obsidian and other JSON Canvas tools.
> - On opening a canvas, the canvas shell automatically utilizes React Flow's `fitView` to center and frame the content cleanly.
> - If an empty canvas is loaded, it defaults to `{ nodes: [], edges: [] }`.

> [!IMPORTANT]
> **Translation Layer Location & Scope**:
> - We place the bidirectional translation layer (`jsonCanvasToReactFlow` and `reactFlowToJsonCanvas`) inside `packages/canvas` ([canvasTranslation.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasTranslation.ts)).
> - This translation layer is pure TypeScript, 100% unit-tested with zero React rendering overhead, and guarantees lossless round-trip fidelity between the JSON Canvas file format and React Flow's internal state.

---

## Proposed Changes

### 1. Translation Layer & React Flow Integration in `@app/canvas`

#### [NEW] [packages/canvas/canvasTranslation.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasTranslation.ts)
- `jsonCanvasToReactFlow(data: CanvasData)`: Converts JSON Canvas `nodes` and `edges` to React Flow `Node` and `Edge` objects.
- `reactFlowToJsonCanvas(nodes: Node[], edges: Edge[])`: Converts React Flow state back to spec-compliant `CanvasData`.
- Pure functions, fully unit-testable in isolation.

#### [NEW] [packages/canvas/canvasTranslation.test.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/canvasTranslation.test.ts)
- Unit tests verifying:
  - Empty canvas translation (`{ nodes: [], edges: [] }` ↔ `nodes: [], edges: []`).
  - Lossless round-trip conversion for all node variants (`text`, `file`, `link`, `group`) and edge attributes (`fromSide`, `fromEnd`, `toSide`, `toEnd`, `color`, `label`).

#### [MODIFY] [packages/canvas/CanvasView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.tsx)
- Replace placeholder stub with the real React Flow canvas shell:
  - `<ReactFlowProvider>` + `<ReactFlow>` instance.
  - Pan navigation: `Space + Drag`, `Middle-Click Drag`, `Right-Click Drag`.
  - Zoom controls: `Ctrl/Cmd + Scroll`, `zoomOnPinch`, and `fitView` toolbar control.
  - Empty state UI: subtle editorial overlay when `nodes.length === 0` explaining navigation and canvas readiness.
  - Background grid dots matching design system tokens (`--color-border-subtle`).
  - Debounced content change notifications to the consumer for disk persistence.

#### [NEW] [packages/canvas/CanvasView.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/CanvasView.module.scss)
- SCSS module for Canvas View, Controls, Background, and Empty State styling using `@app/design-system` CSS variables (strict CUBE/BEM naming, no raw hex values, no gradients/shadows).

#### [MODIFY] [packages/canvas/index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/canvas/index.ts)
- Re-export `jsonCanvasToReactFlow`, `reactFlowToJsonCanvas`.

---

### 2. Desktop App Integration & File System Support

#### [MODIFY] [apps/desktop/src-tauri/src/fs.rs](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src-tauri/src/fs.rs)
- Update `collect_markdown_paths` to include both `.md` and `.canvas` files so `.canvas` files appear in `list_notes`, vault index, and file tree.

#### [MODIFY] [apps/desktop/src-tauri/src/watcher.rs](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src-tauri/src/watcher.rs)
- Update watcher event filtering to include `.canvas` files alongside `.md` files.

#### [MODIFY] [apps/desktop/src/vault/useVaultSession.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/vault/useVaultSession.ts)
- Add `createNewCanvas(title?: string)` callback writing valid initial `{ nodes: [], edges: [] }` JSON Canvas files.

#### [MODIFY] [apps/desktop/src/components/AppSidebar/AppSidebar.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/AppSidebar/AppSidebar.tsx)
- Add "New canvas" action button next to "New note".

#### [MODIFY] [apps/desktop/src/components/FileTree/FileTree.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/FileTree/FileTree.tsx)
- Handle `.canvas` extensions in display title trimming and render distinct canvas icon (`SquareHalf` / `FrameCorners`) from `@phosphor-icons/react`.

#### [MODIFY] [apps/desktop/src/components/AppTabs/AppTabs.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/AppTabs/AppTabs.tsx)
- Handle `.canvas` extension in display titles.

#### [MODIFY] [apps/desktop/src/components/EditorArea/EditorArea.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EditorArea/EditorArea.tsx)
- Wire `LazyCanvasView` with `path`, `initialContent`, and `onContentChange` to utilize the existing debounced `updateNoteContent` persistence workflow.

---

### 3. Documentation & Decision Log

#### [MODIFY] [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md)
- Log Phase 1 architectural decisions:
  - Translation layer design and location in `packages/canvas`.
  - JSON Canvas spec adherence regarding viewport position (not persisted in `.canvas` files for standard interop).
  - Canvas save debounce reusing existing 750ms store mechanism.

#### [MODIFY] [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md)
- Log Phase 1 completion, bundle analysis metrics, and next steps (Phase 2 — Text Cards).

---

## Verification Plan

### Automated Tests
1. **Translation Layer Unit Tests**:
   - `pnpm turbo run test --filter=@app/canvas`
   - Validates `jsonCanvasToReactFlow` and `reactFlowToJsonCanvas` round-trip fidelity.
2. **Monorepo-wide Tests & Typechecks**:
   - `pnpm turbo run test`
   - `pnpm turbo run typecheck`
   - `pnpm turbo run lint`
3. **Bundle Size Audit**:
   - `pnpm --filter @app/desktop build:web`
   - `node scripts/check-bundle-size.mjs`
   - Confirm that `@app/canvas` and `@xyflow/react` remain strictly in an asynchronous chunk and the initial entry JS chunk remains <250 KB / <80 KB gzip.

### Manual Verification
1. **New Canvas Creation**:
   - Click "New canvas" in the sidebar.
   - Confirm a new `.canvas` file is created with `{ "nodes": [], "edges": [] }` and immediately opened in a new tab.
2. **Pan & Zoom Interaction**:
   - Pan via Space+Drag and Middle-Click Drag.
   - Zoom via Wheel / Trackpad Pinch and verify smooth 60fps pan/zoom.
   - Click "Fit View" in the canvas controls.
3. **Persistence Round-Trip**:
   - Close tab or switch notes.
   - Reopen the `.canvas` file and verify it loads correctly.
