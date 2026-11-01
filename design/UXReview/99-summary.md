# Sophia Desktop UX Review: Executive Summary & Roadmap

## 1. Cross-Screen Heatmap

Evaluation matrix across 8 screen groups and the 5 primary rule families:
- **Heuristics**: Nielsen's 10 Heuristics (H1–H10)
- **Laws**: Laws of UX (Fitts, Hick, Jakob, Miller, Doherty, Postel, Von Restorff)
- **Gestalt**: Over-boxing, container nesting, visual grouping order
- **Design Tokens**: Flat, borders not shadows, Phosphor icons, token adherence
- **A11y & Perf**: Keyboard trapping, ARIA roles, focus restoration, fast feel

| Group | Surfaces Reviewed | Heuristics | Laws of UX | Gestalt / Boxing | Design Tokens | A11y & Perf |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **01 Navigation & Chrome** | 7 screens | Partial | Partial (Fitts/Jakob) | Fail (Over-boxed status) | Pass | Partial (Focus order) |
| **02 File Tree & Sidebar** | 8 screens | Pass | Partial (Fitts hitboxes) | Pass | Pass | Fail (Virtual roving tab) |
| **03 Editor & Formatting** | 9 screens | Partial | Pass | Partial (Card banners) | Partial (Pill badges) | Pass |
| **04 Special Views** | 7 screens | Pass | Pass | Pass | Pass | Pass |
| **05 AI & Audio** | 5 screens | Partial | Partial (Keyboard send) | Partial (Diff cards) | Pass | Partial (Aria-live) |
| **06 Inspectors & Right Sidebar** | 7 screens | Pass | Pass | Partial (Card subsections) | Pass | Partial (Aria-labels) |
| **07 Dialogs & Modals** | 7 screens | Partial (Copy error) | Partial (Fitts close btn) | Pass | Pass | Partial (Tree a11y) |
| **08 Settings & QuickCapture** | 6 groups | Pass | Pass | Fail (Card-in-card fatigue) | Partial (Raw emoji) | Pass |

---

## 2. Cross-Screen Systemic Patterns

### Pattern 1: Over-Boxing (Box-in-Box Syndrome)
Across Settings (`SettingsCard`), Git Manager (`GitCommitBox`), and Inspectors (`BacklinksPanel`, `SuggestLinksPanel`), components consistently introduce nested rounded card wrappers (`border`, `border-radius: 6px`, `background: var(--color-bg-surface-elevated)`).
- **Root Cause**: Early AI generation used card components to isolate features rather than relying on standard typographic hierarchy and 1px hairline dividers (`border-bottom: 1px solid var(--color-border-subtle)`).
- **Impact**: In sidebars (240px–300px width), nested boxes waste 24px–32px of horizontal text width on padding and margins, causing premature text truncation.

### Pattern 2: Fitts's Law Violations on Dialog Dismiss Buttons
Across `CommandPalette.tsx`, `SearchDialog.tsx`, and `QuickCaptureHeader.tsx`, close buttons render icons with size 10px (`<X size={10} weight="bold" />`) in tiny 18×18px containers.
- **Root Cause**: Copy-pasting compact icon styling without setting minimum bounding click targets.
- **Impact**: Desktop mouse users experience frustrating misclicks when dismissing overlays.

### Pattern 3: Virtualized List Keyboard Trapping (ARIA Roving Tabindex)
In `FileTreeRow.tsx` and list views, every row was given `tabIndex={0}`.
- **Root Cause**: Misunderstanding virtualized list accessibility; applying tabIndex to DOM elements rather than managing a roving index on the parent container.
- **Impact**: Pressing `Tab` to navigate through the interface traps keyboard users in a 40+ keypress loop through every visible file row.

### Pattern 4: Copy-Paste Placeholder Regressions
`SearchDialog.tsx` renders `placeholder="Select a command..."` identical to `CommandPalette.tsx`.
- **Root Cause**: Forking component code without updating localized placeholder strings.
- **Impact**: Violates Nielsen H2 (Match with real world) and causes immediate user confusion regarding search scope.

