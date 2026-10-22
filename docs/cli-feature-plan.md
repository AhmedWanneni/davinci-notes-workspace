# DaVinci Notes CLI / TUI ("dn") — Phased Feature Plan

A fast, terminal companion to the DaVinci Notes desktop app for the same local Markdown vault.

---

## Architecture Principles & Standing Constraints

1. **Explicit Performance Budgets**:
   - Quick capture (`dn "thought"` or `echo "idea" | dn`): cold-start to file written and process exit **< 15 ms**. Must not initialize a TUI, touch SQLite, or scan the vault.
   - TUI first frame: **< 50 ms** on a vault of 10,000 notes. Directories are loaded lazily upon expansion.
   - Built-in editor: Rope buffer data structure (`ropey`), zero UI latency on large notes (> 5,000 lines).
   - Single release static binary with minimal dependencies.
2. **Zero SQLite in v1**:
   - `vault-index.db` is strictly owned by the desktop app with `withDbLock`. The CLI writes plain `.md` files; the desktop's native filesystem watcher (`VaultWatcher`) handles all indexing. The CLI must not open or lock `vault-index.db`.
3. **Crash-Safe Atomic File Operations**:
   - All writes write to a hidden `.dn-tmp-<pid>-<nanos>.tmp` file in the destination folder, call `fsync`, and atomically rename to the target path. Orphan temp files are deleted by drop guards on termination or error.
4. **Desktop App Compatibility**:
   - Note format strictly aligns with ADR-0180 (`Quick Notes/Quick note YYYY-MM-DD HH-mm-ss.md`), ADR-0060 (no synthetic `# Heading` prepended to prevent rename loops), and ADR-0181 (recent vaults discovery from `davinci-recent-vaults.json`).

---

## Phase Breakdown

### Phase 1: Walking Skeleton & Quick Capture (CURRENT)
- **Scope**:
  - Standalone Rust crate at `apps/cli` producing binary `dn`.
  - 5-tier vault discovery precedence (`--vault`, `DN_VAULT`, cwd traversal, CLI config, desktop `davinci-recent-vaults.json`).
  - Positional argument capture (`dn "text"` / `dn multi word idea`) and stdin stream piping (`echo "idea" | dn`).
  - Target options: default standalone note in `Quick Notes/`, `--daily` / `-d` append, and `--note` / `-n` custom note.
  - Collision-safe identical-second naming (`... HH-mm-ss 1.md`).
  - Atomic write engine (`fsync` + rename + cleanup drop guard).
  - Verification suite & hyperfine benchmark (< 15 ms).
- **Assumptions**: Standard OS filesystem access; desktop config directory is readable if desktop app is installed.
- **Risks**: Slow argument parsing if heavy CLI frameworks are pulled in. Mitigated by using minimal `clap` configuration.
- **Single Session**: Yes.

### Phase 2: Read-Only TUI File Tree
- **Scope**:
  - Terminal initialization with `ratatui` + `crossterm` with mouse tracking enabled.
  - Safe terminal cleanup guard restoring raw mode, alternate screen, and mouse capture on normal exit, signal, or panic.
  - Dired/Obsidian-style hierarchical tree view with lazy directory expansion (read only upon user expand).
  - Keyboard navigation (arrows, `hjkl`, `Enter`, `Tab`, `Space`, `q`) and mouse click expand/select.
  - Real-time search-as-you-type fuzzy filter bar.
  - Side-by-side read-only note preview pane.
- **Assumptions**: Terminal supports ANSI escape codes and alternate screen.
- **Risks**: Recursive directory traversal freezing UI on huge vaults. Mitigated by strictly lazy directory loading.
- **Perf Budget**: First frame < 50 ms on 10,000-note vault.
- **Single Session**: Yes.

### Phase 3: External Editor Mode ($EDITOR)
- **Scope**:
  - Launching user's `$EDITOR` (vim, neovim, helix, emacs, nano, code).
  - Clean TUI suspension: leave alternate screen, disable mouse capture, restore cooked terminal mode.
  - Subprocess execution and wait for `$EDITOR` exit.
  - Restoration of TUI state upon editor exit without losing cursor position or expanded tree state.
  - External modification & conflict detection: checks file `mtime` and content hash before and after `$EDITOR` run.
  - In-TUI note lifecycle operations: `n` for new note, `r` for rename, `d` for delete to `.trash/`, `m` for move folder.
- **Assumptions**: User has `$EDITOR` or `$VISUAL` configured, with fallback to `nano` or `vi`.
- **Risks**: Terminal state corruption if editor crashes. Mitigated by unconditional TUI resume guard.
- **Single Session**: Yes (contains conflict detection and process suspension logic).

### Phase 4: Built-in "Normal" Modeless Editor
- **Scope**:
  - Modeless, nano/micro-style editor for users who prefer not to use modal editors like Vim.
  - Rope data structure (`ropey`) backing the text buffer for $O(\log N)$ edits and zero line-count limits.
  - Standard keybindings: Arrow navigation, Home/End, Backspace, Delete, Enter, Tab.
  - Common shortcuts: Ctrl+S save, Ctrl+Q quit, Ctrl+Z undo, Ctrl+Y redo, Ctrl+C/X/V clipboard integration.
  - Mouse click-to-place cursor and scroll wheel support.
  - Conflict-guarded save: detects if file was modified externally (by desktop app or sync) while editing in TUI.
- **Assumptions**: Standard terminal key events delivery.
- **Risks**: Clipboard integration across headless SSH vs native terminal. Mitigated by optional clipboard provider fallback.
- **Perf Budget**: Keypress to render latency < 2 ms.
- **Single Session**: Yes (contains buffer modification and save-conflict guard).

### Phase 5: Fast In-Memory Content Search (`dn find`) & Watcher
- **Scope**:
  - CLI subcommand `dn find <query>` and in-TUI search overlay (`/`).
  - Fast multi-threaded grep search across vault Markdown files without touching SQLite.
  - Case-insensitive, regex, and exact-term search with highlighted matches and line numbers.
  - File watcher integration (`notify` crate) in the running TUI: refreshes tree and preview when external files change.
- **Assumptions**: Vault files are UTF-8 Markdown.
- **Risks**: Excessive file descriptor usage by watcher on deeply nested vaults. Mitigated by non-recursive root watcher or bounded watch depth.
- **Perf Budget**: Query response < 100 ms on 10,000 notes.
- **Single Session**: Yes.

### Phase 6: Packaging, Shell Completions & Documentation
- **Scope**:
  - `cargo install` metadata, crates.io publishing prep, and standalone release binary builds.
  - Shell completion scripts for Zsh, Bash, and Fish generated via `clap_complete`.
  - Manpage generation (`dn.1`).
  - Comprehensive documentation in `README.md` and user guide.
- **Assumptions**: Standard Rust toolchain.
- **Single Session**: Yes.
