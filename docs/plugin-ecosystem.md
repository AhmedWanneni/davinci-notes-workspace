# Plugin Ecosystem — Implementation Status

> Written from a code audit run against the actual checkout, not from the
> original design intent. Where this contradicts ADR-0131 or
> `PERFORMANCE.md`, that's called out explicitly as a gap, not silently
> reconciled. Treat this file as the source of truth for "what's actually
> there" until the gaps below are closed.

## Architecture

- Split into two packages: `packages/plugin-api` (public surface, types,
  manifest validation) and `packages/plugin-runtime` (loading, lifecycle,
  execution).
- Desktop integration lives in `apps/desktop/src/vault/desktopPluginAdapter.ts`
  and `apps/desktop/src/state/usePluginStore.ts`.
- `.eslintrc.js` boundary rules restrict `plugin-runtime` imports to
  core/API/runtime, but explicitly **permit** apps to import both
  `plugin-api` and `plugin-runtime` directly (not the stricter
  "apps never touch plugin internals" isolation implied by the original
  intent).

## Discovery & loading

- `PluginLifecycleManager.initialize()` → `discoverPlugins()`
  (`packages/plugin-runtime/PluginLifecycleManager.ts:50`,
  `discoverPlugins.ts:17`).
- Desktop scans `<vault>/.davinci/plugins` via `desktopPluginAdapter.ts:37`.
- Triggered automatically on every `vaultPath` change (`App.tsx:308` →
  `usePluginStore.ts:30`), even when the plugins directory is empty.

## ⚠️ Lazy-loading — NOT implemented (contradicts standing performance principle)

- `usePluginStore.ts` statically imports `PluginLifecycleManager` from
  `@app/plugin-runtime` (line 2); `App.tsx` statically imports that store
  (line 20).
- Measured: production entry bundle is 399,621 bytes raw / 125,808 bytes
  gzip and contains plugin-runtime code (`PluginLifecycleManager`,
  `DavinciPlugin`, `enabledPlugins`, etc.).
- **Every user pays this cost even with zero plugins installed.** This
  directly contradicts the "lazy-load every optional feature" principle
  in `overview.md` / `PERFORMANCE.md`.

## ⚠️ Sandboxing & security — does not match the intended model

- Plugin code executes via `new Function("module", "exports",
  "DavinciPlugin", code)` in `evaluatePluginModule.ts:20`. There is no
  Worker, iframe, SES realm, or any other isolate — plugin code runs with
  full access to the same JS context as the host app.
- Permission enforcement is partial:
  - Vault-path traversal **is** enforced (`assertVaultPath`,
    `pluginSurface.ts:22`) — a plugin cannot read/write outside the vault
    through the sanctioned API.
  - `network` and `shell` exist only as manifest schema strings
    (`manifestTypes.ts:5`). There is no `context.net` / `context.shell`,
    and neither permission is enforced anywhere in the runtime.
- **Adversarial test (actually run):** a plugin declaring only
  `vault:read` successfully executed arbitrary code
  (`Function("return 6 * 7")()`) and made an unrestricted `fetch()` call,
  despite declaring no network permission. Its attempt to read
  `../../outside.md` was correctly rejected.
