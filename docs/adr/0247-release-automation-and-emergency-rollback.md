# ADR-0247: Release Automation Harness, Idempotency and Emergency Rollback Protocol

## Context

Cutting desktop application releases involves complex multi-step state changes:
1. Manifest version synchronization across 6 distinct files.
2. Conventional commit log parsing and release note curation.
3. Pre-flight test validation and git tag creation.
4. Handling poisoned or breaking releases if a critical bug slips past QA into production.

Manual execution of these steps risks human error, forgotten manifest files, malformed SemVer strings, or botched git tags.

## Decision

1. **Maintainer Automation Driver (`scripts/release/release.sh`)**:
   - Provide an interactive, idempotent CLI driver in Bash with `set -euo pipefail` and full `--dry-run` support.
   - Enforce working-tree cleanliness before executing any mutating file operations.
   - Automatically execute `bump-version.sh`, verify parity via `check-version-sync.sh`, generate categorized notes via `generate-changelog.sh`, commit `chore(release): vX.Y.Z`, tag with curated notes, and prompt before pushing to origin.
2. **Emergency Rollback Harness (`scripts/release/rollback.sh`)**:
   - Provide a zero-delay rollback script capable of unpublishing draft releases, deleting remote and local git tags, and swapping updater metadata (`latest.json`) with known-good snapshots.
3. **Comprehensive Runbook (`docs/releasing.md`)**:
   - Author a complete maintainer runbook documenting the standard workflow, hotfix branching strategy, first-time certificate setup, and Gatekeeper troubleshooting.

## Consequences

- Consistent, zero-friction release experience for project maintainers.
- Complete auditability and reproducibility from local developer terminals to CI runners.
- Deterministic emergency rollback capability mitigating catastrophic release incidents.
