# ADR-0180: Quick Capture Note Creation and Destination Options

## Status

Accepted (supersedes capture destination and single-file append aspect of ADR-0172 and Phase 4)

## Context

In Phase 4 and Phase 4b (ADR-0172), Quick Capture appended all captured thoughts to a single hardcoded target file (`temporary/Inbox.md`) using an ISO timestamp bullet (`- [YYYY-MM-DD HH:mm:ss] text`).

As note capture patterns evolved, appending every capture to a single growing file had several drawbacks:
1. Thoughts across different domains (e.g. project ideas, meeting memos, quick bookmarks) became interleaved in one file requiring manual triage.
2. Users had no option to name a quick note or route it into an existing project folder from the capture popover.
3. The popover positioning experienced coordinate space offsets on multi-monitor Retina displays due to builder logical pixel interpretation, and did not re-anchor upon global shortcut or menu bar invocation.

## Decision

1. **Default Capture Behavior (Standalone Note Creation)**:
   - When Name and Folder are both omitted, Quick Capture creates a NEW standalone note in `Quick Notes/` at the vault root (created automatically on first use).
   - Filename follows local date/time: `Quick note YYYY-MM-DD HH-mm-ss.md` without colons, ensuring compatibility across macOS, Windows, Linux, and cloud sync services.
   - Identical-second captures are disambiguated with a numeric suffix (`Quick note YYYY-MM-DD HH-mm-ss 1.md`, etc.), guaranteeing atomic `create_new` creation without silent truncation or overwrite.
   - The user's typed thought is written directly as note body with a trailing newline; no synthetic `# Heading` is inserted, preventing rename synchronization loops with ADR-0060.

2. **Optional Destination Fields**:
   - Secondary `Name` and `Folder` fields are provided in the capture window, reachable via keyboard traversal (Tab from textarea) without stealing initial focus.
   - Name only: saves in `Quick Notes/<Name>.md`.
   - Folder only: saves in `<Folder>/Quick note YYYY-MM-DD HH-mm-ss.md`.
   - Both: saves in `<Folder>/<Name>.md`.
   - `.md` extension is normalized and never duplicated.
   - Destinations are stateless across opens (not remembered) to preserve fast default capture without accidental misfiling.

3. **Collision & Pure-Append Behavior**:
   - If the user explicitly specifies a note name that already exists on disk, the write falls back to a PURE APPEND using the established `- [YYYY-MM-DD HH:mm:ss] text` format and line-break serialization rules.
   - Pure appends seamlessly merge into the active editor via the Phase 4a save guard (ADR-0170) without cursor displacement or conflict dialogs.

4. **Strict Rust Path Safety**:
   - The capture window never passes raw filesystem paths to native commands.
   - Filename validation rejects path separators (`/`, `\`), `..`, leading dots, control characters, null bytes, trailing spaces/dots, reserved characters (`: * ? " < > |`), Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`), and names exceeding 128 characters, with Unicode NFC normalization.
   - Folder validation enforces canonical confinement inside the vault root, rejects `..`, absolute paths, hidden/system directories (`.git`, `.trash`), and symlinks that escape the vault. Parent directories are created only for the default `Quick Notes` folder, never for custom paths.
   - Read-only lazy folder picker command (`list_vault_folders_for_capture`) enumerates existing folders on first focus, capped at 500 folders, with zero startup overhead.

5. **Exact Anchored Positioning & Fallback Chain**:
   - All placement calculations are performed in physical pixels using `calculate_popover_position`.
   - Window size is queried from the real OS window geometry at placement time and recomputed on every show event.
   - If the popover grows or expands, `reclamp_capture_popover` re-clamps it within the monitor work area.
   - Non-click launches (global shortcut, tray menu item) resolve tray position via a 3-step fallback chain: native tray icon bounds (`tray.rect()`), last known click rect, and defined top-right monitor default.

6. **Zero SQLite Writes**:
   - The capture window and capture write commands never access or lock SQLite `vault-index.db`. All indexing is deferred to the main window's filesystem watcher (`VaultWatcher`).

## Consequences

- Quick notes are neatly organized as individual timestamped files in `Quick Notes/`.
- Popover launches directly beneath the clicked tray icon on both standard and Retina displays.
- Power users can route notes to specific folders or append to existing notes with keyboard shortcuts.
- No SQLite lock contention or capability leaks.
