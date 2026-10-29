# Phase 9: Search / Quick Switcher

Implement a fast, keyboard-driven Quick Switcher (Cmd/Ctrl+K) for navigating between notes by title, mirroring Obsidian's Quick Switcher. This fulfills Phase 9 of the desktop app build plan, prioritizing lightweight performance and responsive UI.

## User Review Required

> [!IMPORTANT]
> **Fuzzy Match Library Choice**: I propose using `fuzzysort` (approx. 5-6kb gzipped).
> **Reasoning**: `fuzzysort` is explicitly designed for Sublime Text / Obsidian style quick switchers. It provides extremely fast in-memory matching and ranking (handling recency/exact-match boosting well), and crucially, it has built-in support for generating highlighted character chunks (`fuzzysort.highlight(result, '<mark>', '</mark>')`). Writing a custom fuzzy matcher with proper highlighting would add significant complexity and likely perform worse. This aligns with the `PERFORMANCE.md` directive to pick the approach with less runtime overhead and minimal bundle impact while delivering the required UX.
>
> Let me know if you approve this library addition!

## Open Questions

None currently. The requirements are clear from the phase description and `PERFORMANCE.md`.

## Proposed Changes

---

### `apps/desktop` - Dependencies

#### [MODIFY] [package.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/package.json)

- Add `fuzzysort` as a dependency.

---

### `apps/desktop` - UI Components

#### [NEW] [CommandPalette.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/CommandPalette.tsx)

- Create the Command Palette modal using `@app/design-system` `Dialog` primitive.
- Implement an input field that live-filters `allNotePaths` using `fuzzysort`.
- Handle keyboard navigation (Arrow Up/Down, Enter, Escape). Radix UI's Dialog automatically handles the focus trap and Escape to close.
- Render the result list with highlighted matched characters.

#### [NEW] [CommandPalette.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/CommandPalette.module.scss)

- Style the full-screen centered modal.
- Apply design system tokens (kebab-case classes, no shadows, typography-driven).
- Style the `<mark>` tags for highlighted characters.

#### [NEW] [index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/index.ts)

- Barrel export for `CommandPalette`.

---

### `apps/desktop` - State & Wiring

#### [MODIFY] [useWorkspaceStore.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/state/useWorkspaceStore.ts)

- Add a new action `getRecentNotes()` or expose `openNotes` / access history to allow `fuzzysort` to break ties based on recency. (Currently, `openNotes` acts as recent tabs, which is a good proxy for recency).

#### [MODIFY] [App.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/App.tsx)

- Add a global keyboard event listener for `Cmd+K` (mac) / `Ctrl+K` (windows/linux) to toggle the `CommandPalette` open state.
- Wire `CommandPalette` `onSelect` to call `openNote(path)`.
- Mount `<CommandPalette />` at the root of `App.tsx` (it will be lazy-loaded or conditionally rendered to adhere to `PERFORMANCE.md` rule: "Lazy-load non-critical views").

## Verification Plan

### Automated Tests

- Run `pnpm turbo run test lint typecheck` to verify no regressions in the monorepo.

### Manual Verification

1. Open the large fixture vault (350 notes).
2. Press `Cmd+K` to open the Quick Switcher.
3. Type a fuzzy query (e.g., "mtgnts" for "Meeting Notes") and verify it filters instantly without perceptible lag.
4. Verify characters are highlighted correctly.
5. Use Arrow Up/Down to navigate results and press Enter to select one.
6. Verify the selected note opens in the editor.
7. Create a new note (via unresolved link or "New Note" button), open the switcher, and verify the new note appears in the results immediately.
