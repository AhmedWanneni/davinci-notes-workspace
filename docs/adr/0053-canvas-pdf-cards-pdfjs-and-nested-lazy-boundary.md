# ADR-0053: Canvas PDF cards — pdfjs-dist + nested lazy-load boundary

## Status
Accepted

## Context
Canvas Phase 9 adds PDF file embed cards. PDF.js (pdfjs-dist) is the standard
OSS choice for in-browser/webview PDF rendering but is not small — the cost
must not be paid by every canvas, only those actually containing PDF cards.

### Size audit (verified before commit)
| Package | Min | Min+gzip | Notes |
|---|---|---|---|
| `pdfjs-dist@4.10.38` (core) | ~286 KB | ~75 KB | `build/pdf.min.mjs` |
| `pdfjs-dist` worker | ~165 KB | ~46 KB | separate chunk, loaded by browser on demand |
| **Effective total, first visible PDF card** | ~451 KB | **~121 KB** | worker + core |

No existing PDF-handling dependency exists in the project (grep for
`pdfjs`, `react-pdf`, `pdf-lib` across all `package.json` files — zero
matches), so no duplication risk.

### Alternatives considered
1. **`<object>/<iframe>` to native browser PDF viewer** — zero bundle cost
   but UI is browser-dependent, no control over zoom mode / scroll
   continuity, and file-path access through Tauri's `tauri://` asset
   protocol would require extra workaround. Rejected: inconsistent with
   the design system and insufficient control inside a small card frame.
2. **`react-pdf` wrapper** — convenient `<Document>/<Page>` component API
   but adds ~15–25 KB wrapper gzip on top of the same pdfjs-dist core,
   and its page-at-a-time `<Page>` model fights the continuous-scroll UX
   we want for a card. Rejected: weight + wrong UX model for the use case.
3. **`@react-pdf/renderer`** — 471 KB gzip, *generates* PDFs rather than
   rendering existing ones. Wrong tool entirely.

## Decision
1. **Dependency**: add `pdfjs-dist@^4.10.38` as a dependency of
   `@app/canvas` only — never of `@app/editor`, core, or apps/desktop.
2. **Data model**: no new node type. PDFs are the existing `file` node
   variant per JSON Canvas 1.0, distinguished by `.pdf` extension in
   `data.file`, parallel to images/videos. New entry `"pdf"` added to
   `FileCardType` union and `mediaCardUtils.ts` extension set.
3. **Nested lazy-load boundary (double-gated)**:
   - Gate 1 (pre-existing, ADR-0041): `@app/canvas` + React Flow load
     lazily via `React.lazy` when the user opens a `.canvas` tab.
   - Gate 2 (new, this ADR): `PdfCardView.tsx` — the component that
     actually imports pdfjs-dist — is itself loaded via **dynamic
     `import()`** inside `FileCardNode.tsx`, gated by:
     (a) `fileType === "pdf"`, AND
     (b) the React Flow viewport-culling pass has already mounted the
     node (`onlyRenderVisibleElements` from ADR-0052).
   → A canvas with zero PDF cards ships **0 bytes** of pdfjs-dist in
     any chunk. A canvas with an off-screen PDF card also ships 0 bytes
     until the card scrolls into view.
4. **Rendering UX**: continuous vertical scroll (not page-by-page
   buttons), better suited to a small card context. Pages render as
   stacked `<canvas>` elements inside a scrollable `div`. No toolbar
   chrome inside the card — the card header stays the existing
   `FileCardHeader` shared with image/video/markdown file embeds.
5. **Card resize handling**: a `ResizeObserver` on the scroll container
   debounces (raf-aligned) a `scale` recalculation; pages re-render at
   the new DPR-scaled canvas size. Rendering cancels in-flight when
   unmounted (component cleanup + abort-controller pattern on the
   pdf.js `renderTask`).
6. **Worker setup**: `pdfjs.GlobalWorkerOptions.workerSrc` is set from
   inside `PdfCardView.tsx` (NOT from a top-level module), via a
   `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`
   so Vite emits the worker as its own chunk instead of bundling it
   into the canvas base.

## Consequences
- Baseline canvas bundle (no PDF cards): unchanged from Phase 8 — no
  pdfjs-dist bytes reach the client until a PDF card mounts.
- First visible PDF card: +~121 KB gzip (core + worker), paid once per
  session regardless of how many subsequent PDF cards exist.
- Pan/zoom discipline: Phase 8's `onlyRenderVisibleElements` cascades
  correctly — off-screen PDF cards unmount, cancelling all page render
  tasks and releasing canvas backing stores.
- File-node pattern preserved; the drag-and-drop creation flow from
  ADR-0049 is extended with a `.pdf` extension check, no new UI.
