# Canvas Feature — Build Plan

Matches Obsidian Canvas: an infinite pannable/zoomable space with cards
(text, note embeds, images, PDFs, webpages, nested canvases) connected by
labeled edges, groupable, exportable. Stored as plain `.canvas` JSON files
using the open JSON Canvas format (jsoncanvas.org) — same local-first, plain-
file philosophy as everything else in this app.

This is a large, standalone feature — treat it as its own track, sequenced
after the current UI overhaul / core app work, not squeezed into it. Same
"one phase, one concern, checkpoint before moving on" discipline as
`desktop-app-build-plan.md` throughout.

Read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `PERFORMANCE.md` before
every session, same as always — not repeated per phase below.

---

## Phase 0 — Package Setup & Data Model

**Goal**: decide where canvas logic lives in the monorepo, define the JSON
Canvas-compliant types, no UI yet.

| Step | What | Done when |
|---|---|---|
| 0.1 | Decide package placement: `packages/canvas` (shared, platform-agnostic — recommended, matches how `indexer` is structured, keeps mobile reuse possible later) vs. `apps/desktop`-local | Decision logged in `DECISIONS.md` |
| 0.2 | Define TypeScript types matching the JSON Canvas spec: `CanvasData`, `CanvasNode` (text/file/link/group variants), `CanvasEdge` (with label, color, endpoints) | Types compile, unit-testable in isolation, zero UI/React dependency |
| 0.3 | File I/O: read/write `.canvas` files (plain JSON, per spec) — reuse the same Tauri `fs` command pattern from Phase 5 of the desktop plan, don't reinvent file access | Round-trip test: write a canvas, read it back, structurally identical |
| 0.4 | Install React Flow (`@xyflow/react`), check bundle size against `PERFORMANCE.md`'s dependency rule, log the size cost in the PR | Confirmed acceptable, logged |

**Checkpoint**: canvas file format is defined, tested, and can round-trip through disk — before any rendering exists.

---

## Phase 1 — Canvas Shell (empty canvas, pan/zoom, save/load)

**Goal**: an empty, pannable, zoomable canvas that persists to a `.canvas` file. No cards yet.

- React Flow canvas mounted in a new view (new tab type, or a dedicated route — decide based on how tabs currently work per the UI overhaul)
- Pan (space+drag, middle-click), zoom (ctrl/cmd+scroll), zoom-to-fit
- Debounced save-to-disk on canvas changes, per `PERFORMANCE.md` — same debounce discipline as note editing (Phase 6 of the desktop plan), not a new pattern
- Empty state for a new/blank canvas

**Checkpoint**: create a new canvas, pan/zoom around empty space, close and reopen the app, confirm the (empty) canvas state persisted.

---

## Phase 2 — Text Cards

**Goal**: the simplest card type, and the one that proves the whole card
interaction model (create, move, resize, edit, delete).

- Create via toolbar click, double-click on canvas, or right-click menu (per the reference feature set — pick one to start, add others once the core works)
- Drag to reposition, resize via corner/edge handles, snap-to-grid and snap-to-align-with-other-cards
- Inline text editing
- Delete (selected + Delete key, or right-click)

**Checkpoint**: create several text cards, move/resize/edit/delete them, confirm changes persist to the `.canvas` file correctly.

---

## Phase 3 — Connections (Edges)

**Goal**: connect cards with labeled, colored edges.

- Drag from a card's edge handle to another card to create a connection
- Edge labels (click to add/edit text on a connection)
- Edge colors (a small palette, consistent with design-system tokens rather than arbitrary colors — check whether Obsidian's arbitrary-color approach is worth matching exactly or constraining to your token palette, flag this as a deliberate choice)
- Delete a connection (select + delete)
- Update a connection's target (drag an existing edge's endpoint to a different card)

**Checkpoint**: connect several cards, label and color connections, delete and re-target them, confirm all persist correctly.

---

## Phase 4 — Selection & Arrangement

**Goal**: multi-card operations — the productivity layer on top of individual cards.

- Single select, drag-select multiple, shift-click to add/remove from selection, select-all
- Move/duplicate selected cards as a group
- Align (selected cards to one edge, or both ends), spread evenly
- Move along a single axis (constrain drag to horizontal/vertical)

**Checkpoint**: select multiple cards via each method, move/duplicate/align them, confirm behavior matches expectations and persists.

---

## Phase 5 — Groups

**Goal**: visual grouping of cards with a label and color, independent of connections.

- Right-click to create a group (around selection, or a fresh empty group of a given size)
- Rename a group, color a group
- Select a group (selects its contents), nest groups within groups
- Groups persist as their own node type per the JSON Canvas spec

**Checkpoint**: group cards, rename/color/select/nest groups, confirm persistence and that moving a group moves its contents.

---

## Phase 6 — Markdown File Embed Cards

**Goal**: embed existing vault notes as cards — this is the highest-value card type beyond plain text, and the cheapest to build given what already exists.

- Reuse the existing note-rendering logic from the editor (Phase 6 of the desktop plan) — render read-only (or lightly editable) markdown inside a card, don't build a second markdown renderer
- "Swap file for card" — change which note a card embeds
- "Convert text card to file" — promote a text card's content into a real vault note
- "Narrow down to headings" — embed just a section of a note, not the whole thing