- **No IPC shielding.** The main webview carries `fs:default`,
  `sql:default`, `sql:allow-execute` capabilities, plus Rust commands for
  OAuth/keychain and AI-key operations (`lib.rs:32`). No code removes or
  freezes `window.__TAURI_INTERNALS__` before plugin execution. This was
  not directly exploited in testing (the test ran in Vitest's Node env,
  where `__TAURI_INTERNALS__` doesn't exist), but nothing in the native
  desktop build prevents a plugin from calling `invoke()` on those
  privileged commands.
- The **host-side** vault path boundary (Rust `resolve_in_vault`,
  `fs.rs:36`) is solid and independent of plugin permission enforcement —
  `write_note`/`delete_note` can't escape the vault regardless. That's a
  real boundary, just not a plugin-specific one.

## API surface

Centralized in `@app/plugin-api`:
- `DavinciPlugin`, lifecycle hooks (`onload`/`onunload`), `loadData`/
  `saveData` — `DavinciPlugin.ts:89`
- Vault read/write/list/delete, commands, declarative settings —
  `pluginSurfaceTypes.ts:3`
- Workspace views, editor content/selection — `pluginWorkspaceTypes.ts:6`
- Manifest validation/exports — `index.ts:1`

## Versioning

- Only host-version compatibility exists: `minAppVersion` + SemVer
  comparison (`checkAppCompatibility.ts:20`) plus a registry
  `versions.json` (`versionsFile.ts:68`).
- No plugin-API version field, no compatibility range, no deprecation
  layer.
- **Gap:** discovery does not call `checkAppCompatibility` — an
  incompatible plugin can still be discovered and enabled.
- `manifest.styles` and `isDesktopOnly` are validated as manifest fields
  but have no runtime effect anywhere in the loader.

## Data / vault safety

- A plugin with `vault:write` can write/delete vault files through the
  sanctioned API, which delegates to raw `writeNote`/`deleteNote`
  (`desktopPluginAdapter.ts:20`).
- These writes **bypass the app's canonical note CRUD/state-update
  path** — index reconciliation happens via the file watcher instead.
  Works, but is a separate path from the rest of the app's writes.
- SQLite write queue (`withDbLock`, `sqliteIndex.ts:13`) is correctly
  used for plugin enabled-state storage. There's no direct SQLite API
  exposed to `DavinciPlugin` — but because the whole window has SQL
  capability, a plugin could in principle bypass `withDbLock` via raw
  Tauri SQL invocation, since there's no per-plugin SQLite boundary.

## UI integration & failure handling

- Commands register via `PluginCommandRegistry` into the command palette
  (`pluginSurface.ts:61`, `CommandPalette.tsx:109`).
- Views mount through `PluginWorkspaceHost` into a real DOM container
  (`pluginWorkspace.ts:60`, `PluginViewLeaf.tsx:12`).
- Settings tabs are declarative, but `PluginSettingsList.tsx:99` only
  renders each field's **label** — no input controls, no persistence.
- Load/`onload` failures are caught and mark the plugin errored without
  stopping other plugins from loading (`PluginLifecycleManager.ts:125`);
  `onunload` errors are logged and ignored (line 187).
- **Gap:** command callbacks (`CommandPalette.tsx:154`) and view
  rendering (`pluginWorkspace.ts:68`) run with no try/catch and no error
  boundary — an uncaught throw there isn't isolated by the lifecycle
  manager.

## Current real-world state

- No plugin is installed in the current checkout (`.davinci/plugins` not
  present); the local registry (`registry/plugins.json`) is empty.
- `templates/davinci-plugin-starter` is a real, buildable example (writes
  then reads a markdown file) — its build/package script runs and
  produces `dist/main.js`, `dist/manifest.json`, `dist/versions.json`.
- Not yet published, registered, or run end-to-end as an installed
  plugin.
- Unit tests pass: `@app/plugin-runtime` 11/11, `@app/plugin-api` 20/20.

## Recommended next step

This is a security-boundary gap (sandboxing, IPC exposure), which your
own workflow rules already flag as a category that must stay in one
session rather than being split across planning/execution models. Before
building more plugin features or publishing the registry publicly:

1. Decide and document the actual sandbox model (Worker isolation? SES
   realm? capability-gated `context.net`/`context.shell` with real
   enforcement?) as a new ADR — don't edit ADR-0131, supersede it once
   the model is settled.
2. Close the lazy-load gap (dynamic `import()` for `plugin-runtime`,
   gated behind "plugins directory is non-empty" or a settings toggle).
3. Fix the two uncaught-throw paths (command callbacks, view rendering).
4. Only after 1–3: consider the registry/publishing story, since that's
   what turns "a plugin could do this" into "an untrusted third-party
   plugin will do this."