# Release Management & Distribution Runbook

This document is the authoritative guide for cutting releases of DaVinci Notes / Sophia across desktop (macOS Apple Silicon & Intel, Windows x64, Linux x64) and the static website.

---

## 1. Quick Release Cheatsheet

Cutting a standard release takes one command from maintainer terminal:

```bash
# 1. Ensure working directory is clean on main branch
git checkout main
git pull origin main

# 2. Run the release driver with SemVer increment (patch, minor, major) or exact version
bash scripts/release/release.sh minor

# (Dry run option to inspect proposed changes)
bash scripts/release/release.sh --dry-run minor
```

### What `release.sh` does automatically:
1. Validates working tree is clean.
2. Checks version synchronization across all 6 manifests via `check-version-sync.sh`.
3. Bumps version simultaneously across `package.json`, `apps/desktop/package.json`, `apps/desktop/src-tauri/Cargo.toml`, `apps/desktop/src-tauri/tauri.conf.json`, `apps/website/package.json`, and `apps/mobile/app.json`.
4. Extracts conventional commits since the previous release tag and formats them into categorized release notes (`RELEASE_NOTES_TMP.md`).
5. Commits `chore(release): vX.Y.Z` and tags `vX.Y.Z`.
6. Pushes tag and commit to GitHub, triggering `.github/workflows/release.yml`.

---

## 2. CI Build Matrix & Publishing Protocol

Once the tag `v*` is pushed:

1. **Pre-Release Gate**: GitHub Actions runs `lint`, `typecheck`, `test`, `build:web`, and `check:version-sync`.
2. **Parallel Matrix Compilation**:
   - `macos-latest` (`aarch64-apple-darwin`): Builds signed & notarized Apple Silicon DMG.
   - `macos-latest` (`x86_64-apple-darwin`): Builds signed & notarized Intel DMG.
   - `windows-latest` (`x86_64-pc-windows-msvc`): Builds Windows setup `.exe` installer.
   - `ubuntu-22.04` (`x86_64-unknown-linux-gnu`): Builds Linux `.AppImage` and `.deb`.
3. **Artifact Aggregation & Draft Release**:
   - Compiles Tauri updater `latest.json` signed with the Ed25519 private key.
   - Computes `SHA256SUMS.txt` for all platform installers.
   - Attaches all assets to a **Draft Release** (does not publish live immediately).
4. **Maintainer Sign-Off**:
   - Maintainer navigates to GitHub Releases → Draft Release.
   - Inspects generated release notes and attached installers.
   - Clicks **Publish Release**.
5. **Distribution Trigger**:
   - Published release triggers website rebuild (`/download` pre-rendering).
   - In-app updaters detect `latest.json` on next check.

---

## 3. Emergency Hotfix Procedure

When a critical zero-day bug requires immediate patching:

1. Create a patch branch from the affected release tag:
   ```bash
   git checkout -b hotfix/v0.2.1 v0.2.0
   ```
2. Apply the fix and verify unit tests.
3. Run release script:
   ```bash
   bash scripts/release/release.sh patch
   ```
4. Merge hotfix branch back into `main`.

---

## 4. Emergency Rollback Protocol

If a release binary is found to have a critical startup crash after publishing:

```bash
# 1. Run emergency rollback script to delete GitHub release and local/remote tags:
bash scripts/release/rollback.sh --delete-remote-tag v0.2.0

# 2. To retract the update from in-app updaters, re-upload the previous known-good latest.json:
gh release upload v0.1.9 path/to/known_good_latest.json --clobber
```

---

## 5. First-Time Setup Checklist (Maintainer Credentials)

### 5.1 macOS Developer ID Signing & Notarization
Required secrets configured in GitHub Repo → Settings → Secrets:
- `APPLE_CERTIFICATE`: Base64 encoded `.p12` file containing Apple Developer ID Application certificate and private key.
- `APPLE_CERTIFICATE_PASSWORD`: Passphrase protecting the `.p12` export.
- `APPLE_SIGNING_IDENTITY`: Full identity string (e.g., `Developer ID Application: Your Name (TEAM_ID)`).
- `APPLE_TEAM_ID`: 10-character Apple Developer Team ID.
- `APPLE_API_KEY`: Raw contents of App Store Connect API `.p8` key.
- `APPLE_API_KEY_ID`: 10-character Key ID from App Store Connect.
- `APPLE_API_ISSUER`: UUID Issuer ID from App Store Connect.

### 5.2 Tauri Updater Cryptographic Signing Keypair
Generate a new Ed25519 keypair:
```bash
pnpm --filter @app/desktop tauri signer generate -w ~/.tauri/davinci_updater.key
```
1. Paste the generated public key into `apps/desktop/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
2. Add private key content to GitHub secret: `TAURI_SIGNING_PRIVATE_KEY`.
3. Add passphrase to GitHub secret: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
4. **SECURE COLD BACKUP**: Store `~/.tauri/davinci_updater.key` in an encrypted password manager or offline USB. Losing this key breaks automatic in-app updates for all existing users permanently.

---

## 6. Gatekeeper & Unsigned Binary Fallback

If binaries are distributed without Apple Developer notarization (e.g. forks or local builds), macOS Gatekeeper displays a block message. Instruct users:

```bash
# In Terminal, strip quarantine attribute:
xattr -cr /Applications/DaVinci\ Notes.app
```
Or right-click `DaVinci Notes.app` in Finder, hold `Option`, click `Open`, and click `Open` in the dialog.

---

## 7. Community Package Managers

- **Homebrew Cask**: Handled automatically via `.github/workflows/homebrew-cask.yml`. On published release, generates `davinci-notes.rb` with current version and SHA-256 hashes.
- **Windows Package Manager (WinGet)**: Handled automatically via `.github/workflows/winget.yml`. Uses `winget-releaser` action to submit manifests to Microsoft Community repository.

---

## 8. Mobile App (Expo / EAS Build) Coordination

The mobile application (`apps/mobile`) shares the SemVer version in `apps/mobile/app.json` (`expo.version`) bumped simultaneously by `bump-version.sh`.

However, mobile builds follow a separate app-store submission cadence:
1. `apps/mobile` builds submit to Apple TestFlight and Google Play via EAS Build (`eas build --platform all`).
2. Release notes are coordinated using the output of `generate-changelog.sh`.
3. Due to App Store review turnaround (1–3 days), mobile release versions should match desktop minor/major releases while desktop may cut independent fast patch releases for desktop-only features.