### Pattern 5: Destructive Actions Lacking Confirmations
`SyncConflictsPanel.tsx` and several tree delete triggers delete items from the filesystem immediately upon clicking `<Trash />` without an alert or Trash staging.
- **Root Cause**: Fast prototype implementations directly invoking backend commands (`deleteNoteInVault`) without modal interceptors.
- **Impact**: Catastrophic data loss risk on misclicks.

---

## 3. Top 15 Issues Ranked by ROI (Impact ÷ Effort)

| Rank | Issue ID | Screen / Component | Summary | Impact | Effort | ROI |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **1** | `CONFLICT-01` | `SyncConflictsPanel.tsx` | One-click permanent file deletion with no confirmation modal | Blocker | S | **Highest** |
| **2** | `WIN-01` | `WindowControls.tsx` | Button order is Close, Min, Max on Windows/Linux instead of Min, Max, Close | High | S | **High** |
| **3** | `SEARCH-01` | `SearchDialog.tsx` | Search placeholder says "Select a command..." instead of "Search notes..." | High | S | **High** |
| **4** | `TREE-01` | `FileTreeRow.tsx` | `tabIndex={0}` on every virtual tree row traps keyboard navigation | High | S | **High** |
| **5** | `RAIL-01` | `IconRail.tsx` | 14 unscrollable rail icons get clipped in windows ≤480px height | High | S | **High** |
| **6** | `PROP-01` | `PropertiesBlock.tsx` | "Add property" button has no click handler (dead click) | High | S | **High** |
| **7** | `ASK-01` | `AskYourVaultPanel.tsx` | Textarea cannot be submitted with `Enter` (mouse click required) | Medium | S | **High** |
| **8** | `PALETTE-01` | `CommandPalette.tsx` | Microscopic close button icon (size 10) violates Fitts's Law | Medium | S | **High** |
| **9** | `PROP-02` | `PropertiesBlock.tsx` | Tag badges use pill variant (`border-radius: 9999px`), violating design rules | Medium | S | **High** |
| **10** | `CAPTURE-01`| `QuickCaptureHeader.tsx` | Raw emoji `🎙️ Record` in tab header violates Phosphor icon rule | Low | S | **High** |
| **11** | `PLUGIN-01` | `PluginBrowser.tsx` | Missing community plugin security warning banner | High | S | **High** |
| **12** | `TAGS-01` | `TagsDialog.tsx` | Missing tag search input forces scrolling in large vaults | High | M | **Medium** |
| **13** | `SYNC-01` | `SyncthingPanel.tsx` | 6 nested bordered cards stacked in a single tab | High | M | **Medium** |
| **14** | `SET-01` | `SettingsCard.tsx` | Double-nested bordered cards across all 12 settings tabs | Medium | M | **Medium** |
| **15** | `STAT-01` | `_status-bar.scss` | Floating boxed right status pill collides with left status text | Medium | S | **High** |

---

## 4. Proposed Fix Roadmap (Prompt-Sized Units)

Each unit represents a scoped, single-concern commit strictly following the one-AI-change rule:

### Phase 1: Critical Safety & Window Control Fixes (Commit 1)
- **Unit 1.1**: Fix `CONFLICT-01` by adding a Radix confirmation modal to `SyncConflictsPanel.tsx` before invoking `deleteNoteInVault`.
- **Unit 1.2**: Fix `WIN-01` by reordering window controls in `WindowControls.tsx` on Windows/Linux to Minimize, Maximize, Close.
- **Commit**: `fix(ux): add sync conflict delete confirmation and correct window controls order`

### Phase 2: Navigation & Chrome Polish (Commit 2)
- **Unit 2.1**: Fix `RAIL-01` by making `IconRail.tsx` center section vertically scrollable with hidden scrollbars.
- **Unit 2.2**: Fix `STAT-01` by removing absolute positioning card box in `_status-bar.scss` and using standard flex spacing.
- **Unit 2.3**: Fix `TREE-01` by setting `tabIndex={-1}` on `FileTreeRow.tsx` and managing roving focus at the tree root.
- **Commit**: `fix(ux): resolve rail overflow, status bar overlap, and file tree keyboard trap`

