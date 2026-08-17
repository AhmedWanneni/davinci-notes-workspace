# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Canvas bugfix — FileCardNode TDZ circular import** resolved. Next up: Dogfooding `v0.1.0-rc.1` with canvas included.

## Last Session

**Fix: "Cannot access uninitialized variable" (FileCardNode) on new canvas open**

### Root cause — Category 1: Circular import (manifesting as Category 2)
Traced import graph for `FileCardNode` (ADR-0048 file-embed card, built Phase 6; extended in Phases 7/9 for image/PDF/nested-canvas sub-views):

```
canvasNodeTypes.ts
  → FileCardNode.tsx
    → NestedCanvasCardView.tsx   (static import)
      → ReadOnlyCanvasFlow.tsx
        → canvasNodeTypes.ts     ← cycle; FileCardNode still in TDZ
```

Opening any canvas tab loads `CanvasReactFlow` → `canvasNodeTypes` at module-eval time. `FileCardNode` was still mid-init when `canvasNodeTypes` tried to read it — classic TDZ error. Not a barrel (`index.ts`) cycle in this case; the `nodeTypes` registry file played the same role internally.

Category 3 (self-reference in FileCardNode) ruled out — `FileCardNodeComponent` is a function declaration, exported via `memo` after definition. Category 4: Vite production frontend build succeeds after fix; full Tauri build blocked by host disk space (ENOSPC), not by this change.

### Fix
- `FileCardNode.tsx`: lazy-load `NestedCanvasCardView` via `React.lazy` + `Suspense` (same pattern already used for `PdfCardView`). Breaks the static import chain so `canvasNodeTypes` can finish initializing `FileCardNode` before `ReadOnlyCanvasFlow` / `canvasNodeTypes` are pulled in.
- `FileCardNode.test.tsx`: nested-canvas test now `await screen.findByTestId(...)` for async lazy boundary.

### Verification
- `pnpm exec vitest run` in `packages/canvas`: **179/179 passing** (25 suites)
- `pnpm exec vite build` in `apps/desktop`: **succeeds** (production frontend bundle)
- Full `pnpm run build` (Tauri/Rust): **not run to completion** — host disk at ~100% capacity (ENOSPC)

### AGENTS.md caveat (flagged, not edited)
The barrel-export convention is fine for external consumers, but **within `packages/canvas`**, any module in the `nodeTypes` registry graph must not statically import (directly or transitively) back to `canvasNodeTypes` or the barrel. Card sub-views that need React Flow (nested canvas preview) should use `React.lazy` at the `FileCardNode` boundary — same rule as `PdfCardView`. Consider adding a one-line note to AGENTS.md if this bites again.

### Files changed
- `packages/canvas/FileCardNode.tsx` — lazy `NestedCanvasCardView`
- `packages/canvas/FileCardNode.test.tsx` — async assertion for lazy nested canvas
- `apps/desktop/src/App.tsx` — prior session: remove broken `prompt()` for new canvas
- `apps/desktop/src/vault/useVaultSession.ts` — prior session: immediate untitled canvas creation

---

### 1. Icon Rail Entry Point
- Added `onCreateCanvas?: () => void` prop to `IconRailProps` and rendered a `FrameCorners` Phosphor-icon button (regular weight, 18px) in the top rail group, conditionally gated to the existing action prop.
- Wired through `App.tsx` to the existing `handleCreateCanvasPrompt` function, which reuses the Phase 1 `createNewCanvas` logic in `useVaultSession` (empty `{nodes:[],edges:[]}` JSON → `.canvas` file → opens as tab).

### 2. File Tree Integration (verified pre-existing + confirmed)
- `.canvas` files already have a distinct `FrameCorners` Phosphor icon in `FileTree.tsx` (line 90 detection, line 149-150 render).
- Display title strips both `.md` and `.canvas` extensions (line 99).
- Clicks route through `onNoteClick(item.node.path)` → `openNote(path)` for any file type (line 128).
- `@tanstack/react-virtual` virtualization is file-type-agnostic — operates on the flattened `visibleNodes` array; no row size or measure logic depends on extension.
- HTML5 `draggable` + `onDragStart` already includes canvas files for D&D embed into canvas (ADR-0049).
- `AppSidebar` header already included a `New Canvas` FrameCorners action alongside the `New Note` button.

### 3. Tab Bar Integration
- **Tab icons**: Added `isCanvas = path.endsWith(".canvas")` per tab in `AppTabs.tsx`; prepends a `FileText`/`FrameCorners` 13px Phosphor icon inside `.app-tabs__tab-icon` span (new styled rule in `_tabs.scss`).
- Display title already strips `.canvas` extension.
- **Save flush on close**: `useWorkspaceStore.closeNote()` already clears pending `saveTimers[path]` then calls `saveNoteNow(path)` synchronously BEFORE updating `openNotes/activeNotePath`; canvas mutations flow via `EditorArea.tsx`'s `onContentChange={(p,c) => updateNoteContent(p,c)` with the same 750ms debounce used for notes, so canvas tabs benefit from the identical save discipline.

