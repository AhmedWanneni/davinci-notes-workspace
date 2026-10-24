# 0199. Syncthing Binary Bundling and Process Lifecycle Management

Date: 2026-10-18

## Status

Accepted

## Context

Previous sync work (ADR-0123, ADR-0198) integrated DaVinci Notes with a local Syncthing REST API, but required the user to already have an external Syncthing daemon running or launch it manually from a terminal prompt ("Not running, start it from your terminal"). This created friction for users and prevented an out-of-the-box local-first experience.

To make sync effortless while respecting our strict lightweight and local-first constraints, the desktop application needed to bundle the official Syncthing release binary and manage its complete process lifecycle directly from Rust.

## Decisions

### Decision 1: Bundled Binary vs Download-on-First-Enable
**Decision: Bundle the binary directly in the installer.**
- *Trade-offs evaluated*:
  - *Download-on-first-enable*: Yields a lighter initial installer package, but introduces network failure modes on first enable, fails in air-gapped/offline setups, requires background download progress UI, and complicates integrity recovery if CDN assets change.
  - *Installer bundling*: Increases installer DMG size by ~11.2 MB compressed (~26.5 MB uncompressed binary), but provides 100% offline out-of-the-box sync, zero network dependency, and deterministic verification pinned to official Syncthing v2.1.6 release checksums at build time.
- *Implementation*: `apps/desktop/scripts/fetchSyncthing.mjs` runs during `prepare:syncthing`, downloads the official release per target triple, verifies its SHA-256 against published checksums, places it in `src-tauri/binaries/syncthing-<target-triple>[.exe]`, and configures Tauri `externalBin`. Added MPL-2.0 notice to `LICENSES.md`.

### Decision 2: Process Spawning via Rust `std::process` vs `tauri-plugin-shell`
**Decision: Spawn and manage processes purely via Rust `std::process` and `tokio` (0 new dependencies).**
- Adding `tauri-plugin-shell` would expand the binary size, increase compilation overhead, and expose shell execution permissions to the webview IPC boundary.
- Native Rust `std::process::Command` combined with `tokio` gives complete control over pipes, asynchronous log ring buffers, exit status monitoring, and OS-specific primitives without any new crate dependencies.

### Decision 3: Process & Config Isolation
- **Custom Home Directory**: Syncthing runs with `--home=<app_data_dir>/syncthing`, completely isolated from `~/.config/syncthing` or `~/Library/Application Support/Syncthing`.
- **Dynamic Port Allocation**: Allocated via an ephemeral TCP listener on `127.0.0.1:0`. Never assumes port 8384, preventing any port clashes with personal Syncthing instances.
- **Flags & Environment**: Invoked with `--no-browser`, `--no-upgrade`, `--no-restart`, `--log-file=-`, and environment variables `STNORESTART=1`, `STNOUPGRADE=1`.
- **Zero Default Folders**: Syncthing's automatic default sync folder is stripped upon initial configuration to prevent unintended file synchronization.

### Decision 4: API Key Generation and Secrecy
- A 32-character cryptographically random alphanumeric API key is generated on first launch.
- Passed strictly via `--gui-apikey` flag to the child process.
- Persisted in the OS Keychain (`com.davinci.notes.syncthing`) with an atomic fallback file (`.api_key`, permission mode `0600` on Unix).
- The key is retained exclusively in Rust memory and never exposed to the webview, serialized IPC structs, stdout/stderr streams, or error responses.

### Decision 5: Lifecycle & Shutdown
- **Lazy Startup**: Syncthing starts only when sync is enabled; it is never launched at app boot when sync is off (satisfying the performance principle).
- **Graceful Shutdown**: Calls the `/rest/system/shutdown` REST endpoint, waits up to 2.5s for process termination, and falls back to `SIGKILL`. Hooks into app quit and window close events.
- **Orphan Recovery**: Writes PID and port to `syncthing.pid`. On launch, if a PID file is detected, it probes the port and REST API to reuse an existing responsive instance or terminate a stale zombie process.
- **Windows Safety**: Spawns with `CREATE_NO_WINDOW` and binds child processes to a Win32 Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` so child processes cannot outlive the parent.
- **Crash Loop Guard**: Restarts with backoff and halts after 3 crashes in a 60-second window, capturing the last 40 lines of stdout/stderr into a ring buffer for display in the UI.

## Consequences

- Desktop users enjoy zero-configuration sync without installing Syncthing separately.
- Existing system Syncthing instances on port 8384 continue operating completely independently without conflict.
- Installer DMG increases from ~16 MB to ~27 MB (~11.2 MB net addition).
- No new Rust crates or npm runtime packages added.
