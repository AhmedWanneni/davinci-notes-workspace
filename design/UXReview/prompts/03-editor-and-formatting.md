# TASK: Rule-based UX Review — Group 03: Editor & Note Surface

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to the editor (ADR-0003, ADR-0062 to ADR-0078, ADR-0175 to ADR-0178). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 03: Editor & Note Surface** against the UX rubric.
For each screen/surface in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 03
1. **Markdown Editor Surface** (`apps/desktop/src/components/EditorArea/EditorArea.tsx`)
   - CodeMirror 6 live preview editor, active line indicators, markdown formatting, syntax highlighting, list nesting, task toggles.
2. **Properties Block** (`apps/desktop/src/components/PropertiesBlock/PropertiesBlock.tsx`)
   - YAML frontmatter editor above note: `#tag` badges, text fields, dates, links, add property dropdown, collapse/expand toggle.
3. **Note Cover Image & Picker Modal** (`apps/desktop/src/components/EditorArea/NoteCoverImage.tsx`, `CoverImagePickerModal.tsx`)
   - Note banner cover image, hover buttons (Change cover, Reposition, Remove), preset gallery modal, file upload tab, URL input.
4. **Editor Conflict Banner** (`apps/desktop/src/components/EditorArea/EditorConflictBanner.tsx`)
   - Persistent banner warning when external file modification or sync collision occurs; "Keep Local", "Keep Remote", "View Diff".
5. **Floating Formatting Toolbar** (`apps/desktop/src/components/EditorArea/EditorFormattingToolbar.tsx`)
   - Contextual floating bubble on text selection: Bold, Italic, Strike, Highlight, Code, Link, Tag, Headings H1–H3.
6. **Editor Slash Menu / Insert Tray** (`apps/desktop/src/components/EditorArea/EditorInsertTray.tsx`, `InsertMenu.tsx`)
   - Triggered by `/` on a blank line or clicking `+` gutter icon. Filterable catalog of blocks (Headings, Tables, Math, Diagrams, Embeds).
7. **Table Grid Picker Popover** (`apps/desktop/src/components/EditorArea/TableGridPicker.tsx`, `TableGridPopover.tsx`)
   - Interactive 2D matrix selector for inserting Markdown tables of N×M dimensions.
8. **Inline Reminder Date Picker & Modal** (`apps/desktop/src/components/EditorArea/ReminderDatePicker.tsx`, `ReminderEditModal.tsx`)
   - Popover for setting due date, time, and recurrence rule (`@reminder(...)`) on task items.
9. **Editor AI Selection Actions Popover** (`apps/desktop/src/components/EditorArea/EditorAiSelectionPopover.tsx`)
   - Contextual floating AI trigger on selection (`Cmd+Shift+K`): Summarize, Fix grammar, Translate, Rephrase, Custom prompt.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Hit areas for checkbox tasks, fold triangles, formatting bubble buttons, and property delete buttons.
- **Hick's Law**: Slash menu and formatting toolbar item counts and category chunking.
- **Jakob's Law**: Obsidian / Notion live preview conventions (revealing raw markdown on cursor focus; standard markdown shortcuts `Cmd+B`, `Cmd+I`, `Cmd+K`).
- **Miller's Law & Chunking**: Property blocks and metadata layout cleanly separated from document prose.
- **Doherty Threshold**: Real-time keystroke latency (<16ms, 60fps), 150ms debounce for heavy widgets (Mermaid/KaTeX).
- **Postel's Law**: Tolerance for malformed YAML frontmatter or imperfect markdown syntax without crash.
- **Von Restorff / Serial Position**: Clear typography scale (H1 through H6) without visual clash.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Properties block, popovers, and banners must not over-box.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per component: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Typing smoothness, memory footprint on a 100,000-word note (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and check Storybook stories (`apps/desktop/src/components/EditorArea/EditorFormattingToolbar.stories.tsx`, `EditorInsertTray.stories.tsx`, `TableGridPicker.stories.tsx`).
- **Keyboard-only pass**: Slash menu `/` trigger, arrow navigation, Enter selection, Escape dismissal. Formatting shortcuts (`Cmd+B`, `Cmd+I`, `Cmd+K`).
- **State matrix**: Empty note, long 50-page note, complex note with math/Mermaid/tables, note with frontmatter error, note during sync conflict.
- Measure DOM nesting depth of editor lines, properties table, and floating popovers.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/03-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `EDIT-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/03-editor-surface.md`
- Create `design/UXReview/screens/03-properties-block.md`
- Create `design/UXReview/screens/03-cover-image.md`
- Create `design/UXReview/screens/03-conflict-banner.md`
- Create `design/UXReview/screens/03-formatting-toolbar.md`
- Create `design/UXReview/screens/03-slash-insert-tray.md`
- Create `design/UXReview/screens/03-table-grid-picker.md`
- Create `design/UXReview/screens/03-reminder-date-picker.md`
- Create `design/UXReview/screens/03-ai-selection-popover.md`
- Commit: `docs(ux-review): group-03-editor-and-formatting`
