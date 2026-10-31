#!/usr/bin/env bash
# install.sh — 1-Line Free Installer for DaVinci Notes (Sophia)
# Usage: curl -fsSL https://sophia-notes.pages.dev/install.sh | bash
set -euo pipefail

REPO="AhmedWanneni/davinci-notes-workspace"
VERSION="0.3.0"
APP_NAME="Sophia"

echo "=== Installing DaVinci Notes (${APP_NAME}) v${VERSION} ==="

OS="$(uname -s)"
ARCH="$(uname -m)"

if [[ "$OS" == "Darwin" ]]; then
  echo "Detected macOS (${ARCH})..."

  if [[ "$ARCH" == "arm64" ]]; then
    DMG_NAME="Sophia_${VERSION}_aarch64.dmg"
  else
    DMG_NAME="Sophia_${VERSION}_x64.dmg"
  fi

  URL="https://github.com/${REPO}/releases/download/v${VERSION}/${DMG_NAME}"
  TMP_DMG="/tmp/${DMG_NAME}"
  MOUNT_DIR="/tmp/sophia_mount_$$"

  echo "Step 1/4: Downloading ${DMG_NAME}..."
  curl -fSL --progress-bar "$URL" -o "$TMP_DMG"

  echo "Step 2/4: Mounting disk image..."
  mkdir -p "$MOUNT_DIR"
  hdiutil attach "$TMP_DMG" -mountpoint "$MOUNT_DIR" -nobrowse -quiet

  echo "Step 3/4: Installing to /Applications..."
  rm -rf "/Applications/${APP_NAME}.app"
  cp -R "${MOUNT_DIR}/${APP_NAME}.app" /Applications/

  echo "Step 4/4: Clearing Gatekeeper quarantine flags..."
  xattr -cr "/Applications/${APP_NAME}.app" 2>/dev/null || true
  codesign --force --deep --sign - "/Applications/${APP_NAME}.app" 2>/dev/null || true

  hdiutil detach "$MOUNT_DIR" -quiet || true
  rm -rf "$MOUNT_DIR" "$TMP_DMG"

  echo ""
  echo "✔ Successfully installed to /Applications/${APP_NAME}.app!"
  echo "🚀 Launching Sophia..."
  open "/Applications/${APP_NAME}.app"

elif [[ "$OS" == "Linux" ]]; then
  echo "Detected Linux (${ARCH})..."
  APPIMAGE="sophia_${VERSION}_amd64.AppImage"
  URL="https://github.com/${REPO}/releases/download/v${VERSION}/${APPIMAGE}"
  DEST_DIR="$HOME/.local/bin"
  mkdir -p "$DEST_DIR"

  echo "Downloading ${APPIMAGE} to ${DEST_DIR}..."
  curl -fSL --progress-bar "$URL" -o "${DEST_DIR}/sophia"
  chmod +x "${DEST_DIR}/sophia"

  echo "✔ Successfully installed to ${DEST_DIR}/sophia!"
  echo "You can now run 'sophia' from your terminal."
else
  echo "Unsupported OS: $OS. Please download manually from https://sophia-notes.pages.dev/download"
  exit 1
fi
