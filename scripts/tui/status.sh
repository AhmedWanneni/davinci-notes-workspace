#!/usr/bin/env bash
# status.sh — Workspace environment, git status, and dependency diagnostics
set -euo pipefail

status_render_bar() {
  local repo_root="$1"
  cd "$repo_root"

  # Git branch and dirty state
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
  local dirty_count
  dirty_count="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  local dirty_badge
  if [[ "$dirty_count" == "0" ]]; then
    dirty_badge="${C_GREEN}clean${C_RESET}"
  else
    dirty_badge="${C_YELLOW}${dirty_count} uncommitted${C_RESET}"
  fi

  # Version from apps/desktop/package.json
  local version="0.1.0"
  if [[ -f "apps/desktop/package.json" ]]; then
    version="$(grep '"version"' apps/desktop/package.json | head -1 | tr -d ' ",' | cut -d':' -f2)"
  fi

  # Syncthing host binary presence
  local host_os host_arch st_status
  host_os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  host_arch="$(uname -m)"
  if [[ "$host_arch" == "arm64" ]]; then
    host_arch="aarch64"
  fi

  local target_suffix
  if [[ "$host_os" == "darwin" ]]; then
    target_suffix="${host_arch}-apple-darwin"
  elif [[ "$host_os" == "linux" ]]; then
    target_suffix="${host_arch}-unknown-linux-gnu"
  else
    target_suffix="${host_arch}-pc-windows-msvc"
  fi

  local st_bin="apps/desktop/src-tauri/binaries/syncthing-${target_suffix}"
  if [[ -f "$st_bin" || -f "${st_bin}.exe" ]]; then
    st_status="${C_GREEN}ready${C_RESET}"
  else
    st_status="${C_YELLOW}missing (download in menu)${C_RESET}"
  fi

  # Render formatted status box
  printf "  ${C_MUTED}╭─────────────────────────────────────────────────────────╮${C_RESET}\n"
  printf "  ${C_MUTED}│${C_RESET} ${C_BOLD}Branch:${C_RESET} %-18s ${C_MUTED}│${C_RESET} ${C_BOLD}State:${C_RESET} %-23b ${C_MUTED}│${C_RESET}\n" \
    "$branch" "$dirty_badge"
  printf "  ${C_MUTED}│${C_RESET} ${C_BOLD}Version:${C_RESET} v%-17s ${C_MUTED}│${C_RESET} ${C_BOLD}Syncthing:${C_RESET} %-20b ${C_MUTED}│${C_RESET}\n" \
    "$version" "$st_status"
  printf "  ${C_MUTED}│${C_RESET} ${C_BOLD}Host:${C_RESET} %-20s ${C_MUTED}│${C_RESET} ${C_BOLD}Architecture:${C_RESET} %-14s ${C_MUTED}│${C_RESET}\n" \
    "$host_os" "$host_arch"
  printf "  ${C_MUTED}╰─────────────────────────────────────────────────────────╯${C_RESET}\n"
}

status_show_diagnostics() {
  local repo_root="$1"
  cd "$repo_root"

  ui_banner
  ui_section "System & Tooling Diagnostics" "⚙"

  printf "\n  Checking runtime environments:\n"
  for cmd in node pnpm cargo rustc gh git; do
    if command -v "$cmd" >/dev/null 2>&1; then
      local ver
      ver="$($cmd --version 2>&1 | head -1 | cut -d' ' -f1-3)"
      printf "    %-10s : ${C_GREEN}✔ Available${C_RESET} (${C_MUTED}%s${C_RESET})\n" "$cmd" "$ver"
    else
      printf "    %-10s : ${C_RED}✖ Not found${C_RESET}\n" "$cmd"
    fi
  done

  printf "\n  Checking Syncthing Sidecar Binaries:\n"
  for t in aarch64-apple-darwin x86_64-apple-darwin x86_64-pc-windows-msvc x86_64-unknown-linux-gnu; do
    local f="apps/desktop/src-tauri/binaries/syncthing-${t}"
    if [[ -f "$f" || -f "${f}.exe" ]]; then
      local sz
      sz="$(ls -lh "$f" 2>/dev/null | awk '{print $5}' || ls -lh "${f}.exe" 2>/dev/null | awk '{print $5}')"
      printf "    %-30s : ${C_GREEN}✔ Installed${C_RESET} (${C_MUTED}%s${C_RESET})\n" "$t" "$sz"
    else
      printf "    %-30s : ${C_YELLOW}▲ Missing${C_RESET}\n" "$t"
    fi
  done

  ui_pause
}
