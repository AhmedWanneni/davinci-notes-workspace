# UX Review: Settings Tab 6 (Sync & Syncthing)

## 1. Overview
The Sync & Backup Tab (`SyncSettingsTab.tsx`, `SyncSettingsPanel.tsx`, `SyncthingPanel/`) manages multi-device vault synchronization.
- **Entry points**: Settings > "Sync & Backup", or clicking the cloud/sync icon in the Status Bar.
- **Current state**:
  - Top mode switcher: `Off`, `Google Drive` (OAuth PKCE), or `Syncthing` (Local peer-to-peer).
  - Syncthing Panel: Status banner (Running / Offline / Error), Mobile QR code pairing section (`SyncthingQrPairingSection.tsx`), manual Device ID input (`SyncthingAddDeviceSection.tsx`), paired devices table (`SyncthingPairedDevicesSection.tsx`), shared vaults list, and pending connection offers (`SyncthingPendingSection.tsx`).

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Clear status banner: green indicator when Syncthing daemon is running, live ping response times for paired devices. |
| **H2 Match with real world** | Pass | Clear device names, QR code scanning for phones, and visual connection status. |
| **H3 User control and freedom** | Pass | Users can disconnect devices, unshare individual folders, or switch sync modes at any time. |
| **H4 Consistency and standards** | Pass | Follows P2P networking paradigms while shielding users from raw XML configs. |
| **H5 Error prevention** | Pass | Validates 56-character Syncthing Device IDs before saving; confirms device unpairing. |
| **H6 Recognition over recall** | Pass | QR code enables instant mobile pairing without manually typing a 56-character hash. |
| **H7 Flexibility and efficiency** | Pass | Both automated QR pairing and manual device ID inputs are supported. |
| **H8 Aesthetic and minimalist design** | Partial | Massive number of nested cards across pairing, devices, folders, and pending sections. |
| **H9 Error recovery** | Pass | "Restart Daemon" button and clear diagnostic messages when local Syncthing port is blocked. |
| **H10 Help and documentation** | Pass | Helpful step-by-step instructions on pairing Sophia Mobile with Desktop. |
| **Fitts's Law** | Pass | Sizable "Copy ID", "Pair Device", and "Accept" buttons. |
| **Hick's Law** | Partial | Syncthing panel contains many concurrent sub-sections (Add Device, QR, Paired, Shared, Pending). |
| **Jakob's Law** | Pass | Emulates modern P2P pairing flows (Signal / Syncthing Web UI). |
| **Miller / Chunking** | Pass | Sections cleanly chunked by task. |
| **Doherty Threshold** | Pass | Local Syncthing REST API polling is debounced to avoid CPU spikes. |
| **Postel's Law** | Pass | Automatically strips spaces and hyphens from pasted Device IDs. |
| **Von Restorff** | Pass | Pending connection requests are highlighted with accent notices. |
| **Proximity** | Pass | QR code is adjacent to text instructions and Device ID copy button. |
| **Similarity** | Pass | Paired device rows have identical status badge indicators. |
| **Common Region** | Fail | 6 nested bordered cards stacked vertically in a single scrollable tab. |
| **Uniform Connectedness** | Pass | Clear device status row borders. |
| **Design tokens & styling** | Pass | Uses tokens and CSS Modules. |
| **Accessibility (a11y)** | Pass | QR code has descriptive alt text; copy button provides audible feedback. |
| **Performance feel** | Pass | Native Rust daemon management via Tauri commands (`syncthing_status`). |

---

## 3. Issues

### SYNC-01: Severe card clutter (6 nested cards) in Syncthing tab
- **Severity**: High
- **Rule violated**: Gestalt Common Region / H8 Aesthetic and minimalist design
- **Evidence**: `apps/desktop/src/components/SyncthingPanel/SyncthingPanel.tsx` `[Observed]`
- **Why it hurts the user**: The Syncthing panel renders 6 thick-bordered card boxes in one view (`SyncthingStatusBanner`, `SyncthingQrPairingSection`, `SyncthingAddDeviceSection`, `SyncthingPendingSection`, `SyncthingPairedDevicesSection`, `SyncthingSharedVaultsSection`). The UI looks fragmented and claustrophobic.
- **Suggested fix**: Consolidate sections into a clean layout: Top header with Status & QR Pairing, followed by two tabs or collapsible accordion sections ("Devices" and "Folders").
- **Effort**: M

### SYNC-02: Device ID string lacks one-click format masking
- **Severity**: Low
- **Rule violated**: Miller's Law / H6 Recognition over recall
- **Evidence**: `apps/desktop/src/components/SyncthingPanel/SyncthingQrPairingSection.tsx` `[Code-Read Only]`
- **Why it hurts the user**: Displaying 56 unbroken alphanumeric characters makes visual verification between desktop and phone screens exhausting.
- **Suggested fix**: Chunk device ID into standard 7-character groups separated by hyphens (e.g. `ABC1234-DEF5678-...`).
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.syncthing-qr-section` | Heavy card box | Encloses QR in unnecessary container | Clean borderless center block with subtle background |
| `.syncthing-add-device` | Heavy card box | Extra card around 2 input fields | Flat inline form beneath devices table |
| `.syncthing-paired-devices` | Heavy card box | Container around table | Flat edge-to-edge list with hairline headers |

---

## 5. What Works Well
- Flawless QR code generation for mobile onboarding without typing long hashes.
- Real-time device ping and connection status indicators.
- Automatic device ID normalization (stripping spaces, lowercase conversion).

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Format raw Device ID into chunked 7-character groups (≤15 min).
- **Quick Win**: Flatten card wrappers into unified list sections (≤45 min).
- **Larger Work**: Combine "Add Device" and "Paired Devices" into a single consolidated devices management interface.
