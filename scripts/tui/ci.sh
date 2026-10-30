#!/usr/bin/env bash
# ci.sh — GitHub Actions CI workflow inspection and triggers
set -euo pipefail

ci_menu() {
  local repo_root="$1"
  cd "$repo_root"

  while true; do
    ui_banner
    status_render_bar "$repo_root"
    ui_section "GitHub CI & Release Automation" "☁"

    printf "  ${C_BOLD}1)${C_RESET} List Recent Release Workflow Runs (${C_CYAN}gh run list${C_RESET})\n"
    printf "  ${C_BOLD}2)${C_RESET} Inspect Latest Run & Failure Logs (${C_CYAN}gh run view --log-failed${C_RESET})\n"
    printf "  ${C_BOLD}3)${C_RESET} Trigger Release Build Matrix in CI (${C_CYAN}macOS, Windows, Linux${C_RESET})\n"
    printf "  ${C_BOLD}4)${C_RESET} Watch Release Build in Real Time (${C_CYAN}wait-and-verify-release.sh${C_RESET})\n"
    printf "  ${C_BOLD}5)${C_RESET} Open GitHub Actions in Web Browser\n"
    printf "  ${C_BOLD}b)${C_RESET} Back to Main Menu\n\n"
    printf "  ${C_BOLD}Select an option:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1)
        if ! command -v gh >/dev/null 2>&1; then
          ui_error "GitHub CLI (gh) is not installed."
        else
          ui_info "Listing last 5 release workflow runs..."
          gh run list --workflow="release.yml" -L 5
        fi
        ui_pause
        ;;
      2)
        if ! command -v gh >/dev/null 2>&1; then
          ui_error "GitHub CLI (gh) is not installed."
        else
          local latest_run_id
          latest_run_id="$(gh run list --workflow="release.yml" -L 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)"
          if [[ -n "$latest_run_id" ]]; then
            ui_info "Inspecting run #${latest_run_id}..."
            gh run view "$latest_run_id" || true
            printf "\n  Show failed logs? [y/N]: "
            local sf
            read -r sf || sf="n"
            if [[ "$sf" =~ ^[Yy]$ ]]; then
              gh run view "$latest_run_id" --log-failed | head -n 80 || true
            fi
          else
            ui_warn "No release runs found."
          fi
        fi
        ui_pause
        ;;
      3)
        if ! command -v gh >/dev/null 2>&1; then
          ui_error "GitHub CLI (gh) is not installed."
        else
          local default_tag
          default_tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0")"
          printf "  Enter release tag to trigger build for [%s]: " "$default_tag"
          local chosen_tag
          read -r chosen_tag || chosen_tag=""
          if [[ -z "$chosen_tag" ]]; then
            chosen_tag="$default_tag"
          fi
          ui_info "Triggering release.yml for tag ${chosen_tag}..."
          if gh workflow run release.yml -f release_tag="$chosen_tag"; then
            ui_success "Dispatched release build matrix to GitHub Actions!"
            ui_info "Check status with Option 1 or 4."
          fi
        fi
        ui_pause
        ;;
      4)
        local tag
        tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0")"
        printf "  Enter release tag to watch [%s]: " "$tag"
        local w_tag
        read -r w_tag || w_tag=""
        if [[ -z "$w_tag" ]]; then
          w_tag="$tag"
        fi
        ui_info "Launching wait-and-verify-release watcher for ${w_tag}..."
        bash "${repo_root}/scripts/release/wait-and-verify-release.sh" "$w_tag"
        ui_pause
        ;;
      5)
        ui_open_url "https://github.com/AhmedWanneni/davinci-notes-workspace/actions/workflows/release.yml"
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
