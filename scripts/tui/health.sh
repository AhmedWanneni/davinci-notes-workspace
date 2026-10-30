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

    printf "  ${C_BOLD}1)${C_RESET} Run Full Preflight Release Audit (${C_CYAN}tree, branch, sync, web build${C_RESET})\n"
    printf "  ${C_BOLD}2)${C_RESET} Audit Manifest Version Synchronization (${C_CYAN}all 6 manifests${C_RESET})\n"
    printf "  ${C_BOLD}3)${C_RESET} Run Unit Test Suite (${C_CYAN}pnpm test${C_RESET})\n"
    printf "  ${C_BOLD}4)${C_RESET} Audit Bundle Size Budgets (${C_CYAN}scripts/check-bundle-size.mjs${C_RESET})\n"
    printf "  ${C_BOLD}5)${C_RESET} View Git Status & Uncommitted Diffs\n"
    printf "  ${C_BOLD}b)${C_RESET} Back to Main Menu\n\n"
    printf "  ${C_BOLD}Select an option:${C_RESET} "

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
