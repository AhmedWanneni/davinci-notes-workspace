# ADR-0204: DaVinci Notes CLI Architecture, Vault Discovery, and Quick Capture

## Status

Accepted

## Context

Users who work primarily in terminal environments require a lightweight, instant companion to the DaVinci Notes desktop application. Core requirements include:
1. Sub-15ms quick capture from anywhere in the terminal (`dn "thought"` or piped from stdin) without launching a GUI or background daemon.
2. Direct vault interoperability with the desktop app without file corruption, partial writes, or sync conflicts.
3. Vault discovery without requiring explicit vault paths for every invocation.

Three critical architectural constraints must be respected:
- **SQLite Concurrency & Lock Discipline (ADR-0168)**: The desktop app maintains a dedicated in-memory queue (`withDbLock`) governing all access to `vault-index.db`. Concurrent, multi-process access from an external CLI binary directly to SQLite would risk database lock contention (`SQLITE_BUSY`) or uncoordinated transactions.
- **Performance Budget (PERFORMANCE.md)**: Cold-start execution time must be strictly under 15 ms.
- **Monorepo Boundaries**: The CLI must not bloat its binary size or compile times by pulling in Tauri or Webview crates.

## Decision

1. **Independent Rust Binary in `apps/cli`**:
   The CLI is implemented as an independent Cargo crate located at `apps/cli`, producing a static binary named `dn`. It does not link `src-tauri` or Tauri plugins.

2. **Zero SQLite Access in v1**:
   The CLI operates strictly as a filesystem client. It creates and appends plain Markdown files directly in the vault directory. It does not open, read, or write `vault-index.db`. All note indexing, link extraction, and search updates are deferred to the desktop app's native file watcher (`VaultWatcher`), which already reliably detects external filesystem changes.

3. **5-Tier Vault Discovery Precedence**:
   When `dn` executes from any working directory, the vault root is resolved in order:
   - `--vault <path>` explicit command-line flag.
   - `DN_VAULT` or `DAVINCI_VAULT` environment variable.
   - Current working directory upwards traversal: walks up looking for markers (`.obsidian`, `vault-index.db`, `.davinci`).
   - CLI configuration file (`~/.config/davinci/config.toml`).
   - Desktop app recent vaults registry: parses `davinci-recent-vaults.json` from the platform's standard config directory (`~/Library/Application Support/com.davinci.notes/` on macOS, `~/.config/com.davinci.notes/` on Linux, `%APPDATA%\com.davinci.notes\` on Windows) and selects the first valid directory.

4. **Crash-Safe Atomic File Writes**:
   All new notes and appends are written to a temporary hidden file in the destination folder (`.dn-tmp-<pid>-<nanos>.tmp`), flushed with `fsync` (`sync_all()`), and atomically moved to the destination path using `std::fs::rename`. A custom `Drop` guard guarantees unlinking of orphan temp files on abnormal termination.

5. **Format & Naming Compatibility (ADR-0180 / ADR-0060)**:
   - Default capture creates `<vault>/Quick Notes/Quick note YYYY-MM-DD HH-mm-ss.md`.
   - Identical-second collisions are disambiguated with numeric suffixes (`... HH-mm-ss 1.md`).
   - No synthetic `# Heading` is inserted into standalone quick notes, preventing rename loops with ADR-0060.
   - Daily note appends (`--daily` / `-d`) append `- [YYYY-MM-DD HH:mm:ss] text` to `<vault>/YYYY-MM-DD.md`.

## Consequences

- Quick capture runs in ~3–5 ms cold start, well within the 15 ms budget.
- Zero SQLite lock contention with running desktop instances.
- Syncthing, Google Drive sync, and the desktop watcher never observe partial or corrupted files.
- Notes captured in the terminal immediately appear in the desktop app UI and search indices.
