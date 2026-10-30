#!/usr/bin/env bash
# dev.sh — Development server and asset preparation workflows
set -euo pipefail

dev_menu() {
  local repo_root="$1"
  cd "$repo_root"

  while true; do
    ui_banner
    status_render_bar "$repo_root"
    ui_section "Run App & Development Modes" "🚀"

    printf "  ${C_BOLD}1)${C_RESET} Start Desktop Application (${C_CYAN}Tauri + Vite Live Reload${C_RESET})\n"
    printf "  ${C_BOLD}2)${C_RESET} Start Web Interface Only (${C_CYAN}Vite on localhost:1420${C_RESET})\n"
    printf "  ${C_BOLD}3)${C_RESET} Start Astro Marketing Website (${C_CYAN}Astro on localhost:4321${C_RESET})\n"
    printf "  ${C_BOLD}4)${C_RESET} Prepare Local Syncthing Binary (${C_CYAN}Download host sidecar${C_RESET})\n"
    printf "  ${C_BOLD}5)${C_RESET} Prepare Emoji Dataset (${C_CYAN}emojibase data extraction${C_RESET})\n"
    printf "  ${C_BOLD}b)${C_RESET} Back to Main Menu\n\n"
    printf "  ${C_BOLD}Select an option:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1)
        ui_info "Starting DaVinci Notes Desktop in development mode..."
        ui_info "Press Ctrl+C inside the terminal to terminate."
        pnpm --filter @app/desktop dev
        ui_pause
        ;;
      2)
        ui_info "Starting DaVinci Notes Web development server..."
        ui_info "Press Ctrl+C inside the terminal to terminate."
        pnpm --filter @app/desktop dev:web
        ui_pause
        ;;
      3)
        ui_info "Starting Astro Website development server..."
        ui_info "Press Ctrl+C inside the terminal to terminate."
        pnpm --filter @app/website dev
        ui_pause
        ;;
      4)
        ui_info "Fetching Syncthing binary for host platform..."
        pnpm --filter @app/desktop prepare:syncthing
        ui_success "Syncthing sidecar ready."
        ui_pause
        ;;
      5)
        ui_info "Extracting emojibase data..."
        pnpm --filter @app/desktop prepare:emoji-data
        ui_success "Emoji data ready."
        ui_pause
        ;;
      b|B|"")
        break
        ;;
      *)
        ui_warn "Invalid selection. Please enter 1-5 or b."
        sleep 1
        ;;
    esac
  done
}
