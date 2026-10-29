# ADR-0249: Universal Agent Release Skill Architecture and Two-Stage Human Approval Gating

## Context

Cutting a release of DaVinci Notes requires coordinating multiple subsystems:
1. Validating repository cleanliness and manifest synchronization across 6 files.
2. Deriving appropriate SemVer increments and structuring user-facing changelogs.
3. Managing git tags, triggering the parallel GitHub Actions CI matrix, and awaiting compilation across 4 runner targets.
4. Verifying cryptographic checksums and installer integrity.
5. Rebuilding and deploying the static website to show the new latest release without manual edits.

Having maintainers manually run multiple bash scripts or perform website edits introduces human error and cognitive load. Conversely, granting an AI coding agent full autonomous authority to publish releases to the public creates safety and supply-chain risks.

## Decision

1. **Hub-and-Spoke Universal Skill Architecture**:
   - Establish `docs/releasing.md` and `scripts/release/` as the single source of truth.
   - Author thin agent adapters for Claude Code (`.claude/skills/create-release/SKILL.md`), Cursor (`.cursor/rules/release.mdc`), GitHub Copilot (`.github/copilot-instructions.md`), and Antigravity (`.agents/workflows/create-release.md`).
   - Agent judgment is strictly scoped to version bump proposal and changelog styling; all execution actions route through idempotent Bash scripts.
2. **Deterministic Preflight Verification Gate**:
   - The agent must execute `scripts/release/preflight-release.sh` before modifying any files or creating git commits.
   - Enforces clean working trees, branch alignment, manifest parity, and passing typecheck/tests.
3. **Mandatory Two-Stage Human Approval Gates**:
   - **Human Gate 1 (Version & Notes Approval)**: The agent proposes the SemVer bump and displays the categorized release notes. The agent must halt and wait for explicit maintainer confirmation before tagging or pushing.
   - **Human Gate 2 (Publish Confirmation)**: After the CI build matrix completes, `wait-and-verify-release.sh` validates that all 6 platform binaries and `SHA256SUMS.txt` are attached to the Draft Release. The agent presents the summary and must halt for explicit maintainer confirmation before executing `gh release edit <tag> --draft=false`.
4. **Automated Static Website Rebuild Trigger**:
   - An automated GitHub Actions workflow (`.github/workflows/deploy-website.yml`) triggers on `release: [published]`.
   - The Astro static site is rebuilt with `prerelease: false` filtering for `/download`, ensuring beta releases are isolated to `/download/beta` and the stable download CTA updates automatically with zero manual commits.
5. **Idempotent Emergency Rollback**:
   - If an error occurs or the maintainer cancels at Gate 2, `scripts/release/rollback.sh` retracts draft releases, deletes local and remote tags, and reverts version bump commits.

## Consequences

- Any AI coding assistant can execute a full, safe release flow from conversational prompts.
- Zero risk of unreviewed public releases or accidental pre-release contamination on the stable download page.
- Complete adherence to the lightweight, zero-backend, and deterministic tooling principles.
