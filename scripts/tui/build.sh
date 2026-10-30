#!/usr/bin/env bash
# build.sh — Local packaging for macOS, Windows, and Linux with installer management
set -euo pipefail

build_macos_target() {
  local repo_root="$1"
  local target="${2:-aarch64-apple-darwin}"
  cd "$repo_root"

  ui_info "Preparing Syncthing sidecar for target: ${target}..."
  node apps/desktop/scripts/fetchSyncthing.mjs --target "$target"

  ui_info "Compiling frontend web assets..."
  pnpm --filter @app/desktop build:web

  ui_info "Building macOS application package (${target})..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    (cd apps/desktop && pnpm exec node scripts/withCompatibleMacSdk.mjs tauri build --ignore-version-mismatches --target "$target")
    local b_app="${repo_root}/apps/desktop/src-tauri/target/${target}/release/bundle/macos/Sophia.app"
    [[ ! -d "$b_app" ]] && b_app="${repo_root}/apps/desktop/src-tauri/target/release/bundle/macos/Sophia.app"
    if [[ -d "$b_app" ]]; then
      ui_info "Applying clean ad-hoc signature to prevent Gatekeeper damage error..."
      gatekeeper_sign_app "$b_app"
      local b_dmg="${repo_root}/apps/desktop/src-tauri/target/${target}/release/bundle/dmg"
      [[ ! -d "$b_dmg" ]] && b_dmg="${repo_root}/apps/desktop/src-tauri/target/release/bundle/dmg"
      if [[ -d "$b_dmg" ]] && command -v hdiutil >/dev/null 2>&1; then
        local d_file
        d_file="$(ls -t "${b_dmg}/"*.dmg 2>/dev/null | head -1 || true)"
        if [[ -n "$d_file" ]]; then
          ui_info "Packaging verified Sophia.app into standard DMG with Applications symlink..."
          local staging_dmg="/tmp/sophia_dmg_staging_$$"
          rm -rf "$staging_dmg"
          mkdir -p "$staging_dmg"
          cp -R "$b_app" "${staging_dmg}/Sophia.app"
          ln -s /Applications "${staging_dmg}/Applications"
          if [[ -f "${repo_root}/apps/desktop/src-tauri/icons/icon.icns" ]]; then
            cp "${repo_root}/apps/desktop/src-tauri/icons/icon.icns" "${staging_dmg}/.VolumeIcon.icns"
          fi
          rm -f "$d_file"
          hdiutil create -volname "Sophia" -srcfolder "$staging_dmg" -ov -format UDZO "$d_file" -quiet
          rm -rf "$staging_dmg"
        fi
      fi
    fi
    installer_sync_from_tauri "$repo_root"
    local inst_dir
    inst_dir="$(installer_get_dir "$repo_root")"
    local newest_dmg
    newest_dmg="$(ls -t "${inst_dir}/"*.dmg 2>/dev/null | head -1 || true)"
    if [[ -n "$newest_dmg" && -f "$newest_dmg" ]]; then
      local abs_dmg
      abs_dmg="$(cd "$(dirname "$newest_dmg")" && pwd)/$(basename "$newest_dmg")"
      local rel_dmg="./installers/$(basename "$newest_dmg")"
      local sz
      sz="$(ls -lh "$newest_dmg" | awk '{print $5}')"

      ui_section "macOS Build Completed Successfully!" "🎉"
      printf "  ${C_GREEN}✔ Output Package:${C_RESET} %s (${C_CYAN}%s${C_RESET})\n\n" "$(basename "$newest_dmg")" "$sz"
      printf "  ${C_BOLD}Local Absolute Path:${C_RESET} ${C_CYAN}%s${C_RESET}\n" "$abs_dmg"
      printf "  ${C_BOLD}Local Relative Path:${C_RESET} ${C_CYAN}%s${C_RESET}\n\n" "$rel_dmg"

      printf "  ${C_BOLD}Next Steps:${C_RESET}\n"
      printf "  ${C_BOLD}1)${C_RESET} 🚀 Mount and Install / Launch Sophia now\n"
      printf "  ${C_BOLD}2)${C_RESET} 📂 Reveal in macOS Finder (open -R)\n"
      printf "  ${C_BOLD}3)${C_RESET} 📋 Copy absolute file path to clipboard\n"
      printf "  ${C_BOLD}b)${C_RESET} Return to Build Menu\n\n"
      printf "  ${C_BOLD}Select action [1-3, b]:${C_RESET} "
      local act
      read -r act || act="b"
      case "$act" in
        1) installer_perform_install "$newest_dmg" ;;
        2) open -R "$newest_dmg"; ui_success "Revealed in Finder: $newest_dmg" ;;
        3) ui_copy_clipboard "$abs_dmg" "DMG path" ;;
        *) ;;
      esac
    fi
  else
    ui_error "macOS DMG builds require a macOS host system."
  fi
}

