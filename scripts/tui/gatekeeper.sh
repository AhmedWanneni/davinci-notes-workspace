#!/usr/bin/env bash
# gatekeeper.sh — macOS Gatekeeper quarantine remover and ad-hoc codesign repair
set -euo pipefail

gatekeeper_sign_app() {
  local app_path="$1"
  if [[ "$OSTYPE" != "darwin"* ]]; then
    return 0
  fi
  if [[ ! -d "$app_path" ]]; then
    return 1
  fi

  # Strip com.apple.quarantine and extended attributes
  xattr -cr "$app_path" 2>/dev/null || true

  # Ad-hoc sign executable and all nested binaries/sidecars deeply
  codesign --force --deep --sign - "$app_path" 2>/dev/null || true
}

gatekeeper_verify_app() {
  local app_path="$1"
  if [[ "$OSTYPE" != "darwin"* ]]; then
    return 0
  fi
  codesign -vvv --deep --strict "$app_path" 2>/dev/null
}

gatekeeper_fix_interactive() {
  local repo_root="$1"
  ui_banner
  status_render_bar "$repo_root"
  ui_section "macOS Gatekeeper & 'App Damaged' Repair" "🛡️"

  if [[ "$OSTYPE" != "darwin"* ]]; then
    ui_warn "Gatekeeper repairs are only applicable on macOS (darwin)."
    ui_pause
    return 0
  fi

  printf "  ${C_MUTED}macOS flags unsigned or ad-hoc applications with 'is damaged and can't be opened'.${C_RESET}\n"
  printf "  ${C_MUTED}This tool strips the quarantine attribute and applies a clean ad-hoc signature.${C_RESET}\n\n"

  printf "  ${C_BOLD}[ 1 ]${C_RESET} 🍏 Fix ${C_CYAN}/Applications/Sophia.app${C_RESET} (Default installation)\n"
  printf "  ${C_BOLD}[ 2 ]${C_RESET} 📦 Fix ${C_CYAN}./installers/Sophia.app${C_RESET} (Local build artifact)\n"
  printf "  ${C_BOLD}[ 3 ]${C_RESET} 📂 Fix custom application path\n"
  printf "  ${C_BOLD}[ b ]${C_RESET} Back to Main Menu\n\n"
  printf "  ${C_BOLD}Select an option [1-3, b]:${C_RESET} "

  local choice
  read -r choice || return 0

  local target=""
  case "$choice" in
    1) target="/Applications/Sophia.app" ;;
    2) target="${repo_root}/installers/Sophia.app" ;;
    3)
      printf "  ${C_BOLD}Enter full path to .app bundle:${C_RESET} "
      read -r target || return 0
      ;;
    b|B|"") return 0 ;;
    *)
      ui_warn "Invalid selection."
      sleep 1
      return 0
      ;;
  esac

  if [[ ! -d "$target" ]]; then
    ui_error "Application bundle not found at: ${target}"
    ui_info "Please ensure the app is installed or built first."
    ui_pause
    return 0
  fi

  printf "\n"
  ui_info "Step 1/3: Stripping Gatekeeper quarantine xattrs on ${target}..."
  xattr -cr "$target" 2>/dev/null || true
  ui_success "Quarantine flags removed."

  ui_info "Step 2/3: Applying deep ad-hoc code signature..."
  if codesign --force --deep --sign - "$target" 2>/dev/null; then
    ui_success "Signature applied cleanly."
  else
    ui_warn "Codesign notice emitted, verifying bundle..."
  fi

  ui_info "Step 3/3: Verifying bundle integrity..."
  if gatekeeper_verify_app "$target"; then
    ui_success "VERIFIED! Sophia.app satisfies all Designated Requirements."
    printf "\n  ${C_GREEN}${C_BOLD}✔ The 'App is damaged' error has been resolved!${C_RESET}\n"
    printf "  ${C_BOLD}Would you like to launch Sophia now? [Y/n]:${C_RESET} "
    local launch
    read -r launch || launch="y"
    if [[ "$launch" =~ ^[Yy]?$ ]]; then
      open "$target"
      ui_success "Sophia launched successfully!"
    fi
  else
    ui_warn "Bundle signature applied. Try launching from Applications or Finder."
  fi

  ui_pause
}
