#!/usr/bin/env bash
# ui.sh — Terminal styling, banner, colors, and interactive UI primitives
set -euo pipefail

# ANSI color and style tokens
if [[ -t 1 ]]; then
  C_RESET='\033[0m'
  C_BOLD='\033[1m'
  C_DIM='\033[2m'
  C_RED='\033[38;5;203m'
  C_GREEN='\033[38;5;120m'
  C_YELLOW='\033[38;5;221m'
  C_BLUE='\033[38;5;75m'
  C_MAGENTA='\033[38;5;176m'
  C_CYAN='\033[38;5;80m'
  C_WHITE='\033[38;5;255m'
  C_MUTED='\033[38;5;244m'
else
  C_RESET='' C_BOLD='' C_DIM='' C_RED='' C_GREEN=''
  C_YELLOW='' C_BLUE='' C_MAGENTA='' C_CYAN='' C_WHITE='' C_MUTED=''
fi

ui_clear() {
  if [[ -t 1 ]]; then
    printf "\033[H\033[2J"
  fi
}

ui_banner() {
  ui_clear
  printf "${C_CYAN}${C_BOLD}"
  cat << "EOF"
  ╭─────────────────────────────────────────────────────────────╮
  │   ✦  SOPHIA DEVKIT  —  DaVinci Notes Terminal Suite        │
  │      Fast · Local-First · Multi-Platform Desktop Engine     │
  ╰─────────────────────────────────────────────────────────────╯
EOF
  printf "${C_RESET}"
}

ui_section() {
  local title="$1"
  local icon="${2:-◆}"
  printf "\n  ${C_CYAN}${C_BOLD}╭─ %s %s${C_RESET}\n" "$icon" "$title"
}

ui_menu_item() {
  local key="$1"
  local icon="$2"
  local title="$3"
  local desc="${4:-}"
  if [[ -n "$desc" ]]; then
    printf "  ${C_CYAN}│${C_RESET}  ${C_BOLD}[ %s ]${C_RESET} %s  ${C_BOLD}%-24s${C_RESET} ${C_MUTED}%s${C_RESET}\n" "$key" "$icon" "$title" "$desc"
  else
    printf "  ${C_CYAN}│${C_RESET}  ${C_BOLD}[ %s ]${C_RESET} %s  ${C_BOLD}%s${C_RESET}\n" "$key" "$icon" "$title"
  fi
}

ui_section_end() {
  printf "  ${C_CYAN}╰─────────────────────────────────────────────────────────────${C_RESET}\n\n"
}

ui_info() {
  printf "  ${C_BLUE}ℹ${C_RESET} %s\n" "$1"
}

ui_success() {
  printf "  ${C_GREEN}✔${C_RESET} %s\n" "$1"
}

ui_warn() {
  printf "  ${C_YELLOW}▲${C_RESET} %s\n" "$1"
}

ui_error() {
  printf "  ${C_RED}✖${C_RESET} %s\n" "$1"
}

ui_pause() {
  local prompt="${1:-Press Enter to return to menu...}"
  printf "\n  ${C_MUTED}%s${C_RESET}" "$prompt"
  read -r _ || true
}

ui_open_url() {
  local url="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$url" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v start >/dev/null 2>&1; then
    start "$url" 2>/dev/null || true
  else
    ui_warn "Cannot open browser automatically. URL: $url"
    return 1
  fi
  ui_success "Opened link in default browser: $url"
}

ui_copy_clipboard() {
  local text="$1"
  local label="${2:-link}"
  if command -v pbcopy >/dev/null 2>&1; then
    printf "%s" "$text" | pbcopy
    ui_success "Copied $label to macOS clipboard!"
  elif command -v wl-copy >/dev/null 2>&1; then
    printf "%s" "$text" | wl-copy
    ui_success "Copied $label to Wayland clipboard!"
  elif command -v xclip >/dev/null 2>&1; then
    printf "%s" "$text" | xclip -selection clipboard
    ui_success "Copied $label to X11 clipboard!"
  elif command -v clip.exe >/dev/null 2>&1; then
    printf "%s" "$text" | clip.exe
    ui_success "Copied $label to Windows clipboard!"
  else
    ui_warn "Clipboard tool not detected. Here is the $label:"
    printf "  ${C_BOLD}%s${C_RESET}\n" "$text"
  fi
}
