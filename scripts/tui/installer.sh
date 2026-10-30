#!/usr/bin/env bash
# installer.sh — Discovered local installers manager, one-click install, and finder reveal
set -euo pipefail

installer_get_dir() {
  local repo_root="$1"
  local dir="${repo_root}/installers"
  mkdir -p "$dir"
  printf "%s" "$dir"
}

installer_sync_from_tauri() {
  local repo_root="$1"
  local inst_dir
  inst_dir="$(installer_get_dir "$repo_root")"
  local bundle_dir="${repo_root}/apps/desktop/src-tauri/target/release/bundle"

  if [[ ! -d "$bundle_dir" ]]; then
    return 0
  fi

  # Copy DMG files
  for f in "${bundle_dir}/dmg/"*.dmg; do
    if [[ -f "$f" ]]; then
      cp -u "$f" "$inst_dir/" 2>/dev/null || cp "$f" "$inst_dir/"
    fi
  done
  # Copy macOS App packages
  for f in "${bundle_dir}/macos/"*.app; do
    if [[ -d "$f" ]]; then
      local base
      base="$(basename "$f")"
      rm -rf "${inst_dir}/${base}"
      cp -R "$f" "$inst_dir/"
    fi
  done
  # Copy Linux artifacts
  for f in "${bundle_dir}/appimage/"*.AppImage "${bundle_dir}/deb/"*.deb; do
    if [[ -f "$f" ]]; then
      cp -u "$f" "$inst_dir/" 2>/dev/null || cp "$f" "$inst_dir/"
    fi
  done
  # Copy Windows artifacts
  for f in "${bundle_dir}/msi/"*.msi "${bundle_dir}/nsis/"*.exe; do
    if [[ -f "$f" ]]; then
      cp -u "$f" "$inst_dir/" 2>/dev/null || cp "$f" "$inst_dir/"
    fi
  done
}

