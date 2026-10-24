# 0202: Embedded Android Syncthing Daemon, Foreground Service, and Zero-Friction Scan-to-Sync

## Status

Accepted

## Context

Mobile "Scan to sync" previously required users to install and configure an external application (Syncthing-Fork), locate the web GUI, copy an API key, and paste it into DaVinci Notes. To eliminate this external dependency and deliver a frictionless out-of-the-box sync experience on Android:

1. Syncthing must be embedded directly inside the Expo mobile application (`apps/mobile/`), eliminating the "open or install Syncthing-Fork" screen from the default onboarding flow.
2. Android 10+ enforces W^X (Write XOR Execute) security restrictions, blocking process execution from writable app directories (e.g., `/data/data/.../files/`).
3. Android 14 and 15 enforce strict Foreground Service boundaries and quota limits on background sync (`dataSync` type).
4. The API key must never reach JavaScript, logs, or error strings, and no cleartext-HTTP network configuration should be opened.
5. Vault location, supported ABIs, and battery optimization requirements must be deliberately evaluated with explicit tradeoffs.

## Decisions

### Decision a: Vault Storage Location
- **Chosen: Option 1 (App-Private Storage `context.filesDir`)**.
- Both the embedded Syncthing process and the note editor access vault files directly via local POSIX I/O without Storage Access Framework (SAF) document tree overhead.
- Eliminates any requirement for `MANAGE_EXTERNAL_STORAGE` (All Files Access), which Google Play strictly rejects for note-taking applications.
- Tradeoff: Vault files are private to DaVinci Notes and cannot be directly opened by third-party Android file editors without exporting.

### Decision b: ABIs Shipped & APK/AAB Size Budget
- **Chosen: `arm64-v8a` + `x86_64`**.
  - `arm64-v8a` (production devices): 26.24 MB uncompressed on disk; 10.86 MB compressed.
  - `x86_64` (Android Studio emulators / Chromebooks): 28.01 MB uncompressed on disk; 11.53 MB compressed.
- Armeabi-v7a (32-bit legacy) is omitted, saving ~24 MB of bundle overhead.
- With Android App Bundle (AAB) ABI splits, user downloads only include their device architecture (~10.8 MB download delta).

### Decision c: API Call Architecture & Secret Isolation
- **Chosen: Native Kotlin HTTP Proxy (`request(method, path, body)`)**.
- The 32-character cryptographically secure API key is generated via `SecureRandom` on first boot, stored in private app preferences, and kept exclusively in Kotlin memory.
- `SyncthingRestAllowlist` validates all incoming API calls against an explicit prefix allowlist (`/rest/system/*`, `/rest/config/*`, `/rest/cluster/pending/*`, `/rest/db/completion`, `/rest/events`) and strictly blocks dangerous endpoints (`/rest/system/shutdown`, `/rest/system/restart`).
- Internal process manager performs graceful shutdown via `executeInternal`.
- The API key never reaches JavaScript, the bridge, logs, or webviews. No cleartext-HTTP network security config is needed.

### Decision d: Binary Provenance and Packaging
- Official Syncthing-Fork v2.1.6.0 release binaries (matching desktop v2.1.6) are pinned, checksummed (`fetchAndroidSyncthing.mjs`), and verified with SHA-256 integrity checks.
- Position Independent Executables (PIE) are packaged in `jniLibs/<abi>/libsyncthing.so` with `useLegacyPackaging true`.
- Android Package Manager extracts the `.so` executable into `applicationInfo.nativeLibraryDir` with execute permissions (`r-xr-xr-x`), completely bypassing Android 10+ W^X execution restrictions without SELinux denials.
- MPL-2.0 notices and source attributions are recorded in `apps/mobile/LICENSES.md`.

### Android 14/15 Foreground Service & Background Quotas
- `SyncthingForegroundService` declares `android:foregroundServiceType="dataSync"` and runs as `START_STICKY`.
- Android 13+ requests runtime `POST_NOTIFICATIONS` before displaying the ongoing notification with status.
- Android 15 imposes a cumulative 6-hour limit within 24h for background `dataSync` jobs.
- The app handles this gracefully:
  1. Service starts only when sync is actively enabled (performance principle).
  2. Idle background timeout halts the daemon when not actively syncing.
  3. `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` in-app prompt allows users to exempt DaVinci Notes from OS battery suspension with an explicit explanatory prompt.

### Zero-Friction Scan-to-Sync Flow
- When `EmbeddedSyncthingBridge.isAvailable()` is true, `useScanToSync` opens directly into `"scanner"` mode, completely removing the "install Syncthing-Fork" and API key friction from the user experience.
- `handleConfirm` auto-starts the embedded daemon in the background and provisions devices and folders seamlessly.
- Device ID is rendered via `getQrDataUri` using native base64 data URIs, working 100% offline with zero cleartext network requests.

## Consequences

- "Scan to sync" works autonomously on Android with zero external app dependencies.
- API key is cryptographically isolated in native memory.
- Google Play compliance is fully preserved (no `MANAGE_EXTERNAL_STORAGE`).
- All Kotlin and TypeScript files strictly comply with ESLint $\le 250$ line limits.
