# DaVinci Notes Plugin Package Specification

This specification defines the on-disk format, manifest schema, capability vocabulary, and version compatibility mechanism for DaVinci Notes plugins.

---

## 1. On-Disk Layout

All user-installed plugins are stored in the active vault's hidden configuration directory under `.davinci/plugins/`:

```
<vault-root>/
└── .davinci/
    └── plugins/
        └── <plugin-id>/
            ├── manifest.json   # Required: metadata, capabilities, entry point
            ├── main.js         # Required: self-contained JS bundle (or path defined in "main")
            ├── styles.css      # Optional: custom CSS styles
            ├── assets/         # Optional: static icons, images, or fixtures
            └── data.json       # Generated: serialized plugin settings persisted by host API
```

### Constraints:
1. **Directory Naming**: The plugin directory name must match the `id` declared in `manifest.json`.
2. **Path Confinement**: The entry file (`main`) and stylesheet (`styles`) must resolve to relative paths inside `.davinci/plugins/<plugin-id>/`. Path traversal attempts (e.g. `../`) are rejected during validation.
3. **No External Dependencies at Runtime**: Third-party dependencies must be bundled into `main.js` at build time. The host environment supplies the `@app/plugin-api` runtime.

---

## 2. Manifest Schema (`manifest.json`)

The manifest defines the identity, entry point, compatibility requirements, and requested permissions for the plugin.

### Required Properties:
- `id` (`string`): Unique plugin identifier (`^[a-zA-Z0-9_-]+$`).
- `name` (`string`): Human-readable name.
- `version` (`string`): Plugin version adhering strictly to SemVer 2.0.0.
- `minAppVersion` (`string`): Minimum required DaVinci Notes version (SemVer 2.0.0).
- `description` (`string`): Concise summary of the plugin.
- `author` (`string`): Name of the author or organization.
- `main` (`string`): Relative path to entry JavaScript bundle within the package (e.g. `"main.js"`).

### Reserved Capability & Compatibility Properties:
- `isDesktopOnly` (`boolean`, default `false`): Flags whether the plugin relies on desktop-only native features.
- `permissions` (`string[]`, default `[]`): Array of capability tokens approved by the user at install time (ADR-0131).

### Permission Vocabulary:
| Permission | Description |
|---|---|
| `vault:read` | Read notes, canvas files, and attachments within the vault root. |
| `vault:write` | Create, modify, rename, or delete files inside the vault root. |
| `network` | Make outbound HTTP/HTTPS network requests. |
| `shell` | Open external applications or run binaries (high risk). |
| `editor:read` | Read active editor contents, selections, and cursor positions. |
| `editor:write` | Modify active editor document or insert text. |
| `commands` | Register commands in the Command Palette and map hotkeys. |
| `ui:view` | Register custom sidebar tabs, status bar chips, or modals. |

### Additional Optional Properties:
- `authorUrl` (`string`, URI): Author website or GitHub profile.
- `fundingUrl` (`string`, URI): Link to donation/sponsor platform.
- `license` (`string`): SPDX license identifier (e.g. `"MIT"`).
- `styles` (`string`): Custom stylesheet path (defaults to `"styles.css"`).
- `keywords` (`string[]`): Search and discovery tags for the registry.

---

## 3. Version Compatibility (`versions.json`)

Plugin repositories provide a `versions.json` file at repository root to map plugin versions to the minimum app version required.

```json
{
  "1.0.0": "0.1.0",
  "1.1.0": "0.1.0",
  "1.2.0": "0.2.0",
  "2.0.0": "1.0.0"
}
```

Tooling and the plugin registry client query this file to resolve the latest compatible release for a user's current DaVinci Notes installation.
