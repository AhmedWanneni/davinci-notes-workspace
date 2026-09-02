# @app/plugin-api

Single source of truth for DaVinci Notes plugin manifest specifications, types, runtime validation, and package layout standards.

---

## 1. Plugin Manifest Specification (`manifest.json`)

Every DaVinci Notes plugin package must contain a `manifest.json` file at its root.

### Required Fields
- **`id`** (`string`): Unique plugin identifier matching `^[a-zA-Z0-9_-]+$` (e.g. `"daily-planner"`).
- **`name`** (`string`): Human-readable display name shown in the UI and registry (e.g. `"Daily Planner"`).
- **`version`** (`string`): Plugin release version conforming strictly to SemVer 2.0.0 (e.g. `"1.0.0"`).
- **`minAppVersion`** (`string`): Minimum DaVinci Notes application version required to run this plugin (SemVer 2.0.0, e.g. `"0.1.0"`).
- **`description`** (`string`): Summary of what the plugin does.
- **`author`** (`string`): Name of the author or development team.
- **`main`** (`string`): Relative path to the bundled JavaScript entry file inside the plugin folder (e.g. `"main.js"`). Must not contain path-traversal sequences (`../`).

### Standard Capability Fields
- **`isDesktopOnly`** (`boolean`, optional, default: `false`):
  Reserved for plugins that explicitly depend on desktop-only native features (e.g. native window management or shell execution). Defaults to `false` because DaVinci Notes shares core architecture across desktop and mobile (ADR-0001).
- **`permissions`** (`PluginPermission[]`, optional, default: `[]`):
  Established by ADR-0131 (Capability-Scoped Permissions per Plugin). Plugins must declare all capabilities they require. At install or update time, DaVinci Notes displays a consent modal listing these permissions. If omitted, the plugin defaults to least privilege (`[]`).

  **Permission Vocabulary**:
  - `vault:read` — Read markdown notes, canvas files, and attachments within the active vault.
  - `vault:write` — Create, modify, rename, or delete notes and files inside the vault root.
  - `network` — Make outbound HTTP/HTTPS network requests (`fetch`, `WebSocket`).
  - `shell` — Open external applications or execute local binaries (high-risk, reserved).
  - `editor:read` — Read active editor text, selections, cursor positions, and syntax nodes.
  - `editor:write` — Apply transaction edits or insert text into the active editor buffer.
  - `commands` — Register custom actions in the Command Palette and map keyboard hotkeys.
  - `ui:view` — Register custom sidebar panels, status bar items, or modals.

### Additional Fields (Design Rationale)
- **`authorUrl`** (`string`, optional, format: URI): Author website or GitHub profile link for community attribution.
- **`fundingUrl`** (`string`, optional, format: URI): Donation/sponsorship link (e.g. GitHub Sponsors, BuyMeACoffee).
- **`license`** (`string`, optional): SPDX license identifier (e.g. `"MIT"`, `"Apache-2.0"`).
- **`styles`** (`string`, optional, default: `"styles.css"`): Relative path to an optional CSS stylesheet.
- **`keywords`** (`string[]`, optional): Array of category tags used by the plugin registry search.

### Strict Validation Policy
The runtime validator `validatePluginManifest` enforces **strict validation by default** (`additionalProperties: false`).
- *Rationale*: Catches author typos early during development (e.g., `permisions` instead of `permissions`, `entry` instead of `main`) and prevents silent permission/configuration drop.

---

## 2. Version-Compatibility File (`versions.json`)

To enable the plugin registry and updater to serve older compatible plugin releases to users running older DaVinci Notes versions, plugin repositories maintain a `versions.json` file.

- **Convention & Location**: Placed at the root of the plugin git repository and published alongside release assets or indexed in the registry catalog.
- **Format**: A JSON object mapping plugin release semvers to the minimum DaVinci Notes app version required.
- **Example**:
  ```json
  {
    "1.0.0": "0.1.0",
    "1.1.0": "0.1.0",
    "1.2.0": "0.2.0",
    "2.0.0": "1.0.0"
  }
  ```
- **Resolution**: Use `resolveCompatiblePluginVersion(versionsMap, currentAppVersion)` to determine the newest release compatible with the active host application.

---

## 3. On-Disk Plugin Package Layout

Installed plugins reside in a dedicated subfolder within the vault's configuration directory:

```
<vault-root>/
└── .davinci/
    └── plugins/
        └── <plugin-id>/
            ├── manifest.json   (Required: plugin metadata and permissions)
            ├── main.js         (Required: bundled JavaScript entry point)
            ├── styles.css      (Optional: component and theme styling)
            ├── assets/         (Optional: bundled icons, images, or assets)
            └── data.json       (Optional: user settings persisted by host API)
```

- **Folder Identity**: The folder name under `.davinci/plugins/` should match the manifest's `id`.
- **Self-Contained Bundle**: The plugin entry file (`main.js`) must be a self-contained bundle with all third-party dependencies bundled inline (excluding the shared `@app/plugin-api` host API).
- **Settings Isolation**: Plugins must not create arbitrary files outside their `.davinci/plugins/<plugin-id>/` directory or write directly into the vault without `vault:write` capability.

---

## 4. API Exports

```typescript
import {
  validatePluginManifest,
  checkAppCompatibility,
  validateVersionsFile,
  resolveCompatiblePluginVersion,
  PLUGIN_PERMISSIONS,
  PLUGIN_MANIFEST_JSON_SCHEMA,
} from "@app/plugin-api";
```
