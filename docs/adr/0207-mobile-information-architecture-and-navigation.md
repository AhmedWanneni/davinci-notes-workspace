# ADR-0207: Mobile Information Architecture and Minimalist Navigation

## Status

Proposed

## Context

`apps/mobile` currently features a fractured navigation experience:
1. **Dual Paradigms**: The app alternates between an Expo Router bottom-tab bar on `(tabs)` (`Files`, `Search`, `+`, `Tags`) and an Obsidian-style full-screen view on `/note` with `MobileHeader` and `QuickActionBar`.
2. **Orphaned Features**: Several core capabilities—such as the SVG `LocalGraphView`, the read-only `CanvasViewer`, and folder creation—exist in the codebase but have no accessible triggers in the UI.
3. **Fragmented Sheets**: Bottom sheets (`FolderActionSheet`, `BacklinksSheet`, `OutlineSheet`, `VaultSwitcherSheet`, `NoteActionSheet`) use inconsistent layouts, varying paddings, and in several cases import static `darkColorTokens` instead of consuming `useTheme()`, breaking light and custom themes.
4. **Header Clutter**: Screens feature dense headers with multiple competing action buttons (e.g., Files header has `Folders`, `Sort`, `Gear`, and `Gallery`), violating the "content first" principle.
5. **Secondary Actions Visibility**: Destructive and file management actions (rename, move, delete) are either missing confirmation/undo feedback or trigger jarring full-screen transitions instead of streamlined bottom sheets.

## Decisions

### 1. Unified Information Architecture
- **Primary Daily Loop (3-Slot Bottom Navigation)**:
  - **Files**: Quiet, content-first file tree with folder expansion, pull-to-refresh vault sync, and vault switcher in top header.
  - **Search**: Fast, unified search screen with debounced FTS5 full-text queries, recent notes list, and filter sheet trigger (supporting tags, folders, and recents).
  - **Create Action (`+`)**: Prominent thumb-zone floating action button. Tap immediately creates and opens a new note; long-press opens the `CreateActionSheet` with fast capture options (Daily Note, Take Photo, Attach Image, Voice Memo).
- **Note View (Reading & Editing Parity)**:
  - Full-screen immersion adhering to Obsidian mobile parity.
  - Top header (`MobileHeader`): Sidebar drawer toggle (`SidebarSimple`), breadcrumb note title, reading/edit toggle (`BookOpen` / `PencilSimple`), and overflow action menu (`DotsThreeVertical`).
  - Bottom bar (`QuickActionBar`): 5 discrete, evenly-spaced thumb targets: `<` (Back), `>` (Forward), `(+)` (New Note), `[ 1 ]` (Tab/Leaf Switcher), and `⇅` (Action Menu / Sheet).
  - Tap-to-edit: Tapping the reading view text immediately activates the CodeMirror 6 editor without navigation delay.
  - Quiet Autosave: Micro status dot (saved/saving/error) integrated into the header chrome without disruptive full-width banners.

### 2. Vault Drawer as the Comprehensive Hub
- The slide-out `NavigationDrawer` (accessible via hamburger button or swipe from left edge) provides secondary navigation:
  - **Top**: Active vault switcher dropdown with folder/note count.
  - **Tree View**: Full collapsible folder hierarchy with file counts and inline folder creation.
  - **Quick Sections**: Direct shortcuts to Daily Note, Tags view, and Local Graph view.
  - **Bottom**: Vault Settings gear shortcut and sync status indicator.

### 3. Universal Sheet Component Pattern
All secondary interactions, view switches, and file operations use the standardized `Sheet` and `SheetGroup` primitives:
- `NoteActionSheet`:
  - Group 1: Close note.
  - Group 2: View options (Reading view, Source mode, Outline, Backlinks & Mentions, Local Graph).
  - Group 3: File operations (Pin/Unpin, Rename, Move to folder, Add property, Delete note).
- `FileActionSheet`:
  - Replaces `FolderActionSheet` for list items: Open, Pin/Unpin, Rename, Move to folder, Delete (with 5-second undo toast).
- `CreateActionSheet`:
  - New Blank Note, Daily Note, Take Photo (Camera), Attach Photo (Library), Record Voice Memo.
- `FilterSheet`:
  - Filter search results by tag, folder, or date range.

### 4. 100% Theme Token Strictness
- Elimination of all direct `darkColorTokens` imports across components.
- Every primitive, icon, text style, divider, and sheet background is bound directly to `useTheme().tokens`, ensuring all 4 built-in themes (Catppuccin Frappé, Catppuccin Latte, Light A, Dark B) and custom vault themes render with high contrast and zero visual defects.

### 5. Predictable Back-Navigation & Hardware Back Discipline
- On Android, `BackHandler` hooks intercept the hardware back gesture in priority order:
  1. Close open modal bottom sheet.
  2. Close open navigation drawer.
  3. Exit search / clear query.
  4. Navigate `router.back()` with stable note identity preservation (`noteId`).

## Consequences

- Every single existing feature (Files, Folders, Search, Tags, Backlinks, Outline, Properties, Fast Capture, Attachments, Sync, Settings, Graph, Canvas) is fully accessible within $\le 2$ taps from the primary view.
- The UI becomes genuinely minimalist: headers are quiet, lists are uncluttered, and secondary operations live consistently inside standard bottom sheets.
- 0 bytes added to the production bundle; zero new dependencies.
- Zero impact on desktop code or desktop token values.
