# ADR-0242: Release Versioning, Single Source of Truth, and Manifest Synchronization

## Context

DaVinci Notes spans multiple distinct platforms and manifests across a Turborepo monorepo:
1. Monorepo root `package.json`
2. Desktop application `apps/desktop/package.json`
3. Native Tauri desktop shell configuration `apps/desktop/src-tauri/tauri.conf.json`
4. Native desktop Rust crate `apps/desktop/src-tauri/Cargo.toml`
5. Static marketing & download website `apps/website/package.json`
6. Mobile Expo application `apps/mobile/app.json`

If these files drift, users can receive mismatched update signals, mismatched binary package names, or failing build matrices in CI. Changesets was evaluated, but is designed for publishing npm libraries and requires per-PR markdown changeset files without native support for `Cargo.toml`, `tauri.conf.json`, or `app.json`.

## Decision

1. **Deterministic Manifest Synchronization via `bump-version.sh`**:
   - Establish `scripts/release/bump-version.sh` as the single source of version bumps across all 6 manifests simultaneously.
   - Enforce SemVer syntax (`X.Y.Z` or pre-release `X.Y.Z-beta.N`), supporting semantic increment keywords (`patch`, `minor`, `major`) and `--dry-run`.
2. **Deterministic CI Gate via `check-version-sync.sh`**:
   - Establish `scripts/release/check-version-sync.sh` as an automated gate.
   - Any pull request or commit where the 6 manifests differ will fail CI (`check:version-sync` in `.github/workflows/ci.yml`).
3. **Conventional Commits as Release Foundation**:
   - Rely on the existing `@commitlint/config-conventional` and Husky hooks (`.husky/commit-msg`) already present in the repository, avoiding extra heavyweight versioning dependencies.
4. **Local Smoke Build Helper**:
   - Establish `scripts/release/build-local.sh` enabling developers to smoke-test desktop compilation without code signing keys or CI runners.

## Consequences

- Zero version drift across web, desktop, native Rust, and mobile manifests.
- Zero npm or runtime bundle bloat: purely zero-dependency bash/Node scripting.
- Fast, automated, reproducible version bumps in CI and local maintainer environments.
