# ADR-0198: Syncthing Local REST API Integration, Automatic Config Discovery, and Credential Security

## Status

Accepted (supersedes the zero-daemon IPC clause of [ADR-0123](0123-syncthing-folder-sync-mode-and-watcher-burst-robustness.md))

## Context

[ADR-0116](0116-sync-via-drive-syncthing-no-owned-backend.md) and [ADR-0123](0123-syncthing-folder-sync-mode-and-watcher-burst-robustness.md) established the "bring your own tool" folder sync model, where DaVinci Notes reacted to external filesystem changes via its debounced file watcher and surfaced Syncthing conflict files (`.sync-conflict-*`) with zero daemon IPC.

While this zero-daemon approach required no network or process code, users desiring a cohesive sync experience lacked in-app status indicators (sync progress, device pairing, connection health, and QR code pairing). To support these features without compromising the app's lightweight, local-first architecture, we evaluated how the app should interact with the local Syncthing daemon.

Key considerations:
1. **Binary Size vs. Sidecar**: Syncthing's compiled Go binary is 26–28 MB uncompressed. Bundling sidecars across macOS (universal/arm64/x64), Windows, and Linux would inflate the app bundle by >300%, violating `PERFORMANCE.md`.
2. **Credential Security**: The Syncthing API key provides administrative access to the daemon. It must never reach the webview, logs, error messages, or git.
3. **Network Boundary**: Syncthing must be contacted strictly on local loopback (`127.0.0.1` / `localhost`). External hosts or network redirects must be forbidden.
4. **Dependency Minimization**: Avoid adding JS QR libraries or heavy network crates if existing native primitives or Syncthing's built-in endpoints can serve the need.

## Decision

### 1. Detection over Bundling (No Sidecar)
Do not bundle Syncthing as an application sidecar. DaVinci Notes detects an existing, user-installed Syncthing process running locally. This incurs **0 KB binary bloat** and avoids background memory/CPU drain when sync is inactive.

### 2. Automatic Config Discovery with OS Keychain Fallback
Native Rust automatically inspects standard platform configuration paths to discover the GUI port and API key:
- **macOS**: `~/Library/Application Support/Syncthing/config.xml`
- **Linux**: `$XDG_CONFIG_HOME/syncthing/config.xml` (fallback `~/.config/syncthing/config.xml`)
- **Windows**: `%LOCALAPPDATA%\Syncthing\config.xml` (fallback `%APPDATA%\Syncthing\config.xml`)

Native Rust parses `<gui><address>` and `<gui><apikey>` from `<configuration>`:
- If discovered, the port and key are held in native memory only for the active session.
- If running in a non-standard location (e.g. Docker, custom flag), the user may input their port and API key manually in the settings UI.
- Manually entered keys are saved directly into the OS Keychain via native `keyring` (`com.davinci.notes.syncthing`), identical to the `ai_auth` and `git_auth` patterns.

### 3. Strict Security Invariants
- **Zero Frontend Secret Exposure**: The API key is strictly maintained in native Rust. It is never returned in Tauri command responses, IPC payloads, error strings, or logs.
- **Strict Loopback Confinement**: Native Rust validates that the target URL resolves exclusively to `127.0.0.1` or `localhost`. Requests to external IPs, domains, or non-loopback addresses are rejected immediately before dispatch.
- **Caller Authorization**: Native commands enforce `command_auth::reject_plugin_runner` to guarantee that untrusted plugin webviews cannot access Syncthing commands.

### 4. Native QR Code Proxying (0 KB JS Bundle Impact)
Instead of importing a JS QR library (which adds ~30–60 KB to the webview bundle), native Rust proxies Syncthing's built-in `GET /qr/?text=<DEVICE_ID>` endpoint, returning a base64-encoded PNG data URL (`data:image/png;base64,...`) directly to the UI.

### 5. Verified REST Endpoints
The native Syncthing bridge interacts with the following verified Syncthing REST endpoints:
- **My Device ID**: `GET /rest/system/status` -> field `myID`
- **QR Code**: `GET /qr/?text={id}` -> `image/png`
- **Add Device**: `POST /rest/config/devices` with device JSON payload
- **Pending Devices**: `GET /rest/cluster/pending/devices`
- **Pending Folders**: `GET /rest/cluster/pending/folders`
- **Add / Share Folder**: `POST /rest/config/folders` / `PUT /rest/config/folders/{id}`
- **Folder Status**: `GET /rest/db/status?folder={id}` (`state`, `needBytes`, `inSyncBytes`)
- **Connections**: `GET /rest/system/connections` (`connections`, `total`)

### 6. No Continuous Polling
Per `PERFORMANCE.md` Rule 9, the app will never execute continuous interval polling against the Syncthing REST API. Status is queried strictly on-demand (when entering the Sync Settings tab or clicking "Refresh").

## Consequences

- Formally supersedes the zero-daemon IPC clause of [ADR-0123](0123-syncthing-folder-sync-mode-and-watcher-burst-robustness.md) while preserving its watcher burst handling and conflict resolution.
- Adds 0 KB bundle weight by avoiding both a sidecar binary (~26 MB) and a frontend QR library (~60 KB).
- Provides a frictionless 1-click connection for users with standard installations, and secure Keychain-backed fallback for custom setups.
- Enforces a hardened security posture: the Syncthing API key is never exposed to frontend code or logged.
