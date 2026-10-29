#!/usr/bin/env bash
set -euo pipefail

TAG_NAME=""
DRY_RUN=false
DELETE_REMOTE_TAG=false

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --delete-remote-tag)
      DELETE_REMOTE_TAG=true
      ;;
    -*)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
    *)
      if [[ -z "$TAG_NAME" ]]; then
        TAG_NAME="$arg"
      else
        echo "Unexpected argument: $arg" >&2
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TAG_NAME" ]]; then
  echo "Usage: $0 [--dry-run] [--delete-remote-tag] <tag-to-rollback (e.g. v0.2.0)>" >&2
  exit 1
fi

echo "=== Emergency Release Rollback for ${TAG_NAME} ==="

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Would execute:"
  echo "  1. gh release delete '${TAG_NAME}' --yes"
  echo "  2. git tag -d '${TAG_NAME}'"
  if [[ "$DELETE_REMOTE_TAG" == "true" ]]; then
    echo "  3. git push origin --delete '${TAG_NAME}'"
  fi
  exit 0
fi

# 1. Delete GitHub Release if gh CLI is available
if command -v gh >/dev/null 2>&1; then
  echo "Step 1: Deleting remote GitHub Release for ${TAG_NAME}..."
  gh release delete "${TAG_NAME}" --yes || echo "Warning: GitHub release '${TAG_NAME}' not found or already deleted."
else
  echo "Warning: 'gh' CLI not found. Please delete the release manually in GitHub Releases UI."
fi

# 2. Delete local git tag
if git rev-parse "${TAG_NAME}" >/dev/null 2>&1; then
  echo "Step 2: Deleting local git tag ${TAG_NAME}..."
  git tag -d "${TAG_NAME}"
fi

# 3. Delete remote git tag if requested
if [[ "$DELETE_REMOTE_TAG" == "true" ]]; then
  echo "Step 3: Deleting remote tag ${TAG_NAME} from origin..."
  git push origin --delete "${TAG_NAME}" || echo "Warning: Remote tag deletion failed or tag does not exist."
fi

echo "[OK] Emergency rollback complete for ${TAG_NAME}."