build_windows_target() {
  local repo_root="$1"
  cd "$repo_root"
  ui_section "Build Windows Installer (.exe / .msi)" "🪟"

  if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32"* ]]; then
    ui_info "Detected Windows host. Running native Tauri build..."
    node apps/desktop/scripts/fetchSyncthing.mjs --target "x86_64-pc-windows-msvc"
    pnpm --filter @app/desktop build:web
    (cd apps/desktop && pnpm tauri build --ignore-version-mismatches --target "x86_64-pc-windows-msvc")
    installer_sync_from_tauri "$repo_root"
    ui_success "Windows build complete!"
  else
    ui_info "Host is ${OSTYPE}. Windows installers require Windows SDK or GitHub Cloud Builder."
    printf "  ${C_BOLD}1)${C_RESET} ☁️ Trigger GitHub Actions Cloud Build for Windows & download .exe\n"
    printf "  ${C_BOLD}2)${C_RESET} 🔗 Fetch latest published Windows .exe from GitHub Releases\n"
    printf "  ${C_BOLD}b)${C_RESET} Cancel\n\n"
    printf "  ${C_BOLD}Select [1-2]:${C_RESET} "
    local c
    read -r c || return 0
    case "$c" in
      1)
        if command -v gh >/dev/null 2>&1; then
          local tag
          tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0")"
          ui_info "Dispatched Windows build matrix in CI for ${tag}..."
          gh workflow run release.yml -f release_tag="$tag"
          ui_info "Run Option 4 from CI menu to watch and verify."
        else
          ui_warn "GitHub CLI (gh) not installed."
        fi
        ;;
      2)
        local inst_dir
        inst_dir="$(installer_get_dir "$repo_root")"
        local tag
        tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0")"
        local url="https://github.com/AhmedWanneni/davinci-notes-workspace/releases/download/${tag}/Sophia_${tag#v}_x64-setup.exe"
        ui_info "Downloading ${url} to ${inst_dir}..."
        curl -fL "$url" -o "${inst_dir}/Sophia_${tag#v}_x64-setup.exe" && ui_success "Downloaded!" || ui_warn "Asset building in CI."
        ;;
      *) ;;
    esac
  fi
}

