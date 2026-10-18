# 0201: Expo Mobile "Scan to Sync" Orchestration and Pairing Validation

## Status

Accepted

## Context

The desktop app generates a pairing QR containing a versioned URI payload (`davincinotes://pair?d=<base64url>`) with desktop Device ID, desktop name, vault ID, vault label, and an ephemeral 6-digit verification code (ADR 0200).

On the Expo mobile app (`apps/mobile/`), users previously had only manual device addition. To deliver a seamless, zero-config onboarding experience:
1. Mobile needs a "Scan to sync" feature accessible from Settings -> Sync.
2. Camera access must be requested on-demand only when the scanner mounts, with graceful fallback to manual paste for permission denial.
3. The QR payload must be strictly validated (version checks, valid 56-char Luhn/group format, sane length bounds) and all string inputs sanitized before rendering to eliminate injection hazards.
4. Before any remote peer or folder is configured, a confirmation sheet must display desktop identity and vault details.
5. The local target directory must be verified for read/write access via SAF/sandbox and checked for emptiness to warn the user if existing files might be merged.
6. The connection orchestration must announce the phone as `"<phone-name>-<code>"` to enable desktop's highlighted one-tap accept, poll pending folders with a timeout, accept ONLY the offered folder matching the scanned `folderId` and `offeredBy`, and track synchronization progress to 100% completion.
7. If local Syncthing (e.g. Syncthing-Fork on Android) is not running or missing an API key, the flow must guide the user through setup first, explicitly flagging API key paste as the one-time friction.

## Decisions

1. **Lazy Camera Scanner with Seamless Paste Fallback**:
   - Camera scanner is lazy loaded (`React.lazy(() => import("./SyncthingQrScanner"))`) so `expo-camera` is never bundled into initial mobile boot.
   - Camera permission is requested only on scanner mount. If denied, the UI automatically presents a paste field accepting either `davincinotes://pair?d=...` or a raw 56-character Syncthing Device ID.

2. **Strict Payload Parser & Sanitization (`validatePairingInput`)**:
   - Extracted into `@app/syncthing-api/validatePairing.ts`.
   - Requires `v === 1`. Rejects future/unknown versions (e.g. `v: 2`) with an explicit "Please update DaVinci Notes" error message.
   - Validates 56-character alphanumeric Device ID format.
   - Restricts lengths of names, folder IDs, and labels to 100 characters.
   - Enforces 6-digit numeric verification code (`/^\d{6}$/`).
   - Uses `sanitizeDisplayName` to strip HTML control/markup characters before rendering.

3. **Confirmation and Target Directory Inspection (`ScanToSyncConfirmSheet`)**:
   - No device or folder is added until the user taps "Confirm & Pair".
   - `checkFolderAccess` performs an atomic read/write probe and checks for existing files. If read/write fails, "Confirm & Pair" is disabled with an explanatory error. If the folder is non-empty, a warning banner alerts the user of potential file merges.

4. **Peer Announcement & Selective Folder Acceptance (`useScanToSync`)**:
   - Mobile updates its local device announced name via `PUT /rest/config/devices/:myId` to `"<phone-name>-<code>"`.
   - Mobile adds desktop as a remote device (ignoring "already added" errors to guarantee idempotency).
   - Desktop verifies the code in incoming connection and highlights Accept & Share.
   - Mobile polls `/rest/cluster/pending/folders` (up to 45s). It accepts **only** the folder where `f.folderId === payload.folderId && f.offeredBy === payload.id`. All other offers are strictly ignored.
   - Mobile accepts the folder to the target path and polls `/rest/db/completion` until completion reaches 100% or needBytes/items drop to 0.

5. **Prerequisite Guide with API Key Friction Surfaced (`ScanToSyncSetupGuide`)**:
   - If Syncthing-Fork is not active, guides user to start the service.
   - If API key is missing or invalid, highlights the one-time friction: "Copying the API key allows DaVinci Notes to pair and synchronize notes directly through your local Syncthing service."

## Consequences

- End-to-end QR pairing from desktop to mobile is fully operational with zero manual ID typing.
- Scanning the same QR twice is idempotent without duplicate devices or folders.
- Scanning unrelated QRs, URLs, or future payload versions produces clear, actionable errors.
- Expired QR codes do not highlight on desktop and surface a timeout error on mobile.
- All components adhere strictly to the 250-line maximum limit (averaging 120-180 lines).
