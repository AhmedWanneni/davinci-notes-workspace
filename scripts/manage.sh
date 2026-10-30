#!/usr/bin/env bash
# manage.sh — Interactive Terminal User Interface (TUI) for DaVinci Notes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source all modular TUI sub-controllers
source "${SCRIPT_DIR}/tui/ui.sh"
source "${SCRIPT_DIR}/tui/status.sh"
source "${SCRIPT_DIR}/tui/installer.sh"
source "${SCRIPT_DIR}/tui/gatekeeper.sh"
source "${SCRIPT_DIR}/tui/dev.sh"
source "${SCRIPT_DIR}/tui/build.sh"
source "${SCRIPT_DIR}/tui/links.sh"
source "${SCRIPT_DIR}/tui/ci.sh"
source "${SCRIPT_DIR}/tui/health.sh"
source "${SCRIPT_DIR}/tui/cloudflare.sh"

main_menu() {
  while true; do
    ui_banner
    status_render_bar "$REPO_ROOT"

    ui_section "Main Control Dashboard" "⚡"
    ui_menu_item "1" "🚀" "Run App / Dev Mode" "Tauri desktop, Vite web, or Astro site"
    ui_menu_item "2" "🔨" "Build Applications" "Build local Mac DMG/App, Windows EXE, Linux AppImage"
    ui_menu_item "3" "📦" "Installers & Launch" "One-click install/mount DMG, run App, or reveal"
    ui_menu_item "4" "🔗" "Release Download Links" "Get Mac, Windows, Linux links, copy to clipboard"
    ui_menu_item "5" "☁️ " "GitHub CI & Matrix" "Trigger workflows, check runs, live watcher"
    ui_menu_item "6" "🔍" "Health & Quality Gates" "Preflight checks, version sync, tests, bundle size"
    ui_menu_item "7" "⚙️ " "System Diagnostics" "Audit Node, pnpm, Cargo, Syncthing binaries"
    ui_menu_item "8" "☁️ " "Deploy to Cloudflare" "Cloudflare Pages CLI deploy & GitHub Connect"
    ui_menu_item "f" "🛡️ " "Fix 'App is Damaged'" "Remove Gatekeeper quarantine & ad-hoc sign Sophia.app"
    ui_menu_item "0" "🚪" "Exit Control Center" "(or press 'q')"
    ui_section_end
    printf "  ${C_CYAN}${C_BOLD}Select an option [0-8, f]:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1) dev_menu "$REPO_ROOT" ;;
      2) build_menu "$REPO_ROOT" ;;
      3) installer_menu "$REPO_ROOT" ;;
      4) links_menu "$REPO_ROOT" ;;
      5) ci_menu "$REPO_ROOT" ;;
      6) health_menu "$REPO_ROOT" ;;
      7) status_show_diagnostics "$REPO_ROOT" ;;
      8) cloudflare_menu "$REPO_ROOT" ;;
      f|F) gatekeeper_fix_interactive "$REPO_ROOT" ;;
      0|q|Q)
        ui_clear
        printf "\n  ${C_CYAN}Thank you for building with DaVinci Notes! Goodbye.${C_RESET}\n\n"
        exit 0
        ;;
      *)
        ui_warn "Unrecognized option: '$choice'. Please select 0 to 7 or f."
        sleep 1
        ;;
    esac
  done
}

# Handle command-line shortcut arguments
if [[ $# -gt 0 ]]; then
  case "$1" in
    --installers|-i)
      installer_menu "$REPO_ROOT"
      exit 0
      ;;
    --links|-l)
      links_menu "$REPO_ROOT"
      exit 0
      ;;
    --build|-b)
      build_menu "$REPO_ROOT"
      exit 0
      ;;
    --ci|-c)
      ci_menu "$REPO_ROOT"
      exit 0
      ;;
    --dev|-d)
      dev_menu "$REPO_ROOT"
      exit 0
      ;;
    --health)
      health_menu "$REPO_ROOT"
      exit 0
      ;;
    --diagnostics)
      status_show_diagnostics "$REPO_ROOT"
      exit 0
      ;;
    --fix|-f)
      gatekeeper_fix_interactive "$REPO_ROOT"
      exit 0
      ;;
    --cloudflare|-cf)
      cloudflare_menu "$REPO_ROOT"
      exit 0
      ;;
    --help|-h)
      printf "DaVinci Notes Management TUI\n\n"
      printf "Usage: %s [OPTION]\n\n" "$0"
      printf "Options:\n"
      printf "  -i, --installers   Directly open Built Installers & One-Click Launch menu\n"
      printf "  -b, --build        Directly open Application Build menu (Mac, Windows, Linux)\n"
      printf "  -l, --links        Directly open Release Download Links (Mac, Windows, Linux)\n"
      printf "  -c, --ci           Directly open GitHub Actions CI matrix menu\n"
      printf "  -d, --dev          Directly open Development servers menu\n"
      printf "  -f, --fix          Directly fix macOS 'App is Damaged' Gatekeeper error\n"
      printf "  -cf, --cloudflare  Directly open Cloudflare Pages deployment menu\n"
      printf "      --health       Directly run Quality Gates and Preflight checks\n"
      printf "      --diagnostics  Directly run System & Tooling diagnostics\n"
      printf "  -h, --help         Show this help message\n"
      exit 0
      ;;
    *)
      printf "Unknown option: %s. Use --help for usage.\n" "$1" >&2
      exit 1
      ;;
  esac
fi

main_menu
