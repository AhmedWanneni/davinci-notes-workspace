# ADR 0250: Interactive Bash TUI Application & Release Manager

## Context
Developers and release managers frequently interact with multiple CLI commands across the repository: starting development servers (Tauri, Vite, Astro), building frontend bundles, executing local native builds (DMG/App), triggering multi-platform GitHub CI builds, retrieving direct installer download links across OS targets (macOS Apple Silicon/Intel, Windows x64, Linux AppImage/deb), and running preflight quality gates.

Manually looking up GitHub release asset URL formats, checking workflow run IDs, and switching between terminal commands introduces cognitive friction and opportunities for human error.

## Decision
Implement a zero-dependency, modular Bash Text User Interface (TUI) in `scripts/manage.sh` (with alias `scripts/tui.sh` and npm scripts `pnpm manage` / `pnpm tui`):
1. **Zero External Dependencies**: Pure Bash + standard POSIX utilities (`curl`, `git`, `uname`) with optional enhancement when `gh` (GitHub CLI) is authenticated.
2. **Modular Architecture (< 250 lines per module)**:
   - `scripts/tui/ui.sh`: ANSI colors, box drawing, banners, open URL, clipboard integration (`pbcopy`, `xclip`, `wl-copy`, `clip.exe`).
   - `scripts/tui/status.sh`: Git branch, uncommitted count, active version, host OS/arch, Syncthing presence.
   - `scripts/tui/dev.sh`: Interactive launcher for desktop dev, web dev, and website servers.
   - `scripts/tui/build.sh`: Web asset compiler, smoke test, local DMG packaging, and artifact inspection.
   - `scripts/tui/links.sh`: Direct download links and actions for macOS (ARM/Intel DMG), Windows, Linux (AppImage/deb), and checksums.
   - `scripts/tui/ci.sh`: GitHub Actions release matrix inspection, triggers, and live watching.
   - `scripts/tui/health.sh`: Full preflight audits, manifest sync, unit tests, and bundle size checks.
3. **Non-blocking & Scriptable**: Supports direct flags (`--links`, `--build`, `--ci`, `--dev`, `--health`, `--diagnostics`) as well as interactive menu loops that gracefully handle piped inputs and non-interactive environments.

## Consequences
- Fast, friendly terminal interface to manage the full lifecycle of the app and releases.
- Instant discovery, copying, opening, and downloading of platform-specific binary installers (`.dmg`, `.exe`, `.AppImage`, `.deb`).
- Adheres to local-first and performance principles (zero heavy Node TUI libraries or runtimes required).
