#!/usr/bin/env bash
# =============================================================================
# scripts/release/wait-and-verify-release.sh — CI Watcher & Artifact Verifier
# =============================================================================
# Monitors GitHub Actions build matrix for a release tag, verifies draft release
# creation, and asserts that all 6 required platform binaries and checksums
# are properly attached.
#
# Usage:
#   wait-and-verify-release.sh [--timeout <minutes>] [--interval <seconds>]
#                              [--dry-run] <tag_name>
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

TIMEOUT_MINUTES=25
INTERVAL_SECONDS=15
DRY_RUN=false
TAG_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      TIMEOUT_MINUTES="$2"
      shift 2
      ;;
    --interval)
      INTERVAL_SECONDS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -*)
      echo "ERROR: Unknown option '$1'" >&2
      exit 1
      ;;
    *)
      if [[ -z "$TAG_NAME" ]]; then
        TAG_NAME="$1"
        shift
      else
        echo "ERROR: Unexpected argument '$1'" >&2
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TAG_NAME" ]]; then
  echo "Usage: $0 [--timeout <min>] [--interval <sec>] [--dry-run] <tag_name>" >&2
  exit 1
fi

cd "$REPO_ROOT"

echo "=== Monitoring CI & Verifying Draft Release for ${TAG_NAME} ==="

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Simulating CI watch and artifact verification for ${TAG_NAME}."
  echo "  ✓ macOS Apple Silicon DMG (Sophia_${TAG_NAME}_aarch64.dmg)"
  echo "  ✓ macOS Intel DMG (Sophia_${TAG_NAME}_x64.dmg)"
  echo "  ✓ Windows x64 Installer (Sophia_${TAG_NAME}_x64-setup.exe)"
  echo "  ✓ Linux AppImage (sophia_${TAG_NAME}_amd64.AppImage)"
  echo "  ✓ Linux Debian package (sophia_${TAG_NAME}_amd64.deb)"
  echo "  ✓ SHA256SUMS.txt"
  echo "[DRY-RUN] All 6 artifacts simulated successfully."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI 'gh' is required." >&2
  exit 1
fi

START_TIME=$(date +%s)
DEADLINE=$((START_TIME + (TIMEOUT_MINUTES * 60)))

echo "Watching for GitHub Release '${TAG_NAME}' (timeout: ${TIMEOUT_MINUTES}m)..."

FOUND_ALL=false
while [[ $(date +%s) -lt $DEADLINE ]]; do
  # Check if release exists
  if RELEASE_JSON="$(gh release view "$TAG_NAME" --json isDraft,assets,tagName 2>/dev/null)"; then
    ASSET_NAMES="$(echo "$RELEASE_JSON" | node -e '
      const fs = require("fs");
      const data = JSON.parse(fs.readFileSync(0, "utf-8"));
      const names = (data.assets || []).map(a => a.name);
      console.log(names.join("\n"));
    ')"

    HAS_MAC_ARM=false
    HAS_MAC_X64=false
    HAS_WIN=false
    HAS_APPIMAGE=false
    HAS_DEB=false
    HAS_CHECKSUMS=false

    while IFS= read -r asset; do
      [[ -z "$asset" ]] && continue
      if [[ "$asset" == *"aarch64.dmg" ]]; then HAS_MAC_ARM=true; fi
      if [[ "$asset" == *"x64.dmg" ]]; then HAS_MAC_X64=true; fi
      if [[ "$asset" == *"setup.exe"* || "$asset" == *".exe" ]]; then HAS_WIN=true; fi
      if [[ "$asset" == *".AppImage" ]]; then HAS_APPIMAGE=true; fi
      if [[ "$asset" == *".deb" ]]; then HAS_DEB=true; fi
      if [[ "$asset" == "SHA256SUMS.txt" ]]; then HAS_CHECKSUMS=true; fi
    done <<< "$ASSET_NAMES"

    ATTACHED_COUNT=0
    [[ "$HAS_MAC_ARM" == "true" ]] && ATTACHED_COUNT=$((ATTACHED_COUNT + 1))
    [[ "$HAS_MAC_X64" == "true" ]] && ATTACHED_COUNT=$((ATTACHED_COUNT + 1))
    [[ "$HAS_WIN" == "true" ]] && ATTACHED_COUNT=$((ATTACHED_COUNT + 1))
    [[ "$HAS_APPIMAGE" == "true" ]] && ATTACHED_COUNT=$((ATTACHED_COUNT + 1))
    [[ "$HAS_DEB" == "true" ]] && ATTACHED_COUNT=$((ATTACHED_COUNT + 1))
    [[ "$HAS_CHECKSUMS" == "true" ]] && ATTACHED_COUNT=$((ATTACHED_COUNT + 1))

    echo "  Progress: ${ATTACHED_COUNT}/6 required assets uploaded to draft release..."

    if [[ "$ATTACHED_COUNT" -eq 6 ]]; then
      FOUND_ALL=true
      break
    fi
  else
    echo "  Draft release '${TAG_NAME}' not yet created by CI runner, waiting..."
  fi

  sleep "$INTERVAL_SECONDS"
done

if [[ "$FOUND_ALL" != "true" ]]; then
  echo "ERROR: Timed out waiting for complete release assets for ${TAG_NAME}." >&2
  echo "Please inspect GitHub Actions runs at:" >&2
  echo "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions" >&2
  exit 1
fi

echo ""
echo "=== [SUCCESS] Verified All 6 Release Assets for ${TAG_NAME}! ==="
echo "  ✓ macOS Apple Silicon DMG (aarch64)"
echo "  ✓ macOS Intel DMG (x64)"
echo "  ✓ Windows x64 Installer (.exe)"
echo "  ✓ Linux AppImage (.AppImage)"
echo "  ✓ Linux Debian package (.deb)"
echo "  ✓ SHA256SUMS.txt"
echo "Draft Release is complete and ready for maintainer sign-off."
