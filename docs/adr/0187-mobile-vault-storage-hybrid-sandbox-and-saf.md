# ADR-0187: Mobile vault storage: hybrid sandbox by default with SAF fallback

## Status

Accepted (extends ADR-0012)

## Context

DaVinci Notes is a local-first note-taking application. On desktop, vaults are standard filesystem directories monitored by native filesystem watchers (`notify` in Rust). On mobile (iOS and Android), operating system sandboxing and permission models constrain direct filesystem access.

We evaluated two architectural models:
1. **App-Sandbox Storage (`expo-file-system` `documentDirectory`)**:
   - **Permissions Persistence**: 100% permanent. The app owns the sandbox. Zero permission revocations, zero system dialogs, zero stale security-scoped bookmarks.
   - **I/O & Scanning Performance**: Native POSIX speeds. Scanning 5,000 notes completes in < 150 ms with negligible memory overhead (< 15 MB).
   - **Sync**: Fully compatible with internal background sync (`@app/sync-client` via Google Drive).
   - **External Editing**: On iOS, enabling `UIFileSharingEnabled` ("Application supports iTunes file sharing") and `LSSupportsOpeningDocumentsInPlace` exposes the sandbox directly in the native iOS **Files app** (`On My iPhone > DaVinci Notes`), allowing external editors (Runestone, Taio, Textastic) to read/write in place. On Android, files are accessible in the app-specific external files directory or internal sandbox.
2. **User-Picked Folder (Android SAF / iOS Document Picker)**:
   - **Permissions Persistence**: Fragile. Android SAF persistable permissions (`takePersistableUriPermission`) can be lost across OS reboots, app updates, or manufacturer power-saving passes. iOS security-scoped bookmarks require continuous renewal and can be invalidated when files are moved.
   - **I/O & Scanning Performance**: Severely degraded on Android. Storage Access Framework (SAF) routes every directory and file query through ContentProvider IPC (`DocumentsContract.buildChildDocumentsUriUsingTree`). Traversing 5,000 files across 100 nested folders takes 15–30+ seconds.
   - **Sync & External Editing**: Allows users with existing folders (e.g. Syncthing directories or SD card vaults) to point the app directly to that folder.

## Decision

Adopt a **Hybrid Storage Architecture**:
1. **Sandbox-by-Default (Primary)**:
   - Default new vaults and imported notes are stored in app-sandboxed POSIX storage (`${FileSystem.documentDirectory}vault/`).
   - Configure iOS `UIFileSharingEnabled = true` and `LSSupportsOpeningDocumentsInPlace = true` so users can access and edit notes externally through the native iOS Files app.
   - On Android, default vaults live in standard app storage with POSIX access.
2. **User-Picked Folder Support (Optional)**:
   - Support opening external folders via Android Storage Access Framework (`StorageAccessFramework`) and iOS document picker.
   - External SAF vaults use tree URIs and persist permissions using `takePersistableUriPermission`.
3. **Unified Storage Adapter Interface**:
   - Both storage backends implement a single uniform `MobileVaultStorageAdapter` adhering to the shared I/O seams used by `@app/attachments` (`AttachmentFileSystem`), `@app/sync-client` (`ManifestSource`, `LocalChangeApplier`), and desktop vault commands (`readNote`, `writeNote`, `listNotes`, `statNote`, `deleteNote`, `renameNote`).
4. **Foreground Reconciliation**:
   - Because mobile OSes do not provide reliable background filesystem watcher events for external edits, changes made outside the app (Files app, Syncthing) are reconciled on app foreground using a cheap `mtime`/`size` diff against an in-memory cache, avoiding expensive full re-scans.
5. **Revocation & Missing Folder Recovery**:
   - If an external folder permission is revoked or a vault directory is removed, the app enters a graceful, recoverable error state rather than crashing.

## Consequences

- The app achieves sub-150ms scan times on 5,000-note vaults by default.
- Users can still edit files with external desktop-synced tools or the iOS Files app.
- Advanced users on Android can mount existing Syncthing or SD card folders via SAF.
- Shared package code is 100% reused without forking.
