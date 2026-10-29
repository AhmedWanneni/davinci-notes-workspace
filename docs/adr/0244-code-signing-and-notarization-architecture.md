# ADR-0244: Code Signing, Hardened Runtime Entitlements and Notarization Architecture

## Context

Modern operating systems, particularly macOS Sequoia/Sonoma and Windows 11, enforce strict binary verification:
1. macOS Gatekeeper rejects unsigned or unnotarized binaries, preventing typical double-click execution unless bypassed manually via Finder or `xattr -cr`.
2. Hardware access (microphone for meeting recording via `cpal`) and local loopback networking (Syncthing daemon and web clipper receiver) require explicit hardened runtime entitlements on signed macOS applications.
3. Windows SmartScreen displays warnings on newly generated or unsigned installers until certificate reputation or digital signatures are established.

## Decision

1. **macOS Developer ID & Notarization via `notarytool`**:
   - Provide `entitlements.mac.plist` defining required hardened runtime flags:
     - `com.apple.security.device.audio-input` for dual-channel audio capture.
     - `com.apple.security.network.client` and `com.apple.security.network.server` for loopback IPC (Syncthing port 8384 and clipper receiver port 37210).
     - Standard JIT and executable memory flags for WebKit runtime.
   - Configure `tauri-action` to sign using Apple Developer ID Application certificates (`APPLE_CERTIFICATE` base64 `.p12`) and notarize via App Store Connect API credentials (`APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`).
2. **Graceful Unsigned Fallback**:
   - In environments without Apple credentials (`ENABLE_CODE_SIGNING != 'true'`), the build pipeline produces unsigned DMGs cleanly.
   - Maintainer and user documentation explicitly covers the Gatekeeper bypass:
     `xattr -cr /Applications/DaVinci\ Notes.app` or Right Click → Open.
3. **Windows Signing Strategy**:
   - Phase 1–3 ships unsigned NSIS installers with published SHA-256 hashes.
   - Long-term roadmap establishes Microsoft Azure Trusted Signing, avoiding hardware physical USB token dependencies on CI runners.
4. **Cryptographic Checksum Verification**:
   - Every build publishes standard `SHA256SUMS` to GitHub Releases, allowing users and package managers to verify download authenticity independently.

## Consequences

- macOS builds satisfy Gatekeeper requirements when credentials are provided in CI.
- Required hardware/network capabilities (audio loopback, local Syncthing) are protected by explicit entitlements without permission panics.
- Clean, documented fallback ensures development and open-source forks remain fully functional without paid certificates.