build_linux_target() {
  local repo_root="$1"
  cd "$repo_root"
  ui_section "Build Linux Installer (.AppImage / .deb)" "🐧"

  if [[ "$OSTYPE" == "linux"* ]]; then
    ui_info "Detected Linux host. Running native Tauri build..."
    node apps/desktop/scripts/fetchSyncthing.mjs --target "x86_64-unknown-linux-gnu"
    pnpm --filter @app/desktop build:web
    (cd apps/desktop && pnpm tauri build --ignore-version-mismatches --target "x86_64-unknown-linux-gnu")
    installer_sync_from_tauri "$repo_root"
    ui_success "Linux build complete!"
  else
    ui_info "Host is ${OSTYPE}. Linux packaging requires Linux libraries (WebKit2GTK) or Cloud/Docker."
    printf "  ${C_BOLD}1)${C_RESET} ☁️ Trigger GitHub Actions Cloud Build for Linux & download .AppImage\n"
    printf "  ${C_BOLD}2)${C_RESET} 🔗 Fetch latest published Linux .AppImage from GitHub Releases\n"
    printf "  ${C_BOLD}b)${C_RESET} Cancel\n\n"
    printf "  ${C_BOLD}Select [1-2]:${C_RESET} "
    local c
    read -r c || return 0
    case "$c" in
      1)
        if command -v gh >/dev/null 2>&1; then
          local tag
          tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0")"
          ui_info "Dispatched Linux build matrix in CI for ${tag}..."
          gh workflow run release.yml -f release_tag="$tag"
          ui_info "Run Option 4 from CI menu to watch and verify."
        else
          ui_warn "GitHub CLI (gh) not installed."
        fi
        ;;
      2)
        local inst_dir
        inst_dir="$(installer_get_dir "$repo_root")"
        local tag
        tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.1.0")"
        local url="https://github.com/AhmedWanneni/davinci-notes-workspace/releases/download/${tag}/Sophia_${tag#v}_amd64.AppImage"
        ui_info "Downloading ${url} to ${inst_dir}..."
        if curl -fL "$url" -o "${inst_dir}/Sophia_${tag#v}_amd64.AppImage"; then
          chmod +x "${inst_dir}/Sophia_${tag#v}_amd64.AppImage"
          ui_success "Downloaded and marked executable!"
        else
          ui_warn "Asset building in CI."
        fi
        ;;
      *) ;;
    esac
  fi
}

build_menu() {
  local repo_root="$1"
  cd "$repo_root"

  while true; do
    ui_banner
    status_render_bar "$repo_root"
    ui_section "Build Applications & Installers" "🔨"
    ui_menu_item "1" "🍏" "Build macOS App" "Compile DMG & App (Ad-hoc signed)"
    ui_menu_item "2" "🪟" "Build Windows Installer" "EXE / MSI packages"
    ui_menu_item "3" "🐧" "Build Linux Installer" "AppImage & DEB packages"
    ui_menu_item "4" "📦" "Installers Manager" "One-click install/run & path reveal"
    ui_menu_item "5" "🌐" "Build Web Assets" "pnpm build:web"
    ui_menu_item "6" "🧹" "Clean Build Caches" "Clean dist, turbo, target"
    ui_menu_item "b" "↩ " "Back to Main Menu" ""
    ui_section_end
    printf "  ${C_CYAN}${C_BOLD}Select an option [1-6, b]:${C_RESET} "

    local choice
    read -r choice || break
    case "$choice" in
      1)
        printf "\n  Select macOS Target:\n"
        printf "  1) Apple Silicon (aarch64 M1-M4) [Recommended]\n"
        printf "  2) Intel x64 (x86_64-apple-darwin)\n"
        printf "  Choose [1-2]: "
        local mac_opt
        read -r mac_opt || mac_opt="1"
        if [[ "$mac_opt" == "2" ]]; then
          build_macos_target "$repo_root" "x86_64-apple-darwin"
        else
          build_macos_target "$repo_root" "aarch64-apple-darwin"
        fi
        ui_pause
        ;;
      2)
        build_windows_target "$repo_root"
        ui_pause
        ;;
      3)
        build_linux_target "$repo_root"
        ui_pause
        ;;
      4)
        installer_menu "$repo_root"
        ;;
      5)
        ui_info "Building frontend web distribution bundle..."
        pnpm --filter @app/desktop build:web
        ui_success "Web assets compiled to apps/desktop/dist!"
        ui_pause
        ;;
      6)
        ui_warn "Cleaning cache directories..."
        rm -rf apps/desktop/dist apps/desktop/src-tauri/target/release/bundle
        pnpm turbo clean 2>/dev/null || true
        ui_success "Cleaned temporary build artifacts."
        ui_pause
        ;;
      b|B|"") break ;;
      *)
        ui_warn "Invalid selection. Please enter 1-6 or b."
        sleep 1
        ;;
    esac
  done
}
