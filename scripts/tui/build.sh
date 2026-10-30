#!/usr/bin/env bash
# build.sh — Local packaging, asset building, and artifact discovery
set -euo pipefail

build_find_local_artifacts() {
  local repo_root="$1"
  local bundle_dir="${repo_root}/apps/desktop/src-tauri/target/release/bundle"

  if [[ ! -d "$bundle_dir" ]]; then
    ui_info "No local release bundle directory found yet."
    return
  fi

  ui_section "Discovered Local Built Artifacts" "📦"
  local found=0

  # Search for macOS DMG
  if compgen -G "${bundle_dir}/dmg/*.dmg" >/dev/null; then
    for dmg in "${bundle_dir}/dmg/"*.dmg; do
      local sz
      sz="$(ls -lh "$dmg" | awk '{print $5}')"
      printf "  🍏 ${C_GREEN}macOS DMG:${C_RESET} %s (${C_MUTED}%s${C_RESET})\n" "$dmg" "$sz"
      printf "     ${C_MUTED}→ Open in Finder: open -R \"%s\"${C_RESET}\n" "$dmg"
      found=1
    done
  fi

  # Search for macOS App
  if compgen -G "${bundle_dir}/macos/*.app" >/dev/null; then
    for app in "${bundle_dir}/macos/"*.app; do
      printf "  🍏 ${C_GREEN}macOS App:${C_RESET} %s\n" "$app"
      found=1
    done
  fi

  # Search for Linux deb/AppImage
  if compgen -G "${bundle_dir}/deb/*.deb" >/dev/null; then
    for deb in "${bundle_dir}/deb/"*.deb; do
      printf "  🐧 ${C_GREEN}Linux DEB:${C_RESET} %s\n" "$deb"
      found=1
    done
  fi
  if compgen -G "${bundle_dir}/appimage/*.AppImage" >/dev/null; then
    for ai in "${bundle_dir}/appimage/"*.AppImage; do
      printf "  🐧 ${C_GREEN}Linux AppImage:${C_RESET} %s\n" "$ai"
      found=1
    done
  fi

  # Search for Windows MSI/NSIS
  if compgen -G "${bundle_dir}/msi/*.msi" >/dev/null; then
    for msi in "${bundle_dir}/msi/"*.msi; do
      printf "  🪟 ${C_GREEN}Windows MSI:${C_RESET} %s\n" "$msi"
      found=1
    done
  fi
  if compgen -G "${bundle_dir}/nsis/*.exe" >/dev/null; then
    for exe in "${bundle_dir}/nsis/"*.exe; do
      printf "  🪟 ${C_GREEN}Windows EXE:${C_RESET} %s\n" "$exe"
      found=1
    done
  fi

  if [[ "$found" == "0" ]]; then
    ui_info "No installable packages found in release bundle yet."
  fi
}

build_menu() {
  local repo_root="$1"
  cd "$repo_root"

  while true; do
    ui_banner
    status_render_bar "$repo_root"
    ui_section "Build Applications & Artifacts" "🔨"

    printf "  ${C_BOLD}1)${C_RESET} Build Frontend Web Assets (${C_CYAN}pnpm build:web${C_RESET})\n"
    printf "  ${C_BOLD}2)${C_RESET} Local Smoke Check (${C_CYAN}verify sync, assets, cargo check${C_RESET})\n"
    printf "  ${C_BOLD}3)${C_RESET} Build Full Desktop App Package (${C_CYAN}Compile native DMG/App${C_RESET})\n"
    printf "  ${C_BOLD}4)${C_RESET} Inspect & Reveal Local Built Artifacts (${C_CYAN}DMG, App, DEB${C_RESET})\n"
    printf "  ${C_BOLD}5)${C_RESET} Clean Build Caches (${C_CYAN}Clean dist, turbo, target${C_RESET})\n"
    printf "  ${C_BOLD}b)${C_RESET} Back to Main Menu\n\n"
    printf "  ${C_BOLD}Select an option:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1)
        ui_info "Building frontend web distribution bundle..."
        pnpm --filter @app/desktop build:web
        ui_success "Web assets successfully compiled to apps/desktop/dist!"
        ui_pause
        ;;
      2)
        ui_info "Running local smoke check..."
        bash "${repo_root}/scripts/release/build-local.sh"
        ui_pause
        ;;
      3)
        ui_info "Compiling and packaging native desktop application..."
        ui_info "This will compile Rust backend in release mode and package installers."
        if pnpm --filter @app/desktop build; then
          ui_success "Native packaging completed successfully!"
          build_find_local_artifacts "$repo_root"
        else
          ui_error "Desktop build failed. Check compiler output above."
        fi
        ui_pause
        ;;
      4)
        build_find_local_artifacts "$repo_root"
        local bdir="${repo_root}/apps/desktop/src-tauri/target/release/bundle"
        if [[ -d "$bdir" && "$OSTYPE" == "darwin"* ]]; then
          printf "\n  Open bundle directory in macOS Finder? [y/N]: "
          local o
          read -r o || o="n"
          if [[ "$o" =~ ^[Yy]$ ]]; then
            open "$bdir"
            ui_success "Opened bundle in Finder."
          fi
        fi
        ui_pause
        ;;
      5)
        ui_warn "Cleaning cache directories..."
        rm -rf apps/desktop/dist apps/desktop/src-tauri/target/release/bundle
        pnpm turbo clean 2>/dev/null || true
        ui_success "Cleaned temporary build artifacts."
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
