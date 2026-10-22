# DaVinci Notes CLI / TUI (`dn`)

A fast, lightweight terminal companion to the DaVinci Notes desktop application.

---

## Features

- **Instant Quick Capture**: `dn "quick thought"` or `echo "idea" | dn` captures in **< 7 ms** cold-start directly into your vault without launching a GUI or touching SQLite.
- **Dired-Style TUI Vault Browser**: `dn` opens a dual-pane file tree and previewer with lazy directory loading (**< 1 ms** first frame on 10k notes) and mouse support.
- **Dual Editing Modes**:
  - External editor: `$VISUAL` / `$EDITOR` (vim, neovim, helix, emacs, nano) with clean TUI suspension, restoration, and external change conflict detection.
  - Built-in modeless editor: Micro/nano-style modeless editor backed by `Rope` (`ropey`) with undo, line numbers, and mouse cursor placement.
- **Content Search (`dn find <query>`)**: In-memory multi-note search returning file paths, line numbers, and text snippets without requiring SQLite index locks.
- **Vault Watcher**: Real-time filesystem awareness; external changes from the desktop app or sync services refresh the TUI tree and preview automatically.

---

## Installation

```bash
# Build & install binary locally
cargo install --path apps/cli

# Verify installation
dn --version
dn --help
```

### Shell Completions

Generate shell completions for Zsh, Bash, Fish, or PowerShell:

```bash
# Zsh
dn completions zsh > ~/.zfunc/_dn

# Bash
dn completions bash > ~/.local/share/bash-completion/completions/dn

# Fish
dn completions fish > ~/.config/fish/completions/dn.fish
```

---

## Quick Start & Usage

### 1. Quick Capture
```bash
# Capture thought into Quick Notes/Quick note YYYY-MM-DD HH-mm-ss.md
dn "Pick up groceries after work"

# Pipe content from stdin
cat log.txt | dn

# Append to today's daily note (YYYY-MM-DD.md)
dn --daily "Completed initial architecture pass"

# Append or create a specific named note
dn --note "Projects/Davinci" "Phase 6 packaging complete"
```

### 2. Vault Browser (TUI)
Run `dn` without arguments in an interactive terminal to launch the TUI:
```bash
dn
```

| Key / Action | Description |
|---|---|
| `Mouse Click` | Click note in tree to view on right; click header buttons |
| `Double Click` / `v` / `Enter` | Edit selected note in **Vim** |
| `f` / `F` | Toggle **Fullscreen** mode (expands right pane to 100% width) |
| `Esc` | Exit Fullscreen (restore split view) / Clear search / Exit |
| `j` / `Down` | Move selection down (Tree) or scroll down (Preview) |
| `k` / `Up` | Move selection up (Tree) or scroll up (Preview) |
| `g` / `G` | Jump to top / bottom of note preview |
| `Ctrl+D` / `Ctrl+U` | Half-page down / up in note preview |
| `h` / `Left` | Collapse folder |
| `l` / `Right` | Expand folder |
| `/` | Search-as-you-type fuzzy filter |
| `d` | Move selected file to `.trash/` |
| `Tab` | Switch focus between Tree and Preview |
| `q` | Exit TUI |
| `Mouse Scroll`| Scroll preview or tree |

### 3. Built-in Modeless Editor
When editing in the built-in editor:
- Regular typing inserts text at the cursor.
- `Ctrl+S`: Atomic save with external change conflict detection.
- `Ctrl+Q`: Exit editor.
- `Ctrl+Z`: Undo.
- Arrow keys / Mouse click: Navigate cursor.

### 4. CLI Subcommands
```bash
# Find content across vault markdown files
dn find "architecture"

# Open note with fuzzy name matching in $EDITOR
dn open "roadmap"

# Create a new note in the vault
dn new "Ideas/New Feature"

# List notes in vault or folder with sizes
dn ls
dn ls "Quick Notes"

# Print note contents to stdout
dn cat "Welcome"
```
