# Redesign Settings Dialog to Match Obsidian Layout & Aesthetic

Transform the Davinci Notes Settings Dialog into the modern, two-pane Obsidian-style settings modal depicted in the reference screenshot.

## Proposed Layout & Architecture

The new Settings Dialog will adopt a split-pane layout:
1. **Window Header / Frame**:
   - macOS-style window traffic light dots (red, yellow, green) on the top-left.
   - Centered title bar: `Settings - {vaultName} - Davinci Notes {version}`.
   - Close button on top-right.
2. **Left Navigation Sidebar**:
   - Top search input: `Search settings...` with `MagnifyingGlass` icon.
   - Navigation Categories & Items with Phosphor icons:
     - **Options**:
       - *General* (`Gear` / `SlidersHorizontal`)
       - *Appearance* (`Palette`)
       - *Editor* (`NotePencil`)
       - *Files and links* (`FolderSimple`)
       - *Sync & Backup* (`CloudArrowUp`)
       - *AI Assistant* (`Sparkle`)
       - *Community plugins* (`PuzzlePiece`)
     - **Core plugins**:
       - *Backlinks* (`TreeStructure`)
       - *Canvas* (`SquaresFour`)
       - *Command palette* (`TerminalWindow`)
       - *Daily notes* (`CalendarBlank`)
       - *File recovery* (`ClockCounterClockwise`)
       - *Note composer* (`Compass`)
       - *Page preview* (`Eye`)
       - *Quick switcher* (`MagnifyingGlass`)
       - *Templates* (`CopySimple`)
     - Filterable by the search box to quickly find settings.
3. **Right Content Area**:
   - Organized into Obsidian-style card groupings (`SettingsCard` and `SettingsRow`):
     - Setting item title + description + optional links.
     - Action controls on the right: toggle switch, select dropdowns, action buttons ("Check for updates", "Switch Vault", "Log in", "Sign up", "Choose folder", etc.).
   - Tabs corresponding to sidebar options:
     - **General**: App version info, check for updates, automatic updates toggle, early access toggle, language selector, help button, Account section (login/signup mockup), Vault location & Switch Vault button.
     - **Appearance**: Active theme picker, theme list, Theme Browser.
     - **Editor**: Font family dropdown, font size slider & input + reset, strict line breaks toggle, vim mode toggle.
     - **Files and links**: Attachment location modes & folder picker.
     - **Sync & Backup**: Google Drive sync provider, manual sync, conflicts, Git remote setup.
     - **AI Assistant**: AI subsystem provider settings.
     - **Community plugins**: Plugin management and Plugin Browser.

## Design System & Code Quality Compliance
- **File line limits**: Under 200 lines per file (strict max 250).
- **CSS Modules**: Colocated `SettingsDialog.module.scss` using design tokens, strictly kebab-case class names, border-driven depth (no shadows/gradients/glassmorphism).
- **Storybook & Unit Tests**: Full test suite and Storybook stories.

---

## Proposed Changes

### `apps/desktop/src/components/SettingsDialog`

#### [NEW] [SettingsRow.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsRow.tsx)
- Reusable row component rendering title, description/subtext, links, and right-aligned control.

#### [NEW] [SettingsCard.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsCard.tsx)
- Card container for grouping settings rows with internal divider lines.

#### [NEW] [SettingsSidebar.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsSidebar.tsx)
- Left navigation sidebar with search filter, section headers, active tab highlighting, and icons.

#### [NEW] [GeneralSettingsTab.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/GeneralSettingsTab.tsx)
- Obsidian General tab: version info, updater toggles, language selector, account cards, vault switcher.

#### [NEW] [EditorSettingsTab.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/EditorSettingsTab.tsx)
- Editor font, font size range + reset, strict line breaks, vim keybindings.

#### [NEW] [AppearanceSettingsTab.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/AppearanceSettingsTab.tsx)
- Theme selector, theme browser trigger, discovery errors.

#### [NEW] [FilesLinksSettingsTab.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/FilesLinksSettingsTab.tsx)
- Attachment location configuration and folder chooser.

#### [NEW] [SyncSettingsTab.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SyncSettingsTab.tsx)
- Drive sync controls, conflict resolution, git remote setup.

#### [NEW] [PluginsSettingsTab.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/PluginsSettingsTab.tsx)
- Plugin list, plugin browser, and dynamic plugin settings.

#### [MODIFY] [SettingsDialog.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.tsx)
- Master modal layout orchestrating sidebar, tabs, and header.

#### [NEW] [SettingsDialog.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.module.scss)
- SCSS Module styling with design tokens and Obsidian-like aesthetic.

#### [NEW] [SettingsDialog.test.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.test.tsx)
- Unit and interaction tests for tab switching, search filtering, and controls.

#### [NEW] [SettingsDialog.stories.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.stories.tsx)
- Storybook stories for the new SettingsDialog.

---

## Verification Plan

### Automated Tests
- Run `pnpm --filter @app/desktop test` to verify all existing and new unit tests pass.
- Run `pnpm --filter @app/desktop lint` and `pnpm --filter @app/desktop typecheck`.

### Manual Verification
- Verify tab switching (General, Appearance, Editor, Files and links, Sync & Backup, AI Assistant, Plugins).
- Verify search query filters the sidebar items.
- Verify changing fonts, font size, toggles, vault switching, themes, and sync settings work seamlessly.
- Verify styling faithfully matches the Obsidian modal in the screenshot.
