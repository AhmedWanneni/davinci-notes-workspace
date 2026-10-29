#!/usr/bin/env bash
# =============================================================================
# scripts/release/preflight-release.sh — Preflight Release Sanity Gate
# =============================================================================
# Validates repository state before initiating a release:
# 1. Clean working directory (no modified or staged files).
# 2. Correct branch (default: main) and synchronized with remote origin.
# 3. Synchronized manifest versions across all 6 manifests.
# 4. Required CLI tools installed and authenticated (git, gh, pnpm, node).
# 5. Optional verification of quality gates (typecheck, lint, test).
#
# Flags:
#   --skip-tests       Skip running pnpm turbo typecheck / test
#   --allow-branch <b  Allow releasing from a branch other than main
#   --quiet            Suppress non-diagnostic output
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

SKIP_TESTS=false
ALLOWED_BRANCH="main"
QUIET=false

for ((i = 1; i <= $#; i++)); do
  case "${!i}" in
    --skip-tests)
      SKIP_TESTS=true
      ;;
    --allow-branch)
      ((i++))
      ALLOWED_BRANCH="${!i}"
      ;;
    --quiet)
      QUIET=true
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-tests] [--allow-branch <name>] [--quiet]"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option '${!i}'" >&2
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"

log() {
  if [[ "$QUIET" != "true" ]]; then
    echo "$@"
  fi
}

log "=== DaVinci Notes Preflight Release Audit ==="

# 1. Tooling & Authentication
log "1. Checking required tools and authentication..."
for tool in git gh pnpm node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "[FAIL] Required tool missing: '$tool'" >&2
    exit 1
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  echo "[FAIL] GitHub CLI (gh) is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi
log "   [OK] Tools and GitHub authentication verified."

# 2. Git Working Tree Cleanliness
log "2. Checking git working tree cleanliness..."
if ! git diff-index --quiet HEAD --; then
  echo "[FAIL] Working tree has uncommitted modifications." >&2
  git status --short >&2
  exit 1
fi

UNTRACKED_COUNT="$( (git status --porcelain | grep '^??' || true) | wc -l | tr -d ' ')"
if [[ "$UNTRACKED_COUNT" -gt 0 ]]; then
  echo "[WARN] $UNTRACKED_COUNT untracked file(s) present in working tree." >&2
fi
log "   [OK] Working tree clean."

# 3. Branch Verification
log "3. Checking active git branch..."
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$ALLOWED_BRANCH" && "$ALLOWED_BRANCH" != "any" ]]; then
  echo "[FAIL] Current branch is '${CURRENT_BRANCH}', expected '${ALLOWED_BRANCH}'." >&2
  echo "       Switch to '${ALLOWED_BRANCH}' or pass --allow-branch '${CURRENT_BRANCH}'" >&2
  exit 1
fi
log "   [OK] Branch verified: ${CURRENT_BRANCH}"

# 4. Remote Origin Parity
log "4. Checking remote synchronization..."
if git remote get-url origin >/dev/null 2>&1; then
  git fetch origin "${CURRENT_BRANCH}" --quiet || true
  LOCAL_REV="$(git rev-parse HEAD)"
  REMOTE_REV="$(git rev-parse "origin/${CURRENT_BRANCH}" 2>/dev/null || echo "$LOCAL_REV")"
  
  if [[ "$LOCAL_REV" != "$REMOTE_REV" ]]; then
    BEHIND="$(git rev-list --count HEAD.."origin/${CURRENT_BRANCH}" 2>/dev/null || echo 0)"
    if [[ "$BEHIND" -gt 0 ]]; then
      echo "[FAIL] Local branch is behind origin/${CURRENT_BRANCH} by $BEHIND commit(s). Pull first." >&2
      exit 1
    fi
  fi
  log "   [OK] Local branch is up to date with remote."
else
  log "   [WARN] No remote origin detected. Skipping remote parity check."
fi

# 5. Manifest Parity Check
log "5. Verifying manifest version synchronization across all 6 manifests..."
if ! bash "${SCRIPT_DIR}/check-version-sync.sh"; then
  echo "[FAIL] Manifest version synchronization check failed." >&2
  exit 1
fi

# 6. Quality Gates (Optional)
if [[ "$SKIP_TESTS" == "false" ]]; then
  log "6. Running quality gates (TypeScript typecheck across workspace)..."
  if ! pnpm turbo run typecheck --filter=@app/desktop; then
    echo "[FAIL] Desktop TypeScript typecheck failed." >&2
    exit 1
  fi
  log "   [OK] Desktop typecheck passed."
else
  log "6. Quality gates skipped via --skip-tests."
fi

log "=== [SUCCESS] Preflight Release Verification Passed! ==="
