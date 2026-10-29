#!/usr/bin/env bash
# =============================================================================
# scripts/release/rollback.sh — Emergency Release Rollback Harness
# =============================================================================
# Reverts a failed or aborted release:
# 1. Deletes the remote GitHub Release (draft or published).
# 2. Deletes the local git tag.
# 3. Deletes the remote git tag on origin.
# 4. Optionally reverts the 'chore(release): vX.Y.Z' commit.
#
# Usage:
#   rollback.sh [--dry-run] [--delete-remote-tag] [--revert-commit] [--all]
#               <tag_name (e.g. v0.2.0)>
# =============================================================================

set -euo pipefail

TAG_NAME=""
DRY_RUN=false
DELETE_REMOTE_TAG=false
REVERT_COMMIT=false

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --delete-remote-tag)
      DELETE_REMOTE_TAG=true
      ;;
    --revert-commit)
      REVERT_COMMIT=true
      ;;
    --all)
      DELETE_REMOTE_TAG=true
      REVERT_COMMIT=true
      ;;
    -*)
      echo "ERROR: Unknown option: $arg" >&2
      exit 1
      ;;
    *)
      if [[ -z "$TAG_NAME" ]]; then
        TAG_NAME="$arg"
      else
        echo "ERROR: Unexpected argument: $arg" >&2
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TAG_NAME" ]]; then
  echo "Usage: $0 [--dry-run] [--delete-remote-tag] [--revert-commit] [--all] <tag_name>" >&2
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
  if [[ "$REVERT_COMMIT" == "true" ]]; then
    echo "  4. git revert HEAD (if HEAD is 'chore(release): ${TAG_NAME}')"
  fi
  exit 0
fi

# 1. Delete GitHub Release via gh CLI
if command -v gh >/dev/null 2>&1; then
  echo "Step 1: Deleting remote GitHub Release for ${TAG_NAME}..."
  gh release delete "${TAG_NAME}" --yes || echo "Notice: GitHub release '${TAG_NAME}' not found or already deleted."
else
  echo "Warning: 'gh' CLI not found. Please delete the release manually in GitHub Releases UI."
fi

# 2. Delete local git tag
if git rev-parse "${TAG_NAME}" >/dev/null 2>&1; then
  echo "Step 2: Deleting local git tag ${TAG_NAME}..."
  git tag -d "${TAG_NAME}"
fi

# 3. Delete remote git tag
if [[ "$DELETE_REMOTE_TAG" == "true" ]]; then
  echo "Step 3: Deleting remote tag ${TAG_NAME} from origin..."
  git push origin --delete "${TAG_NAME}" || echo "Notice: Remote tag '${TAG_NAME}' does not exist on origin."
fi

# 4. Revert release commit if HEAD matches
if [[ "$REVERT_COMMIT" == "true" ]]; then
  HEAD_MSG="$(git log -1 --pretty=%B)"
  if [[ "$HEAD_MSG" == *"chore(release): ${TAG_NAME}"* ]]; then
    echo "Step 4: Reverting release commit..."
    git revert HEAD --no-edit
    echo "Release commit reverted successfully."
  fi
fi

echo "=== [OK] Emergency Rollback Complete for ${TAG_NAME} ==="