### 4. Right-Sidebar/StatusBar Behavior (ADR-0057)
**Decision**: Explicit "not applicable for canvas" per-section empty states — option 3 evaluated and recorded in ADR-0057.
- `RightSidebar.tsx`: added `isCanvasActive = activePath?.endsWith(".canvas")`. Three sections gated:
  - Linked mentions: → "Canvas files do not have linked mentions" (replaces BacklinksPanel + Unlinked subsection).
  - Outline: → "Canvas outline not available" (replaces `NoteOutline` markdown heading parser on JSON content).
  - Local Graph: → "Local graph not available for canvas" (replaces `LocalGraphPanel`).
  Collapse toggles and layout preserved — no hide/reshow jank switching note ↔ canvas tabs.
- `StatusBar.tsx`: same `isCanvas` gate; when active shows single "Canvas file" chip instead of misleading note stats (backlink/property/word/char counts computed from markdown frontmatter+body are meaningless for JSON canvas).
- `PropertiesBlock`/editor already branch-gated: lives only in the non-canvas subtree inside `EditorArea.tsx` (pre-existing correct separation).

### 5. Lazy-Load Boundary Re-verified (ADR-0041)
- Grep `apps/desktop/src` + `apps/desktop`: **1 total `@app/canvas` reference — only dynamic `import("@app/canvas")` inside `React.lazy()` in `EditorArea.tsx`.
- Vite build chunks confirm:
  - **Entry JS**: `index-D9tyl52t.js` = 21.08 KB raw / **7.71 KB gzip** — matches the ADR-0041 baseline exactly. **Zero canvas/ReactFlow/PDF.js in first paint.**
  - Canvas code: `vendor-canvas-CL11XwPH.js` = 173.61 KB raw / 56.37 KB gzip (separate lazy chunk loaded only on first canvas open).
  - PDF code double-gated: `PdfCardView-Bd2RSY7L.js` = 330.32 KB / 97.33 KB gzip + `pdf.worker.min-*.mjs` 1.3 MB (loaded only when first PDF card mounts inside a canvas).
- `vendor-canvas-7ZgWJ5_7.css` split separately.
Total-JS/CSS budget "total" thresholds exceeded are pre-existing condition (editor vendor chunk + canvas chunk counted toward total despite not in entry); the actual first-paint entry is well within 250KB raw / 80KB gzip limits.

