# TASK: Rule-based UX Review — Group 07: Dialogs, Overlays & Palettes

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to dialogs and search (ADR-0030, ADR-0079 to ADR-0088, ADR-0122, ADR-0163). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 07: Dialogs, Overlays & Palettes** against the UX rubric.
For each modal/dialog in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 07
1. **Command Palette** (`apps/desktop/src/components/CommandPalette/CommandPalette.tsx`)
   - `Cmd+Shift+P` (or `Ctrl+Shift+P`): Fuzzy command search (`fuzzysort`), keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`), category badges, recent commands.
2. **Full-Text Search Dialog** (`apps/desktop/src/components/SearchDialog/SearchDialog.tsx`)
   - `Cmd+P` or `Cmd+Shift+F`: SQLite FTS5 search with operators (`tag:`, `-term`, quotes), snippet context highlights, semantic search mode toggle.
3. **Tags Dialog** (`apps/desktop/src/components/TagsDialog/TagsDialog.tsx`)
   - Alphabetical list of all tags across vault, note counts, search filter, click to filter search.
4. **Reminders Quick Dialog & Toast** (`apps/desktop/src/components/RemindersDialog/RemindersDialog.tsx`, `ReminderNotificationToast.tsx`)
   - Quick checklist of active due tasks, one-click completion, note navigation link, floating bottom-right notification toast.
5. **Theme Browser Modal** (`apps/desktop/src/components/ThemeBrowser/ThemeBrowser.tsx`)
   - Gallery modal displaying built-in and community themes, theme preview cards, author, install/apply button.
6. **Plugin Browser Modal** (`apps/desktop/src/components/PluginBrowser/PluginBrowser.tsx`)
   - Community plugin directory, search filter, security disclaimer banner, install/enable toggle.
7. **Sync Conflicts Modal** (`apps/desktop/src/components/SyncConflictsPanel/SyncConflictsPanel.tsx`)
   - Unresolved sync conflicts list, side-by-side / 3-way diff comparison, "Keep Mine" / "Keep Theirs" / "Merge" resolution actions.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Dialog close buttons, search result row height (comfortable keyboard selection), action buttons.
- **Hick's Law**: Command palette ranking; avoiding cognitive overload in search results.
- **Jakob's Law**: VS Code / Obsidian Command Palette parity (instant keyboard focus, arrow cycling, Esc dismissal, backdrop click dismissal).
- **Miller's Law & Chunking**: Chunking search results with path, title, and excerpt highlight.
- **Doherty Threshold**: Palette appearance <100ms; search-as-you-type debounced response <200ms.
- **Postel's Law**: Tolerant search parser (handling trailing colons, unclosed quotes, fuzzy typos).
- **Von Restorff / Serial Position**: Selected item clearly highlighted in command list.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Modal dialog frames, scrims (`--color-bg-scrim`), and list items must avoid redundant wrapper borders.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per dialog: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix Dialog primitives (`@radix-ui/react-dialog`), CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Accessible Radix focus traps inside open dialogs; returning focus to previous element upon dismissal (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and test Storybook stories (`apps/desktop/src/components/RemindersDialog/RemindersDialog.stories.tsx`).
- **Keyboard-only pass**: Open with shortcut (`Cmd+Shift+P`, `Cmd+P`), cycle results with `ArrowUp`/`ArrowDown`, select with `Enter`, dismiss with `Escape`. Test focus trapping inside the modal.
- **State matrix**: Empty query state, active searching, populated results (50 items), no results found, large vault search (10k notes).
- Measure DOM nesting depth of dialog overlay, content frame, and list rows.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/07-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `MODAL-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/07-command-palette.md`
- Create `design/UXReview/screens/07-search-dialog.md`
- Create `design/UXReview/screens/07-tags-dialog.md`
- Create `design/UXReview/screens/07-reminders-dialog.md`
- Create `design/UXReview/screens/07-theme-browser.md`
- Create `design/UXReview/screens/07-plugin-browser.md`
- Create `design/UXReview/screens/07-sync-conflicts.md`
- Commit: `docs(ux-review): group-07-dialogs-and-modals`
