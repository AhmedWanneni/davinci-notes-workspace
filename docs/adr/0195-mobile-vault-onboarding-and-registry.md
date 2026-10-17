# ADR-0195: Mobile vault onboarding, multi-vault registry, and storage selection

## Status

Accepted (extends ADR-0181 and ADR-0187)

## Context

On initial launch, `apps/mobile` had no vault selection, onboarding, or creation flow. A fresh install booted into an internal error state ("Vault Inaccessible"). Furthermore, users had no mechanism to choose a vault name, open an existing folder, switch between multiple vaults, or recover when a vault directory was moved or deleted.

Mobile environments present specific storage tradeoffs:
1. **App-Sandbox Storage (`Paths.document.uri`)**:
   - 100% permanent permissions, zero revocation risk, full POSIX file I/O performance (<150 ms to scan 5,000 notes).
   - On iOS, `UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace` in `app.json` expose this folder directly in the native iOS Files app (`On My iPhone > DaVinci Notes`), granting external editing without security-scoped bookmark overhead.
   - Works consistently across both Expo Go and standalone Development Builds.
2. **User-Picked Folder (`Directory.pickDirectoryAsync` / SAF / UIDocumentPicker)**:
   - Necessary for users wanting to point the app to an existing directory (e.g. Syncthing on Android or existing markdown folders).
   - Subject to platform permission revocation across reboots and ContentProvider IPC latency on Android.

## Decision

1. **First-Run Onboarding Flow**:
   - If no active vault exists or the registry is empty, the app displays a dedicated First-Run Screen:
     - **"Create new vault"** (Primary action): Prompts for a vault name (defaulting to "Personal Vault"), creates the folder in the sandboxed documents directory, seeds `Welcome to DaVinci Notes.md`, registers the vault, and opens it immediately.
     - **"Open existing folder"** (Secondary action): Invokes `Directory.pickDirectoryAsync()`. If successful, verifies folder accessibility, seeds or reads notes, and registers the vault.
2. **Multi-Vault Registry & Persistence**:
   - Persist vault configuration in `${Paths.document.uri}/.davinci_vault_config.json`:
     ```ts
     export interface MobileVaultRegistry {
       activeVaultUri: string | null;
       vaults: Array<{
         uri: string;
         name: string;
         mode: "sandbox" | "saf" | "picked";
         createdAt: number;
       }>;
     }
     ```
   - Automatically auto-opens the last active vault on launch if accessible.
3. **Vault Switcher & Management**:
   - Add a Vault Switcher screen / dialog accessible from Settings and the Files navigation header:
     - Displays all known vaults with their storage type badge ("App Storage" vs "External Folder").
     - Allows instant switching, adding a new vault, or removing a vault from the registry (without deleting notes on disk).
4. **Seam & Architectural Isolation**:
   - All file operations continue to strictly flow through `MobileVaultStorageAdapter`. Zero UI screens or feature components import `expo-file-system` directly.
5. **Runtime Resilience**:
   - If the active vault becomes inaccessible (e.g. permission revoked or folder deleted externally), the app presents a recoverable state allowing the user to select another vault from the registry or create a new one, avoiding crashes.

## Consequences

- Fresh installs now present a clean, dark-first Obsidian onboarding experience with zero errors.
- Users can create multiple separate vaults (e.g., "Personal", "Work", "Research") and switch between them.
- Full performance is preserved (<150 ms startup scan) while supporting external folders where the runtime permits.
