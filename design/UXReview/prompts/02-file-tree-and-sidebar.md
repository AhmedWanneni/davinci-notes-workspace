# TASK: Rule-based UX Review — Group 02: File Tree & Navigation Sidebar

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to the file tree (ADR-0028, ADR-0157, ADR-0158, ADR-0159). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 02: File Tree & Navigation Sidebar** against the UX rubric.
For each screen/component in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 02
1. **App Sidebar Container** (`apps/desktop/src/components/AppSidebar/AppSidebar.tsx`, `useSidebarResize.ts`)
   - Left sidebar shell, toggle collapse (`Cmd+\`), resize handle drag behavior, minimum width clamping (240px).
2. **Sidebar Header & Vault Switcher** (`apps/desktop/src/components/AppSidebar/AppSidebarHeader.tsx`, `VaultSwitcher.tsx`)
   - Vault switcher dropdown, New Note button, New Folder button, Collapse button.
3. **File Tree List & Rows** (`apps/desktop/src/components/FileTree/FileTree.tsx`, `FileTreeList.tsx`, `FileTreeRow.tsx`)
   - TanStack virtualized file tree, folder expand/collapse arrows, active file highlight, inline renaming, drag-and-drop indicator pill.
4. **File Tree Toolbar** (`apps/desktop/src/components/FileTree/FileTreeToolbar.tsx`)
   - Top action row: Collapse all folders, sort order options (name, modified, created), filter/search input.
5. **File Tree Context Menu** (`apps/desktop/src/components/FileTree/FileTreeContextMenu.tsx`)
   - Right-click note actions (Open, Open in new tab, Rename, Duplicate, Delete, Bookmark, Reveal in Finder) and folder actions (New note, New folder, Rename, Delete).
6. **Tree Delete Confirmation Dialog** (`apps/desktop/src/components/FileTree/confirmTreeDelete.ts`)
   - File and folder deletion confirmation modal; non-empty folder safeguards.
7. **File Tree Emoji Picker & Popover** (`apps/desktop/src/components/FileTree/FileTreeEmojiPopover.tsx`, `FileTreeEmojiPicker.tsx`, `FileTreeEmojiCategoryBar.tsx`)
   - Per-note custom emoji icon picker, search input, category bar, keyboard navigation, loading skeleton.
8. **Bookmarks Sidebar View** (`apps/desktop/src/components/BookmarksView/BookmarksView.tsx`)
   - Dedicated bookmarked notes view, empty state, unbookmark action.

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Target size for folder toggle chevrons, context menu items (min 32px), inline action buttons.
- **Hick's Law**: Context menu choice grouping; avoiding menu overload.
- **Jakob's Law**: Obsidian / VS Code file explorer parity (arrow key navigation: Right expands, Left collapses/moves up; F2 renames; Enter opens; Drag & drop reordering).
- **Miller's Law & Chunking**: Folder hierarchy visual cues and indentation clarity.
- **Doherty Threshold**: Drag preview responsiveness, instantaneous folder expansion, zero lag on 10k-note vaults.
- **Postel's Law**: Permissive naming (safe path normalization, handling special characters and duplicate names).
- **Von Restorff / Serial Position**: Active note distinction in the tree without excessive contrast.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. Tree rows and sidebar headers must not use unnecessary borders or cards.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per component: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Frame rate during virtualized scrolling on 10,000 notes (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and test Storybook stories (`apps/desktop/src/components/FileTree/FileTreeToolbar.stories.tsx`, `FileTreeEmojiPicker.stories.tsx`, `VaultSwitcher.stories.tsx`, `BookmarksView.stories.tsx`).
- **Keyboard-only pass**: Tree navigation via `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`, `Enter` to open, `F2` to inline rename, `Escape` to cancel rename or dismiss context menu.
- **State matrix**: Empty vault (0 notes), standard vault (50 notes), large vault (10k-note fixture), deep nesting (10 folders deep), long file names with truncation.
- Measure DOM nesting depth of tree rows and context menu.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/02-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `TREE-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/02-app-sidebar.md`
- Create `design/UXReview/screens/02-vault-switcher.md`
- Create `design/UXReview/screens/02-file-tree.md`
- Create `design/UXReview/screens/02-file-tree-toolbar.md`
- Create `design/UXReview/screens/02-file-tree-context-menu.md`
- Create `design/UXReview/screens/02-tree-delete-modal.md`
- Create `design/UXReview/screens/02-emoji-picker.md`
- Create `design/UXReview/screens/02-bookmarks-view.md`
- Commit: `docs(ux-review): group-02-file-tree-and-sidebar`
