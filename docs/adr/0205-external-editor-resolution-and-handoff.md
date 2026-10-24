# ADR-0205: External Editor Resolution Chain, Terminal Handoff, and State Synchronization

## Status

Accepted

## Context

The DaVinci Notes CLI companion (`dn`) allows users to open and edit markdown notes either directly from the shell (`dn edit <name>`, `dn open <name>`) or interactively within the TUI file tree.

Previously:
1. Editor resolution favored Apple's system `/usr/bin/vim` over modern Neovim (`nvim`), preventing users' `~/.config/nvim/init.lua` and plugin configurations from loading.
2. Command arguments with nested quotes (e.g., `EDITOR="nvim -c 'set wrap'"`) were naively split by whitespace, corrupting flags.
3. Spawning an external editor from the TUI did not guarantee clean restoration of raw mode, alternate screen, mouse capture, or terminal resize events (`SIGWINCH`), risking UI corruption upon exit.
4. Arguments lacking an end-of-options marker (`--`) caused note filenames starting with dashes (e.g. `-draft.md`) to be misparsed by editors as command-line flags.

## Decision

1. **5-Tier Editor Resolution Precedence**:
   Editors are resolved in strict priority order:
   - Explicit CLI flag: `--editor "<command>"` (with optional `--editor-args "<args>"`)
   - CLI configuration file: `[editor] command = "..."` and `args = [...]` in `~/.config/davinci/config.toml`
   - `$VISUAL` environment variable
   - `$EDITOR` environment variable
   - Automatic fallback discovery: `nvim` -> `vim` -> `vi` (or `notepad` on Windows)

2. **Shell-Style Argument Parsing**:
   All editor command strings and arguments are parsed with a dedicated, zero-dependency POSIX quote parser (`command_parser::parse_shell_words`), correctly handling single quotes, double quotes, and escaped whitespace.

3. **Safe Subprocess Terminal Handoff**:
   Before spawning the external editor process:
   - `TerminalGuard::restore_terminal()` leaves alternate screen, disables mouse capture, reveals the cursor, and disables terminal raw mode.
   - The child process inherits `stdin`, `stdout`, and `stderr` directly from the OS, guaranteeing an authentic TTY environment and full environment inheritance (`HOME`, `XDG_CONFIG_HOME`, `TERM`, `COLORTERM`, `NVIM_APPNAME`, etc.).
   - An explicit `--` argument is placed immediately before the target note path to neutralize filenames beginning with dashes or special characters.
   - Upon process exit (normal termination, error, signal, or panic), `TerminalGuard::reenter_terminal()` re-establishes raw mode and alternate screen, and `terminal.clear()` resynchronizes terminal dimensions (incorporating any window resizing that occurred during the editor session).

4. **Targeted State Refresh & Conflict Protection**:
   - File modification is detected by comparing `mtime`, file size, and content before and after the editor session.
   - Only the edited file's preview and buffer state are reloaded in the TUI; no recursive vault re-scan is performed.
   - The CLI does not execute concurrent background file writes while the external editor is running.

5. **Dual Mode Configuration (`editor.mode`)**:
   Users can configure `editor.mode = "external"` (defaulting Enter/clicks to native editor handoff) or `editor.mode = "builtin"` (focusing the in-process editor pane). The `e` key in the TUI file tree always triggers external editor handoff regardless of mode.

## Consequences

- Users get 100% native Neovim and Vim behavior, including custom leader keys, plugins (LazyVim, Treesitter, LSP), and keymaps.
- Quick capture (`dn "thought"`) is completely decoupled from editor resolution, consistently executing in ~5–9 ms.
- Zero SQLite connections or locks are acquired (`vault-index.db` is never opened).
