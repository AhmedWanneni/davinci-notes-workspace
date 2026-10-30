# ADR-0245: Serverless In-App Auto-Update Architecture via Tauri Updater and GitHub Releases

## Context

Desktop users expect seamless, secure in-app updates without manually navigating to a website to re-download DMGs or installers. However, per [ADR-0116](0116-sync-via-drive-syncthing-no-owned-backend.md), DaVinci Notes strictly maintains a zero-owned-backend architectural stance.

Traditional update architectures (like Hazel, Nuts, or Sparkle with custom backends) require maintaining and paying for a dynamic server. Furthermore, insecure update pipelines expose users to man-in-the-middle binary substitution attacks.

## Decision

1. **Native `tauri-plugin-updater` with Serverless GitHub Releases Hosting**:
   - Register `tauri-plugin-updater` (Tauri v2) in the desktop application.
   - Configure the update endpoint directly to the GitHub Releases latest download URL:
     `https://github.com/AhmedWanneni/davinci-notes-workspace/releases/latest/download/latest.json`.
   - Update metadata is served statically over GitHub's global CDN with zero server infrastructure to maintain.
2. **Ed25519 Cryptographic Verification**:
   - Every release generates a signed `latest.json` containing base64 signatures for each platform target (`darwin-aarch64`, `darwin-x86_64`, `windows-x86_64`, `linux-x86_64`).
   - The desktop shell verifies each binary against the embedded public key (`plugins.updater.pubkey`) before unzipping or executing any payload. Corrupted or tampered downloads are rejected immediately.
3. **Lazy-Loaded Settings UI**:
   - Build `UpdateSettingsCard.tsx` inside desktop settings with states for idle, checking, update available with release notes, download progress tracking, and restart to apply.
   - Zero background polling thread thrashing; updates check on explicit user interaction or a debounced 24-hour interval.
4. **Graceful Fallbacks & Offline Resilience**:
   - In offline mode or in non-Tauri / test environments, the updater gracefully reports network status without crashing or throwing unhandled promise rejections.

## Consequences

- Completely serverless, zero-cost, zero-maintenance auto-update distribution for desktop users.
- Robust cryptographic defense against MITM and supply-chain tampering.
- Seamless upgrade path from version N-1 to N.
