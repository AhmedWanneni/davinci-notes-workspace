# ADR-0243: Multi-Platform CI Build Matrix, Syncthing Pre-Fetching and Draft Release Pipeline

## Context

Shipping DaVinci Notes across macOS (Apple Silicon + Intel), Windows x64, and Linux x64 requires a repeatable, automated CI matrix. Key challenges include:
1. Tauri applications packaging bundled external binaries (`externalBin: ["binaries/syncthing"]`) require target-specific binaries (`syncthing-<target-triple>`) to exist prior to compilation.
2. Universal macOS binaries double the bundle size (~94 MB vs ~48 MB per DMG) because both the native app Mach-O and Syncthing binaries are duplicated for x86_64 and aarch64.
3. Uncontrolled immediate publishing of releases risks sending broken or partial builds to updater clients before all matrix jobs finish and checksums are verified.

## Decision

1. **Parallel GitHub Actions Matrix via `tauri-apps/tauri-action`**:
   - Matrix runs across:
     - `macos-latest` targeting `aarch64-apple-darwin` (Apple Silicon DMG)
     - `macos-latest` targeting `x86_64-apple-darwin` (Intel DMG)
     - `windows-latest` targeting `x86_64-pc-windows-msvc` (NSIS setup `.exe`)
     - `ubuntu-22.04` targeting `x86_64-unknown-linux-gnu` (AppImage + `.deb`)
   - Rejects universal binaries in favor of distinct architecture DMGs, saving ~45 MB per download and conforming to project lightweight/fast principles.
2. **Automated Target-Specific Syncthing Pre-Fetching**:
   - Each CI matrix runner executes `node apps/desktop/scripts/fetchSyncthing.mjs --target <triple>` immediately before building web and Tauri assets, ensuring external binary paths match target triples with SHA-256 verification.
3. **Quality Gate & Draft Release Gating**:
   - Releases trigger exclusively on tag push (`v*`) or manual `workflow_dispatch`.
   - Quality gate job validates lint, typecheck, tests, bundle sizes, and manifest version parity (`check-version-sync.sh`) before any runner executes expensive cross-compilations.
   - Initial release is created with `releaseDraft: true`. Maintainers review assets, checksums, and changelog before manually promoting to public.
4. **Automated Artifact Verification & Checksum Publication**:
   - A final aggregation job downloads all platform outputs, runs `scripts/release/verify-artifacts.sh`, and uploads `SHA256SUMS.txt` directly to the release.

## Consequences

- Automated, reproducible multi-platform build pipeline.
- Matrix builds are isolated and fast, utilizing `swatinem/rust-cache@v2` and pnpm store caches.
- Zero risk of partial or broken releases reaching end users prematurely.
