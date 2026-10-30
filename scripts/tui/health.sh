#!/usr/bin/env bash
# health.sh — Repository health, preflight audits, and quality gates
set -euo pipefail

health_menu() {
  local repo_root="$1"
  cd "$repo_root"

  while true; do
    ui_banner
    status_render_bar "$repo_root"
    ui_section "Health, Audits & Quality Gates" "🔍"
    ui_menu_item "1" "🧪" "Preflight Release Audit" "tree, branch, sync, web build"
    ui_menu_item "2" "📋" "Version Sync Audit" "all 6 manifests"
    ui_menu_item "3" "⚡" "Run Unit Test Suite" "pnpm test"
    ui_menu_item "4" "📊" "Bundle Size Budgets" "scripts/check-bundle-size.mjs"
    ui_menu_item "5" "🌿" "Git Status & Diffs" "uncommitted changes audit"
    ui_menu_item "b" "↩ " "Back to Main Menu" ""
    ui_section_end
    printf "  ${C_CYAN}${C_BOLD}Select an option [1-5, b]:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1)
        ui_info "Executing Preflight Release Audit..."
        if bash "${repo_root}/scripts/release/preflight-release.sh"; then
          ui_success "Repository passed all preflight release criteria!"
        else
          ui_error "Preflight release audit identified issues."
        fi
        ui_pause
        ;;
      2)
        ui_info "Checking version parity across manifests..."
        bash "${repo_root}/scripts/release/check-version-sync.sh"
        ui_pause
        ;;
      3)
        ui_info "Running test suite..."
        pnpm test
        ui_pause
        ;;
      4)
        ui_info "Auditing bundle size limits..."
        node "${repo_root}/scripts/check-bundle-size.mjs"
        ui_pause
        ;;
      5)
        git status
        printf "\n  Show git diff summary? [y/N]: "
        local d
        read -r d || d="n"
        if [[ "$d" =~ ^[Yy]$ ]]; then
          git diff --stat
        fi
        ui_pause
        ;;
      b|B|"")
        break
        ;;
      *)
        ui_warn "Invalid selection."
        sleep 1
        ;;
    esac
  done
}
