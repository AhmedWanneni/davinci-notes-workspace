# 0200. Syncthing QR Pairing Payload and One-Tap Confirmation

Date: 2026-10-18

## Status

Accepted

## Context

Prior iterations displayed a QR code containing only the raw 56-character Syncthing Device ID. While sufficient for low-level node pairing, connecting a mobile device required multiple manual steps: scanning the device ID, sending a connection request, waiting for the desktop to accept the device, manually initiating a folder share from desktop, and finally accepting the folder on mobile.

To deliver an instant, zero-friction pairing experience, the desktop QR code needed to encode an end-to-end pairing payload containing node identity, active vault folder information, and an ephemeral verification code.

## Decisions

### Decision 1: Versioned Compact Pairing Payload
- The desktop QR code encodes a compact JSON payload within a custom URI scheme:
  `davincinotes://pair?d=<base64url>`
- Payload schema:
  ```json
  {
    "v": 1,
    "id": "<deviceId>",
    "name": "<deviceName>",
    "folderId": "<vault folder id>",
    "folderLabel": "<vault name>",
    "code": "<6-digit random code>"
  }
  ```
- Implemented in `@app/syncthing-api` (`pairing.ts`) with robust RFC 4648 URL-safe base64 encoding without padding, ensuring maximum scanner density and error correction headroom.

### Decision 2: Automatic Vault Folder Pre-Registration
- Generating the QR code invokes `syncthing_ensure_vault_registered`.
- If the current vault folder is not yet present in Syncthing's `/rest/config/folders`, it is automatically registered with `.stignore` rules applied and `devices: [{ deviceID: my_id }]`.
- The vault folder is never shared with unknown or unconfirmed devices during QR generation.

### Decision 3: Preservation of Raw Device ID and Copy Action
- The raw 56-character Device ID card remains permanently visible with an instant Copy button.
- Third-party Syncthing clients (e.g. Syncthing Android, Syncthing-Fork, desktop GUI) and manual clipboard workflows continue to function unimpeded.

### Decision 4: 5-Minute Pairing Window and Code Rotation
- The QR view displays an active countdown timer (default 300 seconds / 5 minutes) alongside an animated "Waiting for phone..." status.
- Once the 5-minute pairing window elapses, the code is automatically rotated to a fresh 6-digit random code, and the QR code is re-rendered to prevent replay attempts.

### Decision 5: One-Tap Confirmation vs. Auto-Accept (Decision Flagged)
- **Decision Flagged**: Auto-accept on code match vs. always one-tap confirm.
- **Adopted**: Always require a one-tap confirm; never auto-accept.
- **Rationale**:
  - Device IDs and 6-digit codes broadcast over local network discovery or visible on a desktop screen are not cryptographic secrets.
  - An auto-accept posture would allow any rogue process or device on the same local subnet that observed or brute-forced the code to silently gain full read/write synchronization access to the user's private vault without explicit approval.
  - A highlighted, one-tap "Accept & Share" button preserves near-zero friction while guaranteeing that the desktop user retains final agency over who accesses their vault.
  - If a device connects with an unverified or missing code, the UI displays a warning banner and demands an explicit two-step confirmation before sharing.

### Decision 6: Automated Folder Sharing & Safe Decline
- Confirming an incoming connection offer automatically executes `syncthing_accept_device` followed by `syncthing_share_vault_folder`, eliminating secondary sharing prompts.
- Declining / ignoring an offer invokes `syncthing_dismiss_pending_device`: zero devices are added to the configuration, and no folders are shared.

## Consequences

- Mobile devices scanning the desktop QR instantly receive vault ID, vault label, and device credentials in a single camera frame.
- Pairing requires only one tap on desktop to accept and establish bilateral synchronization.
- Unverified connection offers require explicit confirmation.
- The raw Device ID remains accessible for power users.
