---
name: create-release
description: Universal release workflow for cutting desktop and static website releases with preflight gates and CI artifact verification.
---

# Workflow: create-release

Execute the standard release sequence following [`docs/releasing.md`](../../docs/releasing.md):

1. **Preflight**: Run `bash scripts/release/preflight-release.sh`. Halt immediately on failure.
2. **Version & Changelog**: Propose SemVer bump from `git log $(git describe --tags --abbrev=0)..HEAD` and draft notes via `bash scripts/release/generate-changelog.sh`.
3. **Gate 1**: Present version and categorized notes to the user; wait for explicit approval.
4. **Tag & Push**: Run `bash scripts/release/release.sh --yes --notes-file ./RELEASE_NOTES_DRAFT.md <version>`.
5. **Verify Matrix**: Run `bash scripts/release/wait-and-verify-release.sh <tag>` to monitor GitHub Actions.
6. **Gate 2**: Present artifact checklist and draft URL; wait for explicit publish confirmation.
7. **Publish**: Run `gh release edit <tag> --draft=false` to publish and trigger website auto-deployment.
8. **Rollback**: On error or cancellation, run `bash scripts/release/rollback.sh <tag>`.
