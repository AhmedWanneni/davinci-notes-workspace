# TASK: Rule-based UX Review — Group 04: Specialized Workspace Views

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to specialized views (ADR-0031, ADR-0032, ADR-0041 to ADR-0057, ADR-0167, ADR-0182, ADR-0199 to ADR-0201). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 04: Specialized Workspace Views** against the UX rubric.
For each specialized view leaf in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 04
1. **JSON Canvas Board** (`packages/canvas/src/CanvasContainer.tsx`, `CanvasToolbar.tsx`, `CanvasMinimap.tsx`)
   - Infinite 2D spatial canvas: text cards, file cards, media cards, link cards, group containers, edge connection handles, minimap.
2. **Kanban Board View** (`packages/kanban/KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`)
   - Visual task columns (for notes with `kanban-plugin: board`), draggable cards, add column/card inline inputs.
3. **Global Graph View** (`apps/desktop/src/components/GlobalGraphLeaf/GlobalGraphLeaf.tsx`)
   - Full-page force-directed network graph (D3-force SVG), search filter, zoom/pan controls, node hover labels, click navigation.
4. **Google Calendar & Meetings View** (`apps/desktop/src/components/CalendarView/CalendarLeaf.tsx`, `EventModal.tsx`, `ScheduleXCalendar.tsx`)
   - Schedule-X calendar grid (month/week/day), synced Google events, event detail modal, "Create meeting note" integration.
5. **Reminders Management View** (`apps/desktop/src/components/RemindersView/RemindersView.tsx`)
   - Full-page reminder management dashboard: Today, Upcoming, Overdue, and Completed sections; channel dispatch status badges.
6. **Image Preview Leaf** (`apps/desktop/src/components/ImagePreview/ImagePreviewLeaf.tsx`)
   - Dedicated workspace leaf for viewing raster and vector images (.png, .jpg, .svg, .webp), zoom controls, dimension metadata.
7. **Plugin Host Declarative View** (`apps/desktop/src/components/PluginViewLeaf/PluginViewLeaf.tsx`)
   - Host-rendered custom view leaf for third-party plugins communicating over sandboxed RPC protocol.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Target size for canvas edge handles, kanban add-card triggers, calendar date cells, and graph nodes.
- **Hick's Law**: Toolbar action counts in Canvas and Calendar; avoiding toolbar fatigue.
- **Jakob's Law**: Parity with Obsidian Canvas and standard Kanban/Calendar conventions (spacebar pan, pinch zoom, drag between columns).
- **Miller's Law & Chunking**: Visual groupings in Canvas (groups vs cards) and Kanban (swimlanes/columns).
- **Doherty Threshold**: Pan/zoom 60fps responsiveness; smooth drag-and-drop feedback without stutter.
- **Postel's Law**: Fault tolerance for corrupted JSON canvas schemas or malformed kanban frontmatter.
- **Von Restorff / Serial Position**: Overdue reminder emphasis and selected canvas node prominence.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Kanban boards and canvas cards must avoid multi-layered container borders.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per view: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Zoom/pan performance on 500-node canvas or 200-node graph (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and test Storybook stories (`packages/kanban/KanbanView.stories.tsx`, `CalendarView.stories.tsx`, `GlobalGraphLeaf.stories.tsx`, `RemindersView.stories.tsx`).
- **Keyboard-only pass**: Canvas keyboard navigation (Arrow keys move focus, `Delete` removes node), Kanban column traversal, Calendar date navigation.
- **State matrix**: Empty state, loading state, populated state (50 items), error state (OAuth fail / corrupted file), extreme workload (500+ nodes).
- Measure DOM nesting depth of canvas card containers and kanban columns.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/04-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `VIEW-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/04-canvas-view.md`
- Create `design/UXReview/screens/04-kanban-board.md`
- Create `design/UXReview/screens/04-global-graph.md`
- Create `design/UXReview/screens/04-calendar-view.md`
- Create `design/UXReview/screens/04-reminders-view.md`
- Create `design/UXReview/screens/04-image-preview.md`
- Create `design/UXReview/screens/04-plugin-view.md`
- Commit: `docs(ux-review): group-04-special-views`