installer_perform_install() {
  local file="$1"
  local base
  base="$(basename "$file")"

  if [[ "$file" == *.dmg ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      ui_info "Mounting disk image: ${base}..."
      local mount_out
      mount_out="$(hdiutil attach "$file" -nobrowse -noverify 2>&1 || true)"
      local mount_point
      mount_point="$(echo "$mount_out" | grep -o '/Volumes/.*' | head -1 || true)"
      if [[ -n "$mount_point" && -d "$mount_point" ]]; then
        ui_success "Mounted at: ${mount_point}"
        printf "\n  ${C_BOLD}Install Options:${C_RESET}\n"
        printf "  ${C_BOLD}1)${C_RESET} Automatically copy app to /Applications\n"
        printf "  ${C_BOLD}2)${C_RESET} Open mounted volume in Finder\n"
        printf "  ${C_BOLD}3)${C_RESET} Unmount and return\n"
        printf "  ${C_BOLD}Choose [1-3]:${C_RESET} "
        local opt
        read -r opt || opt="2"
        case "$opt" in
          1)
            local app_in_vol
            app_in_vol="$(find "$mount_point" -maxdepth 2 -name "*.app" | head -1 || true)"
            if [[ -n "$app_in_vol" ]]; then
              ui_info "Copying $(basename "$app_in_vol") to /Applications..."
              cp -R "$app_in_vol" /Applications/
              ui_success "Installed to /Applications! You can now launch Sophia from Spotlight or Launchpad."
            else
              ui_warn "No .app found in mounted volume."
            fi
            hdiutil detach "$mount_point" -quiet || true
            ;;
          2)
            open "$mount_point"
            ui_info "Drag Sophia into Applications folder in Finder window."
            ;;
          *)
            hdiutil detach "$mount_point" -quiet || true
            ;;
        esac
      else
        open "$file"
      fi
    else
      ui_warn "Cannot mount macOS DMG on this operating system."
    fi
  elif [[ "$file" == *.app ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      ui_info "Launching application: ${file}..."
      open "$file"
      ui_success "Application launched!"
    fi
  elif [[ "$file" == *.AppImage ]]; then
    chmod +x "$file"
    if [[ "$OSTYPE" == "linux"* ]]; then
      ui_info "Launching Linux AppImage: ${file}..."
      "$file" &
      ui_success "AppImage launched in background!"
    else
      ui_info "Made executable. Run this file on a Linux desktop system."
    fi
  elif [[ "$file" == *.exe || "$file" == *.msi ]]; then
    ui_info "Windows installer ready: ${file}"
    if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32"* ]]; then
      start "$file"
    else
      ui_info "Transfer this installer to your Windows PC to run setup."
    fi
  fi
}

installer_menu() {
  local repo_root="$1"
  cd "$repo_root"

  installer_sync_from_tauri "$repo_root"
  local inst_dir
  inst_dir="$(installer_get_dir "$repo_root")"

  while true; do
    ui_banner
    status_render_bar "$repo_root"
    ui_section "Ready-to-Install Packages (${inst_dir})" "📦"

    local files=()
    local idx=1
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      files+=("$f")
    done < <(find "$inst_dir" -maxdepth 1 -type f \( -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.exe" -o -name "*.msi" \) 2>/dev/null | sort || true)

    if compgen -G "${inst_dir}/*.app" >/dev/null; then
      for f in "${inst_dir}/"*.app; do
        [[ -d "$f" ]] && files+=("$f")
      done
    fi

    if [[ ${#files[@]} -eq 0 ]]; then
      ui_info "No local packages found in ${inst_dir} yet."
      printf "  ${C_MUTED}Tip: Build a package in option 2 or download from option 3.${C_RESET}\n\n"
      printf "  ${C_BOLD}o)${C_RESET} Open installers folder in Finder/Explorer\n"
      printf "  ${C_BOLD}b)${C_RESET} Back\n\n"
      printf "  ${C_BOLD}Select:${C_RESET} "
      local c
      read -r c || break
      case "$c" in
        o|O) open "$inst_dir" 2>/dev/null || xdg-open "$inst_dir" 2>/dev/null || true ;;
        *) break ;;
      esac
      continue
    fi

    printf "  ${C_MUTED}%-4s %-6s %-36s %-10s${C_RESET}\n" "#" "OS" "Filename" "Size"
    printf "  ${C_MUTED}─────────────────────────────────────────────────────────────${C_RESET}\n"
    for ((i=0; i<${#files[@]}; i++)); do
      local f="${files[$i]}"
      local base
      base="$(basename "$f")"
      local sz="N/A"
      if [[ -f "$f" ]]; then sz="$(ls -lh "$f" | awk '{print $5}')"; fi
      local os_badge="🍏"
      [[ "$base" == *.exe || "$base" == *.msi ]] && os_badge="🪟"
      [[ "$base" == *.AppImage || "$base" == *.deb ]] && os_badge="🐧"
      printf "  ${C_BOLD}%2d)${C_RESET} %s %-36s ${C_CYAN}%-10s${C_RESET}\n" "$((i+1))" "$os_badge" "$base" "$sz"
    done

    printf "\n  ${C_BOLD}Actions:${C_RESET} Enter file number to install/reveal, 'o' to open folder, 'b' to go back.\n"
    printf "  ${C_BOLD}Select [1-%d]:${C_RESET} " "${#files[@]}"

    local sel
    read -r sel || break
    case "$sel" in
      o|O)
        open "$inst_dir" 2>/dev/null || xdg-open "$inst_dir" 2>/dev/null || true
        ui_success "Opened folder: $inst_dir"
        ui_pause
        ;;
      b|B|"") break ;;
      *)
        if [[ "$sel" =~ ^[0-9]+$ ]] && (( sel >= 1 && sel <= ${#files[@]} )); then
          local target_file="${files[$((sel-1))]}"
          printf "\n  ${C_BOLD}Selected:${C_RESET} %s\n" "$(basename "$target_file")"
          printf "  ${C_BOLD}1)${C_RESET} 🚀 ${C_GREEN}Install / Launch Now${C_RESET}\n"
          printf "  ${C_BOLD}2)${C_RESET} 📂 Reveal in Finder / File Explorer\n"
          printf "  ${C_BOLD}3)${C_RESET} 📋 Copy absolute file path\n"
          printf "  ${C_BOLD}4)${C_RESET} 🔐 View SHA256 checksum\n"
          printf "  ${C_BOLD}Choose action [1-4]:${C_RESET} "
          local act
          read -r act || act="1"
          case "$act" in
            1) installer_perform_install "$target_file"; ui_pause ;;
            2)
              if [[ "$OSTYPE" == "darwin"* ]]; then
                open -R "$target_file"
              else
                open "$(dirname "$target_file")" 2>/dev/null || xdg-open "$(dirname "$target_file")" 2>/dev/null || true
              fi
              ui_success "Revealed in File Manager."
              ui_pause
              ;;
            3) ui_copy_clipboard "$target_file" "installer path"; ui_pause ;;
            4)
              if command -v shasum >/dev/null 2>&1; then
                ui_info "SHA256: $(shasum -a 256 "$target_file" | awk '{print $1}')"
              fi
              ui_pause
              ;;
          esac
        else
          ui_warn "Invalid selection."
          sleep 1
        fi
        ;;
    esac
  done
}
