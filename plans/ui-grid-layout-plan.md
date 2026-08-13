# Restructure Desktop App Shell to Obsidian UI Grid Layout

Restructure `apps/desktop` layout and composition to match the official Obsidian UI architecture per [apps/wireframe.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/wireframe.md). This establishes a full CSS Grid app shell containing: Top Tab Bar, Left Icon Rail, Collapsible File Tree, Main Content area with a Properties Block, Stacked Right Panel (Linked Mentions, Unlinked Mentions, Note Outline), and a Bottom Status Bar.

## Proposed Layout Architecture & Grid Mechanics

```
+---------------------------------------------------------------------------------------+
| TOP TAB BAR (Full Width or Main+Sidebars: Tabs, "+", Layout Options, Sidebar Toggles)  |
+---------+--------------------+-------------------------------------------+------------+
| ICON    | LEFT SIDEBAR       | MAIN CONTENT                              | RIGHT      |
| RAIL    | (Collapsible)      | - Top Navigation / Title Breadcrumb       | SIDEBAR    |
| (36px)  | - Vault Header     | - Properties / Frontmatter Block (Foldable)| (Collaps.) |
| - Files | - Virtualized      | - CodeMirror 6 Editor Body                | - Linked   |
| - Search|   File Tree        |                                           |   Mentions |
| - Graph |                    |                                           | - Unlinked |
| - Cal   |                    |                                           |   Mentions |
| - Gears |                    |                                           | - Outline  |
+---------+--------------------+-------------------------------------------+------------+
| STATUS BAR (Full Width: Left Vault/Sync info, Right: backlinks, properties, words)     |
+---------------------------------------------------------------------------------------+
```

### CSS Grid Shell:
- `grid-template-rows: auto 1fr auto;` (Top Tab Bar / Shell Header, Main Content Grid, Bottom Status Bar).
- Middle row grid: `[icon-rail] 40px [left-sidebar] var(--left-sidebar-width, 240px) [main-content] 1fr [right-sidebar] var(--right-sidebar-width, 260px)`.
- Collapsing sidebars adjusts column sizes to `0px` with `overflow: hidden` and `data-collapsed="true"`, preventing unmounting and preserving DOM state (scroll positions, expanded tree nodes, editor cursors).

---

## Detailed Components to Build / Restructure

### 1. Icon Rail (`apps/desktop/src/components/IconRail/`)
- Vertical icon strip (~40px wide).
- Navigation items:
  - **File Explorer** (`Files` / `Folder` icon): toggles left sidebar (file tree).
  - **Search** (`MagnifyingGlass` icon): opens Command Palette (Cmd+K).
  - **Global Graph** (`Graph` / `ShareNetwork` icon): opens Global Graph modal.
  - **Daily Notes** (`CalendarBlank` icon): placeholder action / creates or opens today's note.
  - Bottom items: **Settings** (`Gear` icon) and **Vault Switcher** / Close Vault.
- Phosphor icons with regular weight.

### 2. Top Tab Bar (`apps/desktop/src/components/AppTabs/`)
- Multi-tab strip with:
  - Active tab highlighting, dirty dot indicator, close button (`✕`).
  - `+` button to open a new tab / note.
  - Right side control buttons:
    - Right sidebar toggle (`SidebarSimple` icon).
    - Left sidebar toggle (`SidebarSimple` mirrored or layout icon).
    - View mode / layout options dropdown or button.

### 3. File Tree Sidebar (`apps/desktop/src/components/AppSidebar/`)
- Refactored to act cleanly as the collapsible left panel alongside the Icon Rail.
- Vault switcher title bar with New Note action.
- Virtualized `FileTree` (reused as-is from Phase 7).

