# UX Review: Tags Dialog

## 1. Overview
The Tags Dialog (`TagsDialog.tsx`) displays an interactive hierarchical tree of all tags indexed across the vault (`#project`, `#project/ui`, `#dev`), showing the note count for each tag and allowing users to click a tag to filter notes.
- **Entry points**: Command Palette (`"Tags: Open Tag Browser"`), keyboard shortcut, or clicking a tag badge in note properties.
- **Current state**: Modal dialog displaying nested `TagTreeNode` items with expandable/collapsible carets and note counts.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Displays total note counts per tag branch and leaf. |
| **H2 Match with real world** | Pass | Uses `#` hash icon and nested slash taxonomy (`tag/subtag`). |
| **H3 User control and freedom** | Partial | No search/filter input to quickly find a tag; expanding/collapsing nodes resets when dialog reopens. |
| **H4 Consistency and standards** | Partial | Unlike CommandPalette and SearchDialog, this dialog has no search input and no close button. |
| **H5 Error prevention** | Pass | Read-only tag browser; selecting a tag safely triggers navigation. |
| **H6 Recognition over recall** | Pass | Lists all existing tags so users don't have to remember exact tag names. |
| **H7 Flexibility and efficiency** | Fail | No keyboard arrow navigation (Up/Down/Left/Right to expand); pure mouse click interaction. |
| **H8 Aesthetic and minimalist design** | Pass | Clean typography and subtle indentation hierarchy. |
| **H9 Error recovery** | Pass | Dismisses cleanly on Escape. |
| **H10 Help and documentation** | Partial | Doesn't explain how nested tags work (`parent/child`). |
| **Fitts's Law** | Pass | Comfortable row height and click target for tag buttons. |
| **Hick's Law** | Fail | In vaults with hundreds of tags, scanning an unfilterable list causes high cognitive load. |
| **Jakob's Law** | Partial | Users expect a filter bar at the top of a tag browser dialog. |
| **Miller / Chunking** | Pass | Natural chunking via hierarchical tag paths. |
| **Doherty Threshold** | Pass | Tree calculation is fast via `useMemo` and local map. |
| **Postel's Law** | Pass | Strips leading `#` gracefully for display. |
| **Von Restorff** | Pass | Note count badges clearly indicate high-volume tags. |
| **Proximity** | Pass | Expand caret, tag name, and count are aligned in a single row. |
| **Similarity** | Pass | Consistent styling for all tree rows across depths. |
| **Common Region** | Pass | Standard clean dialog frame. |
| **Uniform Connectedness** | Pass | Tree indentation lines guide nested relationship. |
| **Design tokens & styling** | Pass | Uses design tokens and Radix dialog primitive. |
| **Accessibility (a11y)** | Partial | Missing `role="tree"` and `role="treeitem"` ARIA attributes; caret button has label but row is not keyboard-navigable. |
| **Performance feel** | Pass | Lightweight DOM tree. |

---

## 3. Issues

### TAGS-01: Missing tag search filter causes severe friction in large vaults
- **Severity**: High
- **Rule violated**: Hick's Law / H7 Flexibility and efficiency
- **Evidence**: `apps/desktop/src/components/TagsDialog/TagsDialog.tsx:127-148` `[Code-Read Only]`
- **Why it hurts the user**: In a vault with 100+ tags, users must manually scroll and expand dozens of branches to find a specific tag instead of typing 2 letters to filter.
- **Suggested fix**: Add a search input at the top of the dialog (`<Input placeholder="Filter tags..." />`) that filters the tree in real-time.
- **Effort**: M

### TAGS-02: Missing keyboard navigation (arrow keys)
- **Severity**: Medium
- **Rule violated**: H7 Flexibility and efficiency / Accessibility (a11y)
- **Evidence**: `apps/desktop/src/components/TagsDialog/TagsDialog.tsx:53-110` `[Code-Read Only]`
- **Why it hurts the user**: Power users and keyboard-only users cannot navigate or expand tags using `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and `Enter`.
- **Suggested fix**: Implement standard ARIA tree keyboard navigation or roving focus across tag tree rows.
- **Effort**: M

### TAGS-03: No close button (`showCloseButton={false}`)
- **Severity**: Low
- **Rule violated**: H3 User control and freedom / H4 Consistency
- **Evidence**: `apps/desktop/src/components/TagsDialog/TagsDialog.tsx:131` (`showCloseButton={false}`) `[Code-Read Only]`
- **Why it hurts the user**: Mouse users who don't know Escape closes modals must click the background scrim to dismiss.
- **Suggested fix**: Set `showCloseButton={true}` or add an explicit Close header button.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.tags-dialog__dialog` | Standard Radix modal | Dialog is appropriately flat | Retain flat structure; add top filter input |

---

## 5. What Works Well
- Automatic parsing of nested slash tags (`parent/child/grandchild`) into a collapsible tree structure.
- Canonical tag display with accurate count badges.
- Smooth indent rendering (`paddingLeft: 12 + depth * 20px`).

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Enable `showCloseButton={true}` on `DialogContent` (≤5 min).
- **Larger Work**: Add top filter search input and keyboard arrow key navigation (≤1.5 hours).
