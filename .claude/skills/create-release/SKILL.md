---
name: create-release
description: Cut a desktop and website release of DaVinci Notes / Sophia (stable or beta) with version bumping, preflight checks, CI build monitoring, two-stage human approval gates, and static website auto-update. Triggers on "create a release", "cut a release", "ship a beta", or "hotfix release".
---

# Create a Release — Agent Skill

This skill guides the AI assistant in orchestrating a complete release of DaVinci Notes / Sophia across desktop platforms (macOS Apple Silicon & Intel, Windows x64, Linux AppImage/deb) and the static download website.

> [!IMPORTANT]
> **Single Source of Truth**: All procedural release logic lives in [`docs/releasing.md`](../../../docs/releasing.md) and [`scripts/release/`](../../../scripts/release/). This skill is a thin, deterministic orchestrator: AI judgment handles version proposals and release notes formatting; all execution actions route through idempotent Bash scripts.

---

## 1. Trigger Phrases & Variants

This skill activates when the user prompts:
- `"create a release"` / `"cut a release"`
- `"ship a beta"` / `"create a beta release"`
- `"create a patch release"` / `"create a minor release"` / `"create a major release"`
- `"hotfix release"`

---

## 2. Step-by-Step Execution Workflow

### Step 1: Preflight Sanity Verification (Fail Fast)
Run the preflight verification script before proposing or modifying anything:
```bash
bash scripts/release/preflight-release.sh
```
If this script fails (dirty working tree, out-of-sync manifests, uncommitted changes, or failing typecheck), **stop immediately**, report the exact diagnostic error, and do not proceed.

### Step 2: Version Proposal & Release Notes Generation
1. Determine the latest git tag:
   ```bash
   git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"
   ```
2. Inspect the commits since that tag:
   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```
3. Apply the SemVer proposal heuristic:
   - Contains `BREAKING CHANGE:` or `!:` → **Major** bump (`X+1.0.0`)
   - Contains `feat:` or `feat(...):` → **Minor** bump (`X.Y+1.0`)
   - Contains `fix:` or `perf:` → **Patch** bump (`X.Y.Z+1`)
   - User requested beta/pre-release → `vX.Y.Z-beta.1` (or increment existing beta suffix)
4. Generate release notes:
   ```bash
   bash scripts/release/generate-changelog.sh --out ./RELEASE_NOTES_DRAFT.md
   ```
5. Apply editorial judgment: Ensure release notes are grouped under user-facing headings (🚀 Features, 🐛 Bug Fixes, ⚡ Performance, ⚠️ Breaking Changes), rephrasing technical titles into clear user value statements.

### Step 3: Human Gate 1 (Version & Changelog Approval)
Present the proposed version and formatted release notes to the user:
```text
Proposed Version: <vX.Y.Z> (<type> increment due to <reason>)

Draft Release Notes:
<Formatted Notes>

[HUMAN GATE 1]: Do you approve version <vX.Y.Z> and these release notes? (yes / edit / cancel)
```
**HALT EXECUTION**: Do NOT tag, commit, or push until the user explicitly confirms approval.

### Step 4: Version Bump, Tag, and Push
Once approved, execute the release orchestrator:
```bash
bash scripts/release/release.sh --yes --notes-file ./RELEASE_NOTES_DRAFT.md <version>
rm -f ./RELEASE_NOTES_DRAFT.md
```
This updates all 6 manifests in parity, commits `chore(release): vX.Y.Z`, tags `vX.Y.Z`, and pushes to GitHub to trigger `.github/workflows/release.yml`.

### Step 5: Monitor CI Build Matrix & Verify Artifacts
Monitor the GitHub Actions release workflow until all matrix jobs complete:
```bash
bash scripts/release/wait-and-verify-release.sh <tag>
```
The script validates that all 6 required assets are attached to the Draft Release:
- macOS Apple Silicon DMG (`Sophia_<version>_aarch64.dmg`)
- macOS Intel DMG (`Sophia_<version>_x64.dmg`)
- Windows x64 Installer (`Sophia_<version>_x64-setup.exe`)
- Linux AppImage (`sophia_<version>_amd64.AppImage`)
- Linux Debian Package (`sophia_<version>_amd64.deb`)
- Checksums Manifest (`SHA256SUMS.txt`)

If any job fails or an artifact is missing, report the failure and ask if the user wants to run the rollback procedure.

### Step 6: Human Gate 2 (Publish Confirmation)
Present the verified artifact summary and draft release URL to the user:
```text
All 6 installer binaries and SHA256SUMS.txt compiled and verified!
Draft Release: https://github.com/<owner>/<repo>/releases/tag/<tag>

[HUMAN GATE 2]: Ready to publish this release to the public and update the website download page? (publish / cancel)
```
**HALT EXECUTION**: Never publish a release without explicit user confirmation.

### Step 7: Public Publication & Verification
Once confirmed, publish the release:
```bash
gh release edit <tag> --draft=false
```
1. Publishing triggers `.github/workflows/deploy-website.yml`, which rebuilds the static Astro download page.
2. In-app updaters begin serving the new `latest.json` from the GitHub Releases CDN.
3. Update `PROGRESS.md` and report the final release URLs to the user.

---

## 3. Emergency Rollback Protocol

If the user cancels at Gate 2 or if a critical defect is discovered:
```bash
bash scripts/release/rollback.sh <tag>
```
This retracts the draft release, removes local and remote tags, and reverts the manifest bump commit cleanly.
