#!/usr/bin/env bash
# =============================================================================
# scripts/release/release.sh — Release Orchestration Driver
# =============================================================================
# Orchestrates end-to-end version bump, release notes generation, commit,
# tagging, and pushing to trigger GitHub Actions release matrix.
#
# Usage:
#   release.sh [--dry-run] [--no-push] [--yes] [--preflight-only]
#              [--skip-preflight] [--notes-file <path>] [--allow-branch <branch>]
#              <patch|minor|major|X.Y.Z>
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DRY_RUN=false
NO_PUSH=false
AUTO_CONFIRM=false
PREFLIGHT_ONLY=false
SKIP_PREFLIGHT=false
CUSTOM_NOTES_FILE=""
ALLOWED_BRANCH="main"
BUMP_TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-push)
      NO_PUSH=true
      shift
      ;;
    --yes|-y)
      AUTO_CONFIRM=true
      shift
      ;;
    --preflight-only)
      PREFLIGHT_ONLY=true
      shift
      ;;
    --skip-preflight)
      SKIP_PREFLIGHT=true
      shift
      ;;
    --notes-file)
      CUSTOM_NOTES_FILE="$2"
      shift 2
      ;;
    --allow-branch)
      ALLOWED_BRANCH="$2"
      shift 2
      ;;
    -*)
      echo "ERROR: Unknown option: $1" >&2
      exit 1
      ;;
    *)
      if [[ -z "$BUMP_TARGET" ]]; then
        BUMP_TARGET="$1"
        shift
      else
        echo "ERROR: Unexpected argument: $1" >&2
        exit 1
      fi
      ;;
  esac
done

cd "$REPO_ROOT"

# Preflight execution
if [[ "$PREFLIGHT_ONLY" == "true" ]]; then
  bash "${SCRIPT_DIR}/preflight-release.sh" --allow-branch "$ALLOWED_BRANCH"
  exit 0
fi

if [[ -z "$BUMP_TARGET" ]]; then
  echo "Usage: $0 [--dry-run] [--no-push] [--yes] [--notes-file <f>] <patch|minor|major|X.Y.Z>" >&2
  exit 1
fi

echo "=== DaVinci Notes Release Orchestration ==="

# Step 1: Preflight Audit
if [[ "$SKIP_PREFLIGHT" == "false" ]]; then
  echo "Step 1: Running preflight release audit..."
  bash "${SCRIPT_DIR}/preflight-release.sh" --allow-branch "$ALLOWED_BRANCH" --skip-tests
fi

# Step 2: Dry Run simulation
if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Simulating bump for target: $BUMP_TARGET"
  bash "${SCRIPT_DIR}/bump-version.sh" --dry-run "$BUMP_TARGET"
  echo "[DRY-RUN] Simulating changelog generation..."
  bash "${SCRIPT_DIR}/generate-changelog.sh"
  echo "[DRY-RUN] Orchestration dry-run passed cleanly."
  exit 0
fi

# Step 3: Perform live bump across all 6 manifests
echo "Step 2: Bumping version across 6 manifests..."
bash "${SCRIPT_DIR}/bump-version.sh" "$BUMP_TARGET"

NEW_VERSION="$(node -e "const pkg=require('./package.json'); console.log(pkg.version);")"
TAG_NAME="v${NEW_VERSION}"

# Step 4: Prepare release notes
echo "Step 3: Preparing release notes for ${TAG_NAME}..."
NOTES_FILE="${REPO_ROOT}/RELEASE_NOTES_TMP.md"
if [[ -n "$CUSTOM_NOTES_FILE" && -f "$CUSTOM_NOTES_FILE" ]]; then
  cp "$CUSTOM_NOTES_FILE" "$NOTES_FILE"
  echo "Using custom release notes from ${CUSTOM_NOTES_FILE}"
else
  bash "${SCRIPT_DIR}/generate-changelog.sh" --out "$NOTES_FILE"
  echo "Generated release notes written to ${NOTES_FILE}"
fi

# Step 5: Commit manifest changes
echo "Step 4: Committing release manifests..."
git add package.json apps/desktop/package.json apps/desktop/src-tauri/tauri.conf.json \
  apps/desktop/src-tauri/Cargo.toml apps/website/package.json apps/mobile/app.json
if ! git diff --cached --quiet; then
  git commit --no-verify -m "chore(release): ${TAG_NAME}"
else
  echo "Manifests already match ${NEW_VERSION}, skipping empty commit."
fi

# Step 6: Create annotated tag
echo "Step 5: Creating annotated git tag ${TAG_NAME}..."
git tag -a "${TAG_NAME}" -F "$NOTES_FILE"
rm -f "$NOTES_FILE"

echo "=== Release ${TAG_NAME} prepared successfully! ==="

if [[ "$NO_PUSH" == "true" ]]; then
  echo "Notice: --no-push was specified. Tag created locally."
  echo "To trigger CI release pipeline, run:"
  echo "  git push origin HEAD && git push origin ${TAG_NAME}"
  exit 0
fi

DO_PUSH=false
if [[ "$AUTO_CONFIRM" == "true" ]]; then
  DO_PUSH=true
else
  read -r -p "Push release commit and tag ${TAG_NAME} to remote origin? (y/N): " CONFIRM
  if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    DO_PUSH=true
  fi
fi

if [[ "$DO_PUSH" == "true" ]]; then
  echo "Pushing release commit and tag..."
  git push origin HEAD
  git push origin "${TAG_NAME}"
  echo "Done! Release build matrix triggered in GitHub Actions."
else
  echo "Push skipped. Push manually when ready:"
  echo "  git push origin HEAD && git push origin ${TAG_NAME}"
fi
