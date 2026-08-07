# Goal Description

Implement Phase 8: Backlinks Panel. The panel will display incoming links to the currently active note, along with the context snippet surrounding each link. It will use the existing SQLite index to find backlink sources efficiently and load the snippets dynamically to avoid a database schema migration.

## User Review Required

- **Placement**: I propose adding a Right Sidebar for the backlinks panel. The left sidebar currently holds the file tree. The right sidebar will be collapsible and match the styling of the left sidebar.
- **Snippet Extraction**: Instead of running a SQLite migration to add a `context` column, I will dynamically load the few source files on demand (via `useWorkspaceStore` cache or fast Rust IPC) and extract the context snippet using `parseLinks`. This keeps the DB schema clean, fully satisfies the performance constraint (we use the index to *find* the files, avoiding a vault scan), and executes in < 5ms.

## Proposed Changes

### `apps/desktop/src/state/useWorkspaceStore.ts`

- **[MODIFY]** Add a `vaultUpdateCounter` to the state. This will increment whenever a note is saved locally or when `reconcileVaultChanges` finishes processing an external watcher event. This provides a lightweight trigger for the Backlinks Panel to re-run its SQLite query without polling.

### `apps/desktop/src/components/BacklinksPanel`

- **[NEW]** `BacklinksPanel.tsx`: A new React component that queries SQLite for backlinks to the `activeNotePath`, fetches context snippets, and renders them.
- **[NEW]** `BacklinksPanel.module.scss`: Styles for the panel using Design System primitives (`Typography`, `color-bg-primary-alt`, etc.) with kebab-case classes.
- **[NEW]** `index.ts`: Barrel export for the component.

### `apps/desktop/src/App.tsx` and `App.module.scss`

- **[MODIFY]** `App.tsx`: Import and render `<BacklinksPanel />` as a new right-hand `<aside>` pane in the main layout.
- **[MODIFY]** `App.module.scss`: Add styles for the right sidebar to mirror the left `.sidebar` layout (flex layout, borders, background colors).

## Verification Plan

### Manual Verification

1. Open the app using the large fixture vault (350 notes).
2. Navigate to a note known to have backlinks (e.g., from the debug spot-check).
3. Verify the right sidebar displays the backlinks with their context snippets, and the link text itself is visually distinct.
4. Click a backlink; verify it opens that note in the editor.
5. In another note, add a `[[link]]` to the currently open note.
6. Verify the backlinks panel updates immediately upon saving/debounced-save, without a manual refresh.
