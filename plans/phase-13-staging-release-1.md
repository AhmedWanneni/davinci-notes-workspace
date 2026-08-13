# Phase 13 Implementation Plan — Staging Deploy & Release Candidate 1

Set up the staging release infrastructure, reconstruct changesets for Phase 1–12 workspace packages, execute the first version bump, generate the initial release candidate (`v0.1.0-rc.1`), and verify the packaged standalone application.

## User Review Required

> [!IMPORTANT]
> **Code Signing & Notarization Credentials for macOS / Windows**:
> For production and public staging distribution, macOS requires an Apple Developer ID Application Certificate and Notarization credentials (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`), and Windows requires an Authenticode Code Signing Certificate.
> In local and internal CI without provisioned secrets, Tauri builds unsigned/ad-hoc signed `.app` and `.dmg` binaries. We will document and configure the CI workflow to cleanly sign when repository secrets are provided while continuing to build release artifacts without blocking on missing certificates.

> [!NOTE]
> **Changeset Reconstruction**:
> Changesets for Phases 1–12 were not created incrementally during fast feature development. We will reconstruct realistic changeset markdown files for `@app/design-system`, `@app/core-types`, `@app/indexer`, `@app/editor`, and `@app/sync-client` based on the detailed session log in `PROGRESS.md` and `DECISIONS.md` before applying `pnpm changeset version`.

---

## Proposed Changes

### 1. Staging Release Workflow & Tauri Configuration

#### [NEW] [.github/workflows/staging-release.yml](file:///Users/ahmedwaanneni/Desktop/davinci-notes/.github/workflows/staging-release.yml)
- GitHub Actions workflow triggered on push to `main` (filtered to changes in `apps/desktop/**`, `packages/**`) and `workflow_dispatch`.
- Reuses Turborepo build pipeline (`pnpm turbo run lint typecheck test build`).
- Compiles the Tauri desktop app for release on `macos-latest` (and `ubuntu-latest` / `windows-latest` matrices).
- Integrates optional Apple code signing / notarization and Tauri auto-updater signature generation when secrets exist.
- Uploads packaged staging build artifacts (`.dmg`, `.app`, `.deb`, `.msi`) to GitHub Actions Artifacts / Releases staging draft.

#### [MODIFY] [apps/desktop/src-tauri/tauri.conf.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src-tauri/tauri.conf.json)
- Set bundle name, version alignment, and prepare plugins / updater schema endpoint for staging channel (`https://staging.updates.davincinotes.com/{{target}}/{{current_version}}`).

---

### 2. Changesets Reconstruction & Version Bump

#### [NEW] Changeset files in `.changeset/`:
- Reconstruct changesets for:
  - `@app/design-system` (0.1.0 minor)
  - `@app/core-types` (0.1.0 minor)
  - `@app/indexer` (0.1.0 minor)
  - `@app/editor` (0.1.0 minor)
  - `@app/sync-client` (0.1.0 minor)
- Execute `pnpm changeset version` to produce `CHANGELOG.md` files for all packages and bump package versions from `0.0.0` to `0.1.0`.

---

### 3. Tag & Build Release Candidate (`v0.1.0-rc.1`)

- Ensure package versions across `apps/desktop/package.json`, `apps/desktop/src-tauri/tauri.conf.json`, and `apps/desktop/src-tauri/Cargo.toml` are in sync with `0.1.0`.
- Execute a release build (`pnpm --filter=@app/desktop build`) to compile the native packaged application (`DaVinci Notes.app` / `.dmg`).
- Create local git tag `v0.1.0-rc.1`.

---

### 4. Release Notes & Documentation

#### [NEW] [docs/releases/v0.1.0-rc.1.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/docs/releases/v0.1.0-rc.1.md)
- Detail all implemented features (Vault loading, CodeMirror 6 live-preview editor, Wikilinks, Backlinks panel, Cmd+K Quick Switcher, D3 Force Graph, Persistent Settings, Virtualized File Tree).
- Clearly document deliberately out-of-scope items (Mobile app, Sync server/client live sync, Plugin system, Light theme).
- List known issues and deferred items (provisional bundle ID, local unsigned binary Gatekeeper note, badge success/warning token placeholders).

---

### 5. Verification & Wrap-up

- Run all automated checks: `pnpm turbo run lint typecheck test build`, `pnpm run check:bundle-size`.
- Test running the actual packaged standalone release application (`apps/desktop/src-tauri/target/release/bundle/macos/DaVinci Notes.app`).
- Verify core user flows on real packaged app:
  1. Open vault
  2. Create/edit markdown notes with live preview
  3. Wikilink autocomplete and navigation
  4. Backlinks panel live updates
  5. Quick switcher (Cmd+K) fuzzy search
  6. Local and Global graph rendering with zoom/pan
  7. Settings changes and SQLite persistence across restarts
- Update [PROGRESS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/PROGRESS.md) and [DECISIONS.md](file:///Users/ahmedwaanneni/Desktop/davinci-notes/DECISIONS.md).

---

## Verification Plan

### Automated Tests
- `pnpm turbo run lint typecheck test build`
- `pnpm run check:bundle-size`
- `pnpm changeset status`

### Manual Verification
- Launch the compiled native macOS release bundle: `open "apps/desktop/src-tauri/target/release/bundle/macos/DaVinci Notes.app"`.
- Test the full interactive user workflow in the production-packaged build.
