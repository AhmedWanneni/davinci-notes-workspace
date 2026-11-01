# TASK: Rule-based UX Review — Group 06: Inspectors & Context Sidebars

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to the right sidebar (ADR-0029, ADR-0040, ADR-0139, ADR-0150, ADR-0154). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 06: Inspectors & Context Sidebars** against the UX rubric.
For each panel in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 06
1. **Right Sidebar Container** (`apps/desktop/src/components/RightSidebar/RightSidebar.tsx`)
   - Collapsible right sidebar container, resize handle, accordion section headers with chevron toggles, persistence of collapsed state.
2. **Backlinks & Mentions Panel** (`apps/desktop/src/components/BacklinksPanel/BacklinksPanel.tsx`)
   - Indexed query backlinks with snippet context and matched highlights; unlinked mentions candidate list.
3. **Note Outline Panel** (`apps/desktop/src/components/NoteOutline/NoteOutline.tsx`)
   - Table of contents tree parsing note H1–H6 headings, active heading tracker, click-to-scroll navigation.
4. **Local Graph Panel** (`apps/desktop/src/components/LocalGraphPanel/LocalGraphPanel.tsx`)
   - Embedded SVG mini-graph centered on active note, depth 1-2 connections, interactive drag and click navigation.
5. **Version History & Restore Diff Panel** (`apps/desktop/src/components/VersionHistoryPanel/VersionHistoryPanel.tsx`)
   - 2-second debounced automatic Git commit batches, timestamp, author, inline diff viewer, "Restore this version" action.
6. **Suggested Links AI Panel** (`apps/desktop/src/components/SuggestLinksPanel/SuggestLinksPanel.tsx`)
   - AI semantic similarity suggestions, similarity score percentage, 1-click `[[Insert]]` link button.
7. **Git Source Control Sidebar Panel** (`apps/desktop/src/components/GitRemoteSetupPanel/GitRemoteSetupPanel.tsx`, `@app/git-manager`)
   - Changed files list, diff viewer, commit message input, commit button, push/pull controls.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Accordion header click areas, restore buttons, jump-to-heading link targets.
- **Hick's Law**: Clean inspector list; avoiding visual noise in snippet previews.
- **Jakob's Law**: Obsidian right sidebar parity (collapsible linked mentions, outline, local graph).
- **Miller's Law & Chunking**: Clear vertical rhythm across accordion sections.
- **Doherty Threshold**: Instant heading outline generation; debounced backlinks query on note switch (<100ms).
- **Postel's Law**: Tolerance for notes with hundreds of headings or broken wikilinks.
- **Von Restorff / Serial Position**: Active heading indicator in outline clearly visible without overpowering.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Accordion items and backlink cards often carry redundant borders and backgrounds.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per panel: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Bounded query performance when switching between notes rapidly (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and test Storybook stories (`apps/desktop/src/components/VersionHistoryPanel/VersionHistoryPanel.stories.tsx`).
- **Keyboard-only pass**: Tab traversal through accordion headers, Enter/Space to expand/collapse, jump to outline links with keyboard.
- **State matrix**: Note with 0 backlinks, note with 50 backlinks, note with no headings, note with deeply nested H1–H6, note with 100+ version history commits.
- Measure DOM nesting depth of accordion panels and backlink cards.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/06-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `SIDE-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/06-right-sidebar-shell.md`
- Create `design/UXReview/screens/06-backlinks-panel.md`
- Create `design/UXReview/screens/06-note-outline.md`
- Create `design/UXReview/screens/06-local-graph.md`
- Create `design/UXReview/screens/06-version-history.md`
- Create `design/UXReview/screens/06-suggest-links.md`
- Create `design/UXReview/screens/06-git-sidebar.md`
- Commit: `docs(ux-review): group-06-inspectors-and-right-sidebar`