### Quality & Pre-existing Fixes
- `usePdfDocumentLoader.ts:34`: `loading.onProgress = undefined` → `() => {}` (TS `Function` type incompatibility — pre-existing, broke desktop `tsc --noEmit`.
- `CanvasView.tsx:1`: removed unused `useState` import — pre-existing lint error.

### Files Changed
- `apps/desktop/src/components/IconRail/IconRail.tsx` — add onCreateCanvas prop + FrameCorners rail button
- `apps/desktop/src/components/AppTabs/AppTabs.tsx` — tab canvas/note type icon
- `apps/desktop/src/styles/layout/_tabs.scss` — .app-tabs__tab-icon CSS rule
- `apps/desktop/src/components/RightSidebar/RightSidebar.tsx` — ADR-0057 isCanvasActive gating per section
- `apps/desktop/src/components/StatusBar/StatusBar.tsx` — ADR-0057 isCanvas gate for stats vs "Canvas file" chip
- `apps/desktop/src/App.tsx` — wire onCreateCanvas={handleCreateCanvasPrompt} to IconRail
- `packages/canvas/usePdfDocumentLoader.ts` — trivial TS fix: onProgress no-op fn instead of undefined
- `packages/canvas/CanvasView.tsx` — trivial lint: remove unused useState import
- `docs/adr/0057-canvas-right-sidebar-panel-behavior.md` — new ADR
- `DECISIONS.md` — Canvas table: add ADR-0057 row
- `PROGRESS.md` — updated

### Verification Results
- 179/179 canvas tests passing across 25 test suites
- Desktop `tsc --noEmit` ✓ (0 type errors after onProgress fix)
- Desktop lint clean; only remaining canvas lint error is the pre-existing `CanvasBenchmark.test.ts` boundaries/no-private (deferred item 7 below)
- Build + bundle size audit: entry JS 7.71 KB gzip (canvas lazy chunk 56 KB, PDF further nested 97 KB) — ADR-0041 lazy boundary held through all integration
- Manual verification checklist items covered by code-path analysis (this session, not live dogfooding):
  - New canvas from rail: creates empty `.canvas`, opens tab ✓ (wired to proven existing flow)
  - File tree: .canvas visually distinct, opens canvas tab ✓
  - Note↔canvas tab switch: no stale right-panel leak; panels show ADR-0057 messages ✓
  - Close dirty canvas tab: closeNote flushes pending saveTimers + saveNoteNow synchronous ✓
  - Lazy boundary: entry bundle zero canvas code ✓
  - End-to-end canvas features: rendering/cards/edges/groups/export already verified in Phases 1–12 tests (179 passing)

---

## Canvas Feature v1 — Complete

### Included (all 13 phases delivered)
- **Package & Data Model**: `@app/canvas` workspace package, strict JSON Canvas 1.0, lazy-loaded (ADR-0041)
- **Canvas Shell**: pan/zoom (React Flow), 750ms debounced save, viewport not persisted (ADR-0042)
- **Text cards**: native `<textarea>` create/move/resize/edit/delete (ADR-0043)
- **Edges**: token palette, hover handles, midpoint labels, cascade delete (ADR-0044)
- **Selection & Arrangement**: Shift axis-lock, align/spread, internal-only duplicate edges (ADR-0045)
- **Groups**: runtime parentNode/extent containment, 10-level nesting cap, cascade delete propagation (ADR-0046, 0047)
- **Markdown file embeds**: CodeMirror 6 read-only live preview reuse, heading narrowing, swap/convert (ADR-0048); file-tree D&D (ADR-0049)
- **Media cards**: path-reference image/video, paste+external-drop → vault attachments, aspect-ratio lock (ADR-0050, 0051)
- **Performance**: `onlyRenderVisibleElements` + ReactFlow virtualization, Map-indexed group traversals (ADR-0052)
- **PDF cards**: `pdfjs-dist` double-gated lazy boundary, continuous-scroll canvas rendering (ADR-0053)
- **Webpage embeds**: `link` node type; iframe `sandbox` security whitelist + YouTube player transform (ADR-0054)
- **Nested canvases**: runtime ancestor cycle detection + depth cap 3, read-only preview (ADR-0055)
- **Export**: viewport + full-canvas PNG via html-to-image; webpage card fallback placeholder (ADR-0056)
- **App Integration**: rail+tree+tabs+right-panel wiring, sidebar behavior settled ADR-0057, lazy boundary re-verified (Phase 13)

### Canvas v1 — Explicitly NOT Included (deferred / out of scope per plan)
- **Real-time collaborative canvas editing** (per ADR-0008 manifest-diff sync philosophy; single-user multi-device only)
- **Plugin API / extensibility for canvas** (deferred indefinitely alongside core app plugin system)
- **Mobile canvas** (desktop first; mobile canvas is its own scoped effort once desktop proven)
- **Canvas card-outline panel in right sidebar** (currently "not available" placeholder per ADR-0057; low-effort card listing can slot into existing branch later)
- **Canvas-local graph panel in right sidebar** (not available per ADR-0057; can revisit with canvas-card-edge graph)

## Next Up (in order)

1. **Dogfooding `v0.1.0-rc.1` for daily note-taking + canvas workflows together.
2. **Unlinked Mentions Detection**: vault-wide scanner / FTS for plain-text mentions of the active note's title.
3. **Inline Property Editing**: interactive property add/edit in `PropertiesBlock` with frontmatter serialization to disk.
4. **Outline Scroll Synchronization**: connect `NoteOutline` heading clicks to CodeMirror 6 scroll/cursor dispatch.
5. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`).
6. Set up Chromatic or Playwright screenshot regression for `components/`.
7. Fix pre-existing lint error: `CanvasBenchmark.test.ts` boundaries/no-private (import from fixtures subfolder)

## Deferred Performance Items (canvas Phase 8 follow-ups)

- **Edge visibility with culling**: If `onlyRenderVisibleElements` causes artefacts where edge source is visible but target is off-screen (edge not rendered), revisit with a custom edge visibility strategy. Not observed in testing but worth watching during dogfood.
- **Alignment spatial indexing**: If canvas regularly exceeds 500+ nodes, replace the linear `otherNodes` scan in `snapNodeAlignment` with a spatial index (e.g. R-tree). Not warranted at 120 nodes.

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` in `tauri.conf.json` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex in `Badge.module.scss` — need confirmed Obsidian semantic palette values or new token entries.
- **Visual regression**: Chromatic account or Playwright screenshot CI not yet configured.
- **Total JS/CSS size budgets**: configured in `check-bundle-size.mjs` count lazy-loaded chunks (editor vendor + canvas + PDF nested all sum to totals that exceed the original "total" budgets even though they never ship in first paint. Adjust to only-paint-budget-only or move lazy-chunk ceiling if/when configured.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.
