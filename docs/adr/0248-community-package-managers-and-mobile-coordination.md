# ADR-0248: Community Package Managers Distribution and Mobile Release Coordination

## Context

Desktop power users on macOS and Windows frequently install and update tools through package managers rather than direct web downloads:
- macOS developers rely heavily on Homebrew (`brew install --cask davinci-notes`).
- Windows 10/11 users rely on Microsoft WinGet (`winget install DaVinciNotes`).

Additionally, the monorepo hosts the mobile application (`apps/mobile`), which shares versioning manifests with the desktop shell but ships via distinct distribution channels (Apple App Store & Google Play via EAS Build).

## Decision

1. **Automated Homebrew Cask Generation (`.github/workflows/homebrew-cask.yml`)**:
   - On release publish, an automated GitHub Actions workflow downloads macOS ARM and Intel DMGs, computes their respective SHA-256 digests, and generates a standardized Homebrew Cask formula (`davinci-notes.rb`).
2. **Automated WinGet Submission (`.github/workflows/winget.yml`)**:
   - On release publish, an automated GitHub Actions workflow submits the signed Windows NSIS setup installer to the Microsoft WinGet Community Repository using `vedantmgoyal2009/winget-releaser`.
3. **Decoupled Mobile Release Cadence with Synchronized SemVer**:
   - `bump-version.sh` synchronizes `apps/mobile/app.json` alongside desktop manifests to ensure unified version numbers across platforms.
   - However, deployment cadences remain decoupled: desktop ships immediately via GitHub Releases and the static website, while mobile binaries deploy via Expo Application Services (EAS Build) subject to Apple and Google store review cycles.

## Consequences

- Direct zero-friction installation for command-line power users on macOS and Windows.
- Automated distribution updates without manual maintainer intervention.
- Unified versioning across mobile and desktop without blocking desktop release velocity on app store review turnaround times.
