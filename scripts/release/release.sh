#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DRY_RUN=false
NO_PUSH=false
BUMP_TARGET=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --no-push)
      NO_PUSH=true
      ;;
    -*)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
    *)
      if [[ -z "$BUMP_TARGET" ]]; then
        BUMP_TARGET="$arg"
      else
        echo "Unexpected argument: $arg" >&2
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$BUMP_TARGET" ]]; then
  echo "Usage: $0 [--dry-run] [--no-push] <patch|minor|major|X.Y.Z>" >&2
  exit 1
fi

cd "$REPO_ROOT"

echo "=== DaVinci Notes Release Orchestration ==="

# 1. Guard against dirty working tree
if ! git diff-index --quiet HEAD --; then
  echo "ERROR: Working tree has uncommitted modifications. Please commit or stash before releasing." >&2
  git status --short
  exit 1
fi

# 2. Check manifest version synchronization
echo "Step 1: Auditing baseline manifest versions..."
bash "${SCRIPT_DIR}/check-version-sync.sh"

# 3. Simulate or execute bump
if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Simulating bump for target: $BUMP_TARGET"
  bash "${SCRIPT_DIR}/bump-version.sh" --dry-run "$BUMP_TARGET"
  echo "[DRY-RUN] Simulating changelog generation..."
  bash "${SCRIPT_DIR}/generate-changelog.sh"
  echo "[DRY-RUN] Orchestration dry-run passed cleanly."
  exit 0
fi

# 4. Perform live bump across all 6 manifests
echo "Step 2: Bumping version across manifests..."
bash "${SCRIPT_DIR}/bump-version.sh" "$BUMP_TARGET"

# Read synchronized new version
NEW_VERSION="$(node -e "const pkg=require('./package.json'); console.log(pkg.version);")"
TAG_NAME="v${NEW_VERSION}"

# 5. Generate release notes
echo "Step 3: Generating release notes..."
NOTES_FILE="${REPO_ROOT}/RELEASE_NOTES_TMP.md"
bash "${SCRIPT_DIR}/generate-changelog.sh" --out "$NOTES_FILE"
echo "Release notes written to ${NOTES_FILE} for review."

# 6. Commit release bump
echo "Step 4: Creating release commit..."
git add package.json apps/desktop/package.json apps/desktop/src-tauri/tauri.conf.json \
  apps/desktop/src-tauri/Cargo.toml apps/website/package.json apps/mobile/app.json
git commit -m "chore(release): ${TAG_NAME}"

# 7. Create annotated tag
echo "Step 5: Tagging release ${TAG_NAME}..."
git tag -a "${TAG_NAME}" -F "$NOTES_FILE"
rm -f "$NOTES_FILE"

echo "=== Release ${TAG_NAME} prepared successfully! ==="

if [[ "$NO_PUSH" == "true" ]]; then
  echo "Notice: --no-push was specified. Tag created locally."
  echo "To trigger CI release pipeline, run:"
  echo "  git push origin HEAD && git push origin ${TAG_NAME}"
  exit 0
fi

read -r -p "Push release commit and tag ${TAG_NAME} to remote origin? (y/N): " CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Pushing release commit and tag..."
  git push origin HEAD
  git push origin "${TAG_NAME}"
  echo "Done! Release build matrix triggered in GitHub Actions."
else
  echo "Push skipped. Push manually when ready:"
  echo "  git push origin HEAD && git push origin ${TAG_NAME}"
fi
