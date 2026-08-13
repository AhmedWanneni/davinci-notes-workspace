# Phase 11: Settings and Polish

This phase introduces a settings panel, preference persistence across restarts, and unifies the empty/loading/error states across the application using a new `EmptyState` shared component.

## User Review Required

- **Theme Settings:** `DECISIONS.md` specifically states the app is "dark-first" and uses Obsidian dark theme values. There are no light theme tokens yet. Therefore, I will **not** implement a theme toggle to avoid introducing a non-functional UI element. I will document this decision in `DECISIONS.md`.
- **Persistence Mechanism:** Since we already have a robust SQLite setup (`vault-index.db`), I will create a `settings` table in the database to store preferences. This avoids adding a new dependency (`tauri-plugin-store`) or writing raw JSON files, keeping our I/O predictable. I'll add a `v2` migration in `db.rs` to ensure existing local vaults get the new table.

## Open Questions

- None at this time.

## Proposed Changes

### Settings & State Management

#### [MODIFY] [packages/indexer/schema.sql](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/indexer/schema.sql)

- Add `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);` to the schema for new installs.

#### [MODIFY] [apps/desktop/src-tauri/src/db.rs](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src-tauri/src/db.rs)

- Add a `v2` migration with `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);` to apply it to existing local databases.

#### [NEW] [apps/desktop/src/vault/settingsCommands.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/vault/settingsCommands.ts)

- Add SQLite wrapper functions: `getSetting(key)` and `setSetting(key, value)`.

#### [MODIFY] [apps/desktop/src/state/useWorkspaceStore.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/state/useWorkspaceStore.ts)

- Add `editorFont` preference (defaulting to System UI) to the store.
- Add `loadSettings()` action that fetches from SQLite on startup.
- Update CSS variable `--font-editor` on the document body when `editorFont` changes.

### UI Polish & Empty States

#### [NEW] [apps/desktop/src/components/EmptyState/EmptyState.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/EmptyState/EmptyState.tsx)

- Create a reusable `EmptyState` component using our design-system `Typography` and an optional icon for consistency.

#### [MODIFY] [apps/desktop/src/App.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/App.tsx)

- Refactor the "no vault loaded" view to use `EmptyState`.
- Add a loading state while the vault is indexing.
- Add an error state if the vault fails to open.
- Refactor the "no note open" placeholder in the editor wrapper to use `EmptyState`.
- Initialize settings on mount.

#### [MODIFY] [apps/desktop/src/components/BacklinksPanel/BacklinksPanel.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/BacklinksPanel/BacklinksPanel.tsx)

- Refactor the empty and loading states to use the new `EmptyState` component.

#### [MODIFY] [apps/desktop/src/components/CommandPalette/CommandPalette.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/CommandPalette.tsx)

- Add/update the empty state styling to align with `EmptyState` patterns.

#### [MODIFY] [apps/desktop/src/components/GraphView/GraphView.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/GraphView/GraphView.tsx)

- Add an `EmptyState` when rendering the local graph for a note with no connections.

### Settings UI

#### [NEW] [apps/desktop/src/components/SettingsDialog/SettingsDialog.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/SettingsDialog/SettingsDialog.tsx)

- A modal using the design-system `Dialog` primitive.
- Includes a `<select>` or `Radio` for selecting the Editor Font (System, Monospace, Serif).
- Includes the current Vault Path and a button to switch vaults (reusing `openVaultFromPicker`).

#### [MODIFY] [apps/desktop/src/components/CommandPalette/CommandPalette.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/components/CommandPalette/CommandPalette.tsx)

- Add "Open Settings" as a static command option.

## Verification Plan

### Automated Tests

- Typecheck and lint using the monorepo tooling.

### Manual Verification

- Change the font setting, restart the app, and verify the setting persists.
- Open the app with no vault, verify the empty state.
- Select an invalid folder for the vault to trigger the error state.
- Search for a non-existent note to trigger the quick switcher empty state.
- Open a note with no backlinks/links and view the local graph to trigger its empty state.
