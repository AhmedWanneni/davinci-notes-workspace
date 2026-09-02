# Plugin Permissions

Phase 5 enforces the capability tokens declared in `manifest.json` at the
plugin API facade boundary. A missing token rejects the call with an error;
the manifest permission list is copied when the plugin is loaded, so changing
the manifest object during a session cannot escalate the plugin.

| API operation | Required permission |
|---|---|
| `vault.read`, `vault.list` | `vault:read` |
| `vault.write`, `vault.delete` | `vault:write` |
| `commands.register` | `commands` |
| `settings.addTab`, all Workspace methods | `ui:view` |
| Editor reads and `onContentChange` | `editor:read` |
| Editor writes and selection changes | `editor:write` |

`loadData()` and `saveData()` remain plugin-owned persistence and do not
require a capability. The vault-root correctness boundary is independent of
permissions and remains enforced for every vault call.

The desktop Settings plugin list displays requested permissions before the
enable toggle is used. Tauri has no per-plugin capability mapping: ADR-0131
states that Tauri capabilities bind to Webview Windows, so this phase uses the
application-layer facades. Raw Tauri IPC shielding remains a separate host
hardening concern.
