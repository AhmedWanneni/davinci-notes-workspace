# ADR 0181: App-Level Recent-Vaults Registry, Auto-Open Launch Behavior, and Safe Vault-Switch Lifecycle

## Status
Accepted

## Context
In DaVinci Notes, vaults could previously only be loaded via manual folder pickers or explicit development fixture buttons. Users had to select their vault on every launch. Furthermore, switching between multiple vaults lacked an integrated switcher UI in the file explorer sidebar, and lacked a formal teardown/initialization lifecycle guaranteeing clean resource cleanup (file watchers, SQLite connection pool, and in-memory caches).

Obsidian's expected user experience provides:
1. Automatic auto-opening of the most recently accessed vault on app launch without showing a picker screen (falling back to the picker only when no valid previous vaults exist).
2. A dedicated bottom-of-sidebar vault switcher bar featuring the current vault name with an up/down chevron (`CaretUpDown`), alongside Help (`?`) and Settings (gear) action buttons.
3. A recent vaults menu displaying the list of previous vaults (with an active checkmark, disabled/remove action for missing folders, and "Open folder as vault…" / "Create new vault…" options).
4. Safe, serialized teardown and mounting when switching vaults to prevent resource leaks (orphaned watchers, dangling SQLite connections, or cross-vault state leakage).

### Persistence Boundary Decision: App-Level JSON vs SQLite
The recent-vaults registry (`{ path, name, lastOpenedAt }`) is strictly app-level state that must be readable *before* any vault folder or `vault-index.db` is opened. Storing it inside a vault's own `vault-index.db` would create a circular dependency. Storing it in an app-level SQLite database would introduce additional startup connection latency and native migration overhead for a simple list capped at 20 items.

Therefore, the registry is stored as an app-level JSON file in the operating system's application config directory:
`$APP_CONFIG_DIR/davinci-recent-vaults.json` (e.g., `~/Library/Application Support/com.davinci.notes/davinci-recent-vaults.json` on macOS).

## Decision

### 1. Registry Architecture & Auto-Open Launch Sequence
- **Rust Backend (`recent_vaults.rs`)**:
  - Maintains a thread-safe list of known vaults capped at 20 entries, sorted by `lastOpenedAt` descending.
  - Paths are deduplicated by canonical system path.
  - On query (`get_recent_vaults`), each path's filesystem existence is checked synchronously, returning `{ path, name, lastOpenedAt, exists }`.
  - Commands exported: `get_recent_vaults`, `record_recent_vault`, `remove_recent_vault`, `check_vault_exists`, and `stop_vault_watcher`.
- **Launch Fallback**:
  - `getAutoOpenVault()` iterates through recent vaults in recency order until finding one where `exists: true`.
  - If a valid vault is found, `useVaultSession` automatically mounts it directly on app startup.
  - If all recent entries are missing or unreadable, the application falls back safely to the welcome / vault picker screen. Missing entries are not silently deleted; they are displayed in the switcher as disabled with an explicit "Remove from list" action.
  - Fast startup: Registry read is sub-millisecond synchronous JSON I/O, avoiding any blocking of the initial webview paint.

### 2. Vault Switcher UI Component (`VaultSwitcher`)
- Placed flush at the bottom of `AppSidebar` using flexbox column layout.
- Built strictly with `@app/design-system` tokens and primitives:
  - Radix UI `DropdownMenu` and `TooltipProvider` / `Tooltip`.
  - Phosphor icons in `regular` weight (`CaretUpDown`, `Gear`, `Question`, `Check`, `FolderOpen`, `Plus`, `Trash`).
  - CUBE CSS architecture with SCSS CSS Modules, kebab-case classes, subtle top border (`--color-border-subtle`), and dark-first theme token integration.
- Left trigger: Displays up/down caret and truncated vault name.
- Right actions: Help button (stub/callback) and Settings gear (opens existing modal).
- Menu items: Checkmark for active vault, grayed out styling and delete icon for moved/missing vaults, and folder picker/new vault creation triggers. Accessible labels and keyboard navigable.

### 3. Safe Teardown and Initialization Lifecycle (`vaultSwitchOrchestrator.ts`)
Switching vaults is orchestrated as an atomic, strictly ordered 6-step lifecycle:
1. **Flush Dirty Editor**: Calls `saveAllDirty()` to persist any pending changes in the current vault.
2. **Save Vault Session**: Saves current `session.openNotes` and `session.activeNotePath` into the current vault's `settings` table via `withDbLock`.
3. **Stop File Watcher**: Invokes native `stop_vault_watcher` to prevent orphaned watchers or background watcher threads from delivering stale events.
4. **Clean SQLite Teardown**:
   - Acquires the single `withDbLock` queue to ensure all in-flight indexer queries complete.
   - Executes `PRAGMA wal_checkpoint(TRUNCATE)` to flush the WAL file back into the database file.
   - Closes the Tauri SQL connection pool cleanly.
5. **Reset In-Memory State**: Clears `diskStateTracker`, resets `openNotes`, `activeNotePath`, `notesContent`, `dirtyNotes`, `conflictNotes`, and reinitializes workspace tree/graph to empty.
6. **Mount New Vault & Restore**:
   - Invokes `open_vault` to register the new path.
   - Runs `indexVaultFull()`, loads file tree and tag index.
   - Opens the new database, queries full graph index under `withDbLock`.
   - Restores the new vault's saved session (`session.openNotes`, `session.activeNotePath`).
   - Updates the recent-vaults registry with the new vault path.

### 4. Concurrency Guard and Rollback
- Switch requests are serialized through a promise queue (`switchLock`). Rapid consecutive clicks (e.g. switching to B then C) queue sequentially and never interleave or corrupt database connections.
- If mounting the target vault fails at any step, the orchestrator catches the error, emits an error toast/log, and attempts a clean rollback to the previously active vault. If rollback also fails, it resets state to the welcome picker.

### 5. Standing SQLite Lock Discipline
- Maintains universal `withDbLock` coverage for all operations on `vault-index.db`.
- The recent-vaults registry does NOT touch `vault-index.db`.
- Draining the connection during teardown occurs entirely through the existing `withDbLock` queue before `closeVaultIndexDb()` resets `dbPromise` to `undefined`. New connections re-initialize `busy_timeout = 5000` and WAL PRAGMAs cleanly.

## Consequences
- Launching the app with an existing valid vault immediately opens the workspace, matching Obsidian's startup experience.
- Moving or renaming vaults on disk does not crash the app or show a blank window; the switcher gracefully highlights them as missing.
- Vault switching guarantees zero file watcher leaks, zero dangling SQLite connection locks, zero cross-vault in-memory leakage, and serialized concurrency safety.
