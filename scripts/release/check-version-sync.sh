#!/usr/bin/env bash
set -euo pipefail

# Resolve repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# File paths
ROOT_PKG="${REPO_ROOT}/package.json"
DESKTOP_PKG="${REPO_ROOT}/apps/desktop/package.json"
TAURI_CONF="${REPO_ROOT}/apps/desktop/src-tauri/tauri.conf.json"
CARGO_TOML="${REPO_ROOT}/apps/desktop/src-tauri/Cargo.toml"
WEBSITE_PKG="${REPO_ROOT}/apps/website/package.json"
MOBILE_APP="${REPO_ROOT}/apps/mobile/app.json"

# Helper to extract JSON field using node
extract_json_val() {
  local file="$1"
  local expr="$2"
  node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('$file', 'utf8')); console.log($expr || '');"
}

# Helper to extract Cargo.toml package version
extract_cargo_version() {
  local file="$1"
  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$file', 'utf8');
    const match = content.match(/\[package\][^]*?version\s*=\s*\"([^\"]+)\"/);
    console.log(match ? match[1] : '');
  "
}

V_ROOT="$(extract_json_val "$ROOT_PKG" "data.version")"
V_DESKTOP="$(extract_json_val "$DESKTOP_PKG" "data.version")"
V_TAURI="$(extract_json_val "$TAURI_CONF" "data.version")"
V_CARGO="$(extract_cargo_version "$CARGO_TOML")"
V_WEBSITE="$(extract_json_val "$WEBSITE_PKG" "data.version")"
V_MOBILE="$(extract_json_val "$MOBILE_APP" "data.expo?.version")"

ERRORS=0

echo "Auditing manifest version synchronization..."
echo "  root package.json:                  ${V_ROOT}"
echo "  apps/desktop/package.json:          ${V_DESKTOP}"
echo "  apps/desktop/src-tauri/tauri.conf:  ${V_TAURI}"
echo "  apps/desktop/src-tauri/Cargo.toml:  ${V_CARGO}"
echo "  apps/website/package.json:          ${V_WEBSITE}"
echo "  apps/mobile/app.json:               ${V_MOBILE}"

BASELINE="${V_ROOT}"

if [[ -z "${BASELINE}" ]]; then
  echo "ERROR: Root package.json version is empty!" >&2
  ERRORS=$((ERRORS + 1))
fi

check_manifest() {
  local name="$1"
  local val="$2"
  if [[ "$val" != "$BASELINE" ]]; then
    echo "MISMATCH in $name: expected '$BASELINE', found '$val'" >&2
    ERRORS=$((ERRORS + 1))
  fi
}

check_manifest "apps/desktop/package.json" "$V_DESKTOP"
check_manifest "apps/desktop/src-tauri/tauri.conf.json" "$V_TAURI"
check_manifest "apps/desktop/src-tauri/Cargo.toml" "$V_CARGO"
check_manifest "apps/website/package.json" "$V_WEBSITE"
check_manifest "apps/mobile/app.json" "$V_MOBILE"

if [[ $ERRORS -gt 0 ]]; then
  echo "FAIL: Detected $ERRORS version mismatch(es) across manifests." >&2
  exit 1
fi

echo "[OK] All 6 manifests synchronized at v${BASELINE}"
exit 0