### 4. Properties Block (`apps/desktop/src/components/PropertiesBlock/`)
- Sits above the note editor in `EditorArea`.
- Extracts frontmatter using `parseFrontmatter` from `@app/indexer`.
- Foldable header ("Properties" with count and collapse arrow).
- Row items for each frontmatter key-value pair:
  - Type-aware icons: `Tag` for tags, `Calendar` for dates, `User` for author, `Link` for note references, `List` for general metadata.
  - Tag pill badges (`#tag`).
  - Clickable wikilinks (`[[target]]`) that navigate to notes.
  - Plain string, number, and boolean formatters.
  - "+ Add property" affordance button at the bottom.

### 5. Right Sidebar (`apps/desktop/src/components/RightSidebar/`)
- Stacked sections:
  - **Linked Mentions** (`BacklinksPanel` from Phase 8): shows backlink sources and snippet context.
  - **Unlinked Mentions**: displays unlinked mentions count / placeholder with gap notification.
  - **Outline** (`NoteOutline` subcomponent): extracts markdown headings (`H1`, `H2`, `H3`) and enables clicking to scroll or focus headings.
  - **Local Graph** (foldable or tabbed).

### 6. Status Bar (`apps/desktop/src/components/StatusBar/`)
- Thin bar across the bottom.
- Left: Vault status.
- Right stats computed dynamically:
  - Backlinks count (from SQLite index / graph).
  - Properties count (from parsed frontmatter).
  - Word count & character count (from active note content).

---

## File Changes & Structure

1. **New Components**:
   - `apps/desktop/src/components/IconRail/IconRail.tsx` + `index.ts`
   - `apps/desktop/src/components/PropertiesBlock/PropertiesBlock.tsx` + `index.ts`
   - `apps/desktop/src/components/NoteOutline/NoteOutline.tsx` + `index.ts`
   - `apps/desktop/src/components/StatusBar/StatusBar.tsx` + `index.ts`

2. **Modified Components**:
   - `apps/desktop/src/components/AppTabs/AppTabs.tsx`: Add `+` tab button, sidebar toggles, and layout options.
   - `apps/desktop/src/components/AppSidebar/AppSidebar.tsx`: Simplified header (actions moved to Icon Rail and header).
   - `apps/desktop/src/components/EditorArea/EditorArea.tsx`: Incorporate `PropertiesBlock`.
   - `apps/desktop/src/components/RightSidebar/RightSidebar.tsx`: Stack Linked Mentions, Unlinked Mentions, and Outline.
   - `apps/desktop/src/App.tsx`: Refactor layout composition to grid shell with sidebar toggle states.

3. **Styles (CUBE CSS)**:
   - `apps/desktop/src/styles/layout/_app-shell.scss`: Grid layout definition and collapse transitions.
   - `apps/desktop/src/styles/layout/_sidebar.scss`: Sidebar collapse rules (`[data-collapsed="true"]`).
   - `apps/desktop/src/styles/components/_icon-rail.scss`: Icon rail styles.
   - `apps/desktop/src/styles/components/_properties-block.scss`: Properties block styling (borders, rows, tags, add property).
   - `apps/desktop/src/styles/components/_note-outline.scss`: Outline tree hierarchy styling.
   - `apps/desktop/src/styles/components/_status-bar.scss`: Status bar layout & typographic alignment.
   - `apps/desktop/src/styles/_main.scss`: Import new layout/component stylesheets.

---

## Verification Plan

### Automated Tests
- Run `pnpm test` across all packages (`@app/desktop`, `@app/design-system`, `@app/indexer`, `@app/core-types`).
- Run `pnpm lint` and `pnpm typecheck`.
- Run bundle size checker (`pnpm check:bundle-size`).
- Add unit tests for `PropertiesBlock` and `NoteOutline` helper logic.

### Manual Verification
- Validate multi-tab switching, tab closing, and new tab creation.
- Validate icon rail actions (toggle left sidebar, open Cmd+K, open Global Graph, open Settings).
- Validate toggle right sidebar button and persistent component state across collapses.
- Validate properties block rendering with tags, dates, and wikilinks.
- Validate Outline rendering H1/H2/H3 and clicking headings.
- Validate Status Bar metrics (backlinks, property count, word count, character count).
