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
    ui_menu_item "1" "💻" "Start Desktop App" "Tauri + Vite Live Reload"
    ui_menu_item "2" "🌐" "Start Web UI Only" "Vite on localhost:1420"
    ui_menu_item "3" "🪐" "Start Marketing Site" "Astro on localhost:4321"
    ui_menu_item "4" "🔄" "Fetch Syncthing Sidecar" "Download host binary"
    ui_menu_item "5" "🎨" "Prepare Emoji Dataset" "emojibase extraction"
    ui_menu_item "b" "↩ " "Back to Main Menu" ""
    ui_section_end
    printf "  ${C_CYAN}${C_BOLD}Select an option [1-5, b]:${C_RESET} "

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