**Checkpoint**: embed several real vault notes as cards, confirm they render correctly and stay in sync if the source note changes.

---

## Phase 7 — Image / Video Cards

**Goal**: media embeds.

- Paste/drag an image or video file onto the canvas to create a card
- Standard `<img>`/`<video>` rendering, respecting card resize
- File reference stored in the `.canvas` JSON per spec (path, not embedded binary — consistent with the plain-file philosophy)

**Checkpoint**: add images and videos, resize their cards, confirm playback/display works and paths persist correctly.

---

## Phase 8 — Performance Checkpoint (mid-plan, deliberate)

**Goal**: catch scaling issues before adding the more complex card types (PDF, webpage, nested canvas), which compound whatever performance problems already exist.

- Test with a large canvas (100+ cards, 100+ edges) — pan/zoom smoothness, drag responsiveness, save/load time
- Confirm React Flow's built-in virtualization/culling (off-screen nodes) is actually in effect, not rendering everything unconditionally — this is the canvas equivalent of the file-tree virtualization requirement from earlier phases
- Re-check debounced save isn't triggering excessively during rapid multi-card drags

**Checkpoint**: large test canvas remains smooth. Fix what's found before continuing — don't build PDF/webpage/nested-canvas cards on top of an already-struggling base.

---

## Phase 9 — PDF Cards

**Goal**: embed PDF files as cards, scrollable within the card.

- Requires a PDF rendering approach — check what's already available (a PDF.js-based renderer is the standard choice; confirm bundle-size cost per `PERFORMANCE.md` before committing, since PDF.js is not small)
- Card shows a scrollable/paginated view of the PDF, respects card resize

**Checkpoint**: embed a real PDF, confirm it renders and scrolls correctly without noticeably harming canvas performance (re-check against Phase 8's baseline).

---

## Phase 10 — Webpage Embed Cards

**Goal**: embed a live webpage as a card, created by pasting a URL.

- iframe-based embed — **security consideration required, not optional**: sandbox the iframe appropriately, be deliberate about what's allowed to run (arbitrary third-party JS in an embedded page is a real attack surface for a desktop app with filesystem access elsewhere in the same process)
- Paste-URL-to-create, and a specific YouTube-embed path (per the reference feature set) if worth special-casing for a better embed than a generic iframe
- Changing a webpage card's URL after creation

**Checkpoint**: embed a real webpage, confirm sandboxing is actually restrictive (test that embedded content can't reach outside its frame), confirm resize/interaction works.

---

## Phase 11 — Nested Canvas Cards

**Goal**: a canvas card that itself contains a canvas (recursive).

- This is the most architecturally complex card type — do it last, once everything else is proven
- Recursive rendering: a canvas card renders a scaled-down/interactive view of another `.canvas` file
- Explicitly decide and test the recursion boundary (can a canvas nest itself, directly or via a cycle of references? — prevent infinite recursion explicitly, don't assume it can't happen)

**Checkpoint**: nest a canvas within a canvas, confirm it renders correctly and cycles are actually prevented, not just untested.

---

## Phase 12 — Export

**Goal**: export canvas to image, matching the reference feature set.

- Export current viewport to image
- Export entire canvas (beyond current viewport) to image

**Checkpoint**: both export modes produce correct, complete images for a canvas with multiple card types.

---

## Phase 13 — App Integration

**Goal**: canvas fits naturally into the app shell built during the UI overhaul.

- Icon rail entry point (per `ui-overhaul-obsidian-layout-prompt.md`'s icon rail) to create/open canvases
- Canvas files appear in the file tree alongside notes (distinguished by icon/extension)
- Canvas opens as its own tab type in the tab bar
- Confirm canvas tabs coexist correctly with note tabs (switching between them, closing, etc.)

**Checkpoint**: full integration — create a canvas from the icon rail, see it in the file tree, open/close it as a tab alongside regular notes, no state bleed between tab types.

---

## What's Deliberately Out of Scope

- **Real-time collaborative canvas editing** — same reasoning as the sync architecture decision elsewhere in this project; single-user multi-device sync, not live collaboration
- **Plugin API for canvas** (extensibility mentioned in Obsidian's own Canvas feature set) — defer indefinitely, same as the core app's plugin system decision
- **Mobile canvas** — build desktop first, revisit mobile canvas as its own scoped effort once desktop is proven, per how mobile followed desktop for the core app

---

## How to Run This

- Each phase is realistically multiple sessions, same as the core app plan — don't run a whole phase in one sitting, especially Phases 6 onward where each card type has real edge cases.
- Recommend HIGH effort for Phase 0 (data model — gets this wrong and every card type inherits the mistake), Phase 8 (performance judgment), Phase 10 (security sandboxing), and Phase 11 (recursion handling). MEDIUM is fine for the more mechanical card-type implementations once the pattern is established (Phase 2 sets the pattern; 6, 7, 9 follow it).
- Phase 8's mid-plan performance checkpoint is placed deliberately before the heaviest remaining card types (PDF, webpage, nested canvas) — don't skip it or move it to the end; catching a scaling problem before three more complex card types are built on top of it is much cheaper than after.
- Update `PROGRESS.md` at the end of every session, same discipline as always.