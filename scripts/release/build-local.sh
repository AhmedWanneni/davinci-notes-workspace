#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BUILD_MODE="debug"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --release)
      BUILD_MODE="release"
      ;;
    --debug)
      BUILD_MODE="debug"
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [--debug|--release] [--dry-run]" >&2
      exit 1
      ;;
  esac
done

echo "=== DaVinci Notes Local Desktop Smoke Build (${BUILD_MODE}) ==="

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Would execute:"
  echo "  1. bash scripts/release/check-version-sync.sh"
  echo "  2. pnpm --filter @app/desktop prepare:emoji-data"
  echo "  3. pnpm --filter @app/desktop prepare:syncthing"
  echo "  4. pnpm --filter @app/desktop build:web"
  echo "  5. cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml"
  exit 0
fi

cd "$REPO_ROOT"

echo "Step 1: Auditing manifest version sync..."
bash "${SCRIPT_DIR}/check-version-sync.sh"

echo "Step 2: Preparing emoji dataset..."
pnpm --filter @app/desktop prepare:emoji-data

echo "Step 3: Preparing Syncthing binary for host..."
pnpm --filter @app/desktop prepare:syncthing

echo "Step 4: Building frontend web assets..."
pnpm --filter @app/desktop build:web

echo "Step 5: Compiling desktop Rust backend (${BUILD_MODE})..."
if [[ "$BUILD_MODE" == "release" ]]; then
  cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml --release
else
  cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
fi

echo "[OK] Local smoke build validation complete!"
