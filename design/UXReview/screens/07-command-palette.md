# UX Review: Command Palette

## 1. Overview
The Command Palette (`CommandPalette.tsx`) is the primary keyboard-driven switcher and action launcher in Sophia Desktop.
- **Entry points**: `Cmd+Shift+P` (or `Ctrl+Shift+P`), icon in header/help, or quick launcher.
- **Current state**: Centered modal overlay powered by Radix Dialog. It features a top search input (`inputRef`), fuzzy-filtered results list (`usePaletteResults`, `fuzzysort`), keyboard cycling (`ArrowUp`/`ArrowDown`/`Enter`), category headers, and a keyboard hint footer (`↑↓ to navigate · ↵ to use · esc to dismiss`).

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Instant keyboard focus on open; active selection highlighted with background change. |
| **H2 Match with real world** | Partial | Empty state says `"No notes found. Press Enter to create..."` even when searching for actions/commands. |
| **H3 User control and freedom** | Pass | Closes instantly on `Escape` or clicking outside; restores focus to editor. |
| **H4 Consistency and standards** | Pass | Strictly follows VS Code / Obsidian palette conventions. |
| **H5 Error prevention** | Partial | Note creation on Enter when query has no command match can trigger accidental note creation. |
| **H6 Recognition over recall** | Pass | Lists all commands with categorized titles and search match highlights. |
| **H7 Flexibility and efficiency** | Pass | Full keyboard traversal without requiring mouse input; rapid fuzzy search. |
| **H8 Aesthetic and minimalist design** | Pass | Clean unadorned list, dark scrim, no glassmorphism or drop shadows. |
| **H9 Error recovery** | Pass | Easy backspace to clear query or Escape to abort. |
| **H10 Help and documentation** | Pass | Persistent footer explains keyboard shortcuts (`↑↓`, `↵`, `esc`). |
| **Fitts's Law** | Fail | Close button (`command-palette__close`) icon is size 10 (`X size={10}`), far smaller than 32px click target. |
| **Hick's Law** | Pass | Top fuzzy matches ranked at the top; recent commands prioritized. |
| **Jakob's Law** | Pass | Matches standard IDE/editor palette mechanics. |
| **Miller / Chunking** | Pass | Groups commands vs notes logically. |
| **Doherty Threshold** | Pass | Synchronous local fuzzy search executes in <10ms. |
| **Postel's Law** | Pass | Highly tolerant fuzzy search matching handles minor typos. |
| **Von Restorff** | Pass | Selected item has distinct contrast background. |
| **Proximity** | Pass | Input field and search results are seamlessly attached. |
| **Similarity** | Pass | Uniform row height and typography across list items. |
| **Common Region** | Pass | Single unified dialog container. |
| **Uniform Connectedness** | Pass | Highlighted background unifies selected title and action. |
| **Design tokens & styling** | Pass | Uses Radix Dialog and design tokens (`--color-bg-surface`, `--color-border-subtle`). |
| **Accessibility (a11y)** | Partial | Missing `aria-activedescendant` on input; uses `dangerouslySetInnerHTML` for highlighted title. |
| **Performance feel** | Pass | Snappy, lightweight DOM list; selection scrolls smoothly into view. |

---

## 3. Issues

### PALETTE-01: Microscopic close button violates Fitts's Law
- **Severity**: Low
- **Rule violated**: Fitts's Law
- **Evidence**: `apps/desktop/src/components/CommandPalette/CommandPalette.tsx:212` (`<X size={10} weight="bold" />`) `[Observed]`
- **Why it hurts the user**: Mouse users attempting to close the palette have a frustratingly tiny target to hit.
- **Suggested fix**: Increase icon to 14px or 16px and ensure the button container has `min-width: 32px; min-height: 32px;`.
- **Effort**: S

### PALETTE-02: Misleading empty state message during command queries
- **Severity**: Medium
- **Rule violated**: H2 Match with real world / H5 Error prevention
- **Evidence**: `apps/desktop/src/components/CommandPalette/CommandPalette.tsx:252` (`description={`No notes found. Press Enter to create "${query}".`}`) `[Observed]`
- **Why it hurts the user**: When a user types a command like "Git Push" and no command matches, the palette suggests creating a note named "Git Push.md", causing accidental file clutter.
- **Suggested fix**: Check if query starts with a command prefix or distinguish between note switcher and command palette modes; display `"No commands found matching..."`.
- **Effort**: S

### PALETTE-03: Missing ARIA active descendant attribute
- **Severity**: Medium
- **Rule violated**: Accessibility (a11y)
- **Evidence**: `apps/desktop/src/components/CommandPalette/CommandPalette.tsx:197-231` `[Code-Read Only]`
- **Why it hurts the user**: Screen readers do not announce which option is currently highlighted as the user presses Arrow Up and Arrow Down.
- **Suggested fix**: Add `aria-activedescendant={`palette-item-${selectedIndex}`}` to the input and matching IDs to list options.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.command-palette__input-wrapper` | Bordered box inside modal | Double border around top input | Flat borderless input with bottom hairline divider |

---

## 5. What Works Well
- Rapid fuzzy search scoring via `fuzzysort`.
- Auto-scrolls selected row into view smoothly (`scrollIntoView({ block: "nearest" })`).
- Returns focus cleanly to CodeMirror editor upon dismissal.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Fix close button hitbox and icon size (≤15 min).
- **Quick Win**: Add `aria-activedescendant` for screen reader accessibility (≤30 min).
- **Larger Work**: Add command categorization tabs or prefix filtering (e.g., `>` for commands only, `#` for tags).
