# Screen Review: File Tree Emoji Picker & Popover

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/FileTree/FileTreeEmojiPopover.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/FileTreeEmojiPopover.tsx), [`FileTreeEmojiPicker.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/FileTreeEmojiPicker.tsx), [`FileTreeEmojiCategoryBar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/FileTreeEmojiCategoryBar.tsx)
- **Entry Points**: Clicking on a file or folder icon in the file tree, or context menu "Change icon".
- **Purpose & Core User Job**: Assigns a custom emoji icon to any file or folder for visual distinctiveness and spatial organization.
- **Current State Description**: Floating popover containing a search input, category navigation bar (Smileys, People, Nature, Food, Travel, Activities, Objects, Symbols, Flags), an emoji grid, and a "Remove icon" button.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Category bar highlights active category during scroll. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Standard emoji picker layout (matching macOS/iOS picker). |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | "Remove icon" button clears custom emoji; Escape closes popover. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard category grouping matching Unicode emoji standards. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Search input clears easily; selecting emoji immediately applies and closes. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Visual emoji grid with real-time keyword search. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Search-as-you-type filter allows typing "star" or "book" for instant pick. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Compact popover without excessive border nesting. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Can change or remove icon anytime. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Search placeholder "Search emoji...". |
| Laws of UX | Fitts's Law | **Partial** | Individual emoji grid cells are ~26×26px, slightly tight for fast clicking. |
| Laws of UX | Hick's Law | **Pass** | Categories and search filter prevent choice overload across 3000+ emojis. |
| Laws of UX | Jakob's Law | **Pass** | Parity with Notion / Slack emoji pickers. |
| Laws of UX | Miller's Law | **Pass** | Segmented into Category Bar, Search, and Grid. |
| Laws of UX | Doherty Threshold | **Pass** | Lazy-loaded emoji dataset; renders in <100ms. |
| Laws of UX | Postel's Law | **Pass** | Flexible keyword matching across aliases. |
| Laws of UX | Von Restorff | **Pass** | Selected/hovered emoji scales slightly. |
| Gestalt Laws | Similarity & Grid | **Pass** | Strict uniform grid with consistent cell dimensions. |
| Design System | Flat & Tokens | **Pass** | Uses design tokens for colors, borders, and popover scrim. |
| A11y & Perf | Initial Load & Focus | **Partial** | Search input auto-focus is slightly delayed until emoji dataset evaluates. |

---

## 3. Issues & Recommended Fixes

### EMOJI-01: Slightly Tight Grid Cell Hitbox (26px)
- **Severity**: Low
- **Rule Violated**: Fitts's Law
- **Evidence**: `FileTreeEmojiPicker.tsx:84`: Grid cells are 26×26px with 2px gap `[Observed]`
- **Impact**: Fast mouse selection occasionally triggers adjacent emoji.
- **Suggested Fix**: Expand cell size to `30×30px` with `font-size: 20px`.
- **Effort**: S (<15m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.file-tree-emoji-popover` | Border + bg-primary-alt | Standard popover frame | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Dynamic code splitting prevents the emoji database from bloating initial startup bundle.
- Clean category bar allows fast jump-scrolling across emoji sets.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Enlarge emoji grid cells to 30×30px.
- **Larger Work**: None.
