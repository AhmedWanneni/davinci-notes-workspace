#!/usr/bin/env bash
# deploy-cloudflare.sh — Standalone Cloudflare deployment runner for DaVinci Notes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source TUI utilities
source "${SCRIPT_DIR}/tui/ui.sh"
source "${SCRIPT_DIR}/tui/status.sh"
source "${SCRIPT_DIR}/tui/cloudflare.sh"

# Automatically load .env if present
if [[ -f "${REPO_ROOT}/.env" ]]; then
  while IFS='=' read -r key val || [[ -n "$key" ]]; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    key="$(echo "$key" | tr -d '\r ')"
    val="$(echo "$val" | tr -d '\r"' | sed "s/^'//;s/'$//")"
    if [[ -z "${!key:-}" && -n "$key" ]]; then
      export "$key"="$val"
    fi
  done < "${REPO_ROOT}/.env"
fi

# CLI flag handling
if [[ $# -gt 0 ]]; then
  case "$1" in
    --deploy|-d)
      cloudflare_deploy_flow "$REPO_ROOT" "sophia-notes"
      exit 0
      ;;
    --login|-l)
      wrangler login
      exit 0
      ;;
    --open|-o)
      cloudflare_open_connect_github
      exit 0
      ;;
    --help|-h)
      printf "DaVinci Notes — Cloudflare Deployment CLI\n\n"
      printf "Usage: %s [OPTION]\n\n" "$0"
      printf "Options:\n"
      printf "  -d, --deploy   Directly build and deploy website to Cloudflare Pages\n"
      printf "  -l, --login    Log in to Cloudflare using wrangler CLI\n"
      printf "  -o, --open     Open Cloudflare Pages GitHub connection in browser\n"
      printf "  -h, --help     Show this help message\n"
      exit 0
      ;;
  esac
fi

# Launch interactive Cloudflare TUI
cloudflare_menu "$REPO_ROOT"
