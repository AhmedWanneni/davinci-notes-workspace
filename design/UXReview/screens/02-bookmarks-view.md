# Screen Review: Bookmarks View

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/BookmarksView/BookmarksView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/BookmarksView/BookmarksView.tsx), [`BookmarksView.module.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/BookmarksView/BookmarksView.module.scss)
- **Entry Points**: Clicking the "Bookmarks" icon in the IconRail, tab `davinci://bookmarks`, or Command Palette "Open bookmarks".
- **Purpose & Core User Job**: Quick access hub for pinned, high-priority notes and web bookmarks.
- **Current State Description**: Full-page or sidebar list displaying bookmarked notes, file paths, tags, and remove bookmark buttons.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Displays bookmarked notes and total count. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Standard bookmark / favorite pattern. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Individual "Remove bookmark" action on every row. |
| Nielsen Heuristics | H4 Consistency and standards | **Partial** | Several non-public token warnings and raw fallbacks in `BookmarksView.module.scss`. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Unbookmarking does not delete note files. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Displays note title, folder path, and tags. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Click opens note immediately; middle-click opens in new tab. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean list without excessive wrapper cards. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Can re-bookmark note anytime from editor or context menu. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty state describes how to bookmark notes. |
| Laws of UX | Fitts's Law | **Pass** | Rows span full container width with generous click area. |
| Laws of UX | Hick's Law | **Pass** | Simple single-purpose list. |
| Laws of UX | Jakob's Law | **Pass** | Matches Obsidian bookmarks panel behavior. |
| Laws of UX | Miller's Law | **Pass** | Chunked into note items. |
| Laws of UX | Doherty Threshold | **Pass** | Instant reactive list from Zustand store. |
| Laws of UX | Postel's Law | **Pass** | Handles missing or renamed notes gracefully. |
| Laws of UX | Von Restorff | **Pass** | Filled bookmark icon marks items clearly. |
| Gestalt Laws | Proximity & Grouping | **Pass** | Natural vertical rhythm with consistent spacing. |
| Design System | Design Tokens Only | **Fail** | `BookmarksView.module.scss` uses non-public tokens (`--type-size-xl`, `--type-size-sm`, `--color-accent`) with raw fallbacks. |
| A11y & Perf | Contrast & Focus | **Pass** | Clean contrast against background. |

---

## 3. Issues & Recommended Fixes

### BOOK-01: Non-Public Design Tokens & Fallback Values in SCSS
- **Severity**: Medium
- **Rule Violated**: Project Design Rules (Design Tokens Only)
- **Evidence**: `BookmarksView.module.scss:22-48`: Uses non-public tokens `--type-size-xl`, `--type-size-sm`, `--color-accent` and raw fallbacks `var(--type-size-xl, 1.25rem)` `[Observed]`
- **Impact**: Causes `pnpm check:public-tokens` to fail with 26 violations in this module alone; violates zero raw values policy.
- **Suggested Fix**: Replace with public design tokens:
  ```scss
  // Before
  font-size: var(--type-size-xl, 1.25rem);
  color: var(--color-border-focus, var(--color-accent));

  // After
  font-size: var(--type-scale-xl);
  color: var(--color-border-focus);
  ```
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.bookmarks-view__item` | Subtle hover background | Follows flat design system | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Empty state with BookmarkSimple icon provides clear onboarding when 0 bookmarks exist.
- One-click navigation to notes with middle-click new tab support.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate all non-public token variables in `BookmarksView.module.scss` to canonical public tokens.
- **Larger Work**: None.