### Phase 3: Dialogs & Palette Refinement (Commit 3)
- **Unit 3.1**: Fix `SEARCH-01` by updating `SearchDialog.tsx` placeholder to `"Search notes, tags, or content..."`.
- **Unit 3.2**: Fix `PALETTE-01` & `SEARCH-02` by increasing dialog close button icons to 14px and hitboxes to 32px.
- **Unit 3.3**: Fix `TAGS-01` by adding a filter input to `TagsDialog.tsx`.
- **Commit**: `fix(ux): correct search dialog placeholder, enlarge close targets, and add tag filter`

### Phase 4: Editor & Properties Polish (Commit 4)
- **Unit 4.1**: Fix `PROP-01` by hooking up the "Add property" button in `PropertiesBlock.tsx` to an inline property key/value prompt.
- **Unit 4.2**: Fix `PROP-02` by switching tag badges in `PropertiesBlock.tsx` from pill radius to standard `radius-sm` (4px).
- **Unit 4.3**: Fix `ASK-01` by adding `onKeyDown` Enter submission to `AskYourVaultPanel.tsx`.
- **Commit**: `fix(ux): wire up add property button, flatten tag badges, and add enter to submit in ask vault`

### Phase 5: Box Audit & Settings Flattening (Commit 5)
- **Unit 5.1**: Flatten `SettingsCard.tsx` styles in `SettingsDialog.module.scss`, eliminating nested card borders in favor of hairline dividers.
- **Unit 5.2**: Replace `🎙️` in `QuickCaptureHeader.tsx` with Phosphor `<Microphone />` icon.
- **Unit 5.3**: Consolidate `SyncthingPanel.tsx` card sections into flat grouped lists.
- **Commit**: `refactor(ux): flatten settings card wrappers and replace emoji tab icons`

---

## 5. Proposed "Box Budget" Rules (Draft ADR)

To be added as an ADR under `docs/adr/` and linked from `AGENTS.md`:

```markdown
# ADR-0231: Gestalt Grouping and Box Budget Rules for UI Surfaces

## Status
Proposed

## Context
Sophia Desktop's design language is editorial, flat, typography-driven, and Swiss-influenced (ADR-0010, ADR-0027).
Over multiple development sessions, AI-generated components accumulated heavy container boxes, cards, and borders around simple lists, settings rows, and inspector tabs. This created visual noise, reduced available content area in sidebars, and violated our core design principle ("Depth = borders, not shadows; Editorial layout").

## Decision
All future UI components and refactors must adhere to the "Box Budget" rules:

1. **Max Nesting Depth of 1 Box**:
   - Inside any panel, sidebar, or dialog window, there shall be at most ONE bounding border or background layer.
   - Elements inside a panel (such as settings rows, list items, or inspector subsections) must NOT create nested cards or bordered rectangles.

2. **Strict Grouping Hierarchy (Lightest to Heaviest)**:
   Always attempt to express grouping using the lightest technique first:
   Spacing (16px/24px) → Typography/Uppercase Overline → 1px Hairline Divider (`--color-border-subtle`) → Subtle Background Tint → Border → Card.
   Cards with borders and backgrounds are permitted ONLY for visual media galleries (Theme Browser, Canvas cards, Image previews).

3. **No Pill Badges**:
   - Status indicators and tags must use rectangular or subtly rounded corners (`border-radius: var(--radius-sm, 4px)`), never fully rounded pill shapes (`border-radius: 9999px`).

4. **Minimum Click Target**:
   - All interactive icons and buttons on desktop must provide a minimum clickable bounding box of 32×32px, even if the inner icon is 12px–16px.

## Consequences
- Reduces DOM nesting depth and simplifies SCSS stylesheets.
- Increases usable horizontal screen space in narrow sidebars by 24px–32px.
- Restores consistent Swiss-editorial aesthetic across all views.
```
