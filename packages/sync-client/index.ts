export const name = "@app/sync-client";
export { currentManifestEntries, generateManifest } from "./manifest";
export type {
  ManifestEntry,
  ManifestFile,
  ManifestResult,
  ManifestSnapshot,
  ManifestSource,
  ManifestGenerationOptions,
} from "./manifest";
export {
  DRIVE_APPDATA_SCOPE,
  DRIVE_FILE_SCOPE,
  DriveReauthRequiredError,
  DriveTokenManager,
  startDriveLogin,
} from "./driveAuth";
export { createJsonManifestStore } from "./manifestStore";
export type { ManifestStorage, ManifestStore } from "./manifestStore";
export type {
  LoginRequest,
  LoginStart,
  OAuthToken,
  OAuthTransport,
  PkceProvider,
  TokenStore,
} from "./driveAuth";
export { getOrCreateDeviceId } from "./deviceIdentity";
export type {
  DeviceIdRandomSource,
  DeviceIdentityStorage,
} from "./deviceIdentity";
export { classifySyncDiff } from "./syncDiff";
export type { SyncClassification, SyncDiff } from "./syncDiff";
export { DriveApiError, DriveClient } from "./driveApi";
export type {
  DriveChange,
  DriveClientOptions,
  DriveFile,
  DriveHttp,
} from "./driveApi";
export type { ContentUpload } from "./driveApi";
export { DriveManifestStore } from "./driveManifestStore";
export { applyPulledChanges } from "./applyPulledChanges";
export type {
  IncrementalIndexUpdater,
  LocalChangeApplier,
  PulledChange,
} from "./applyPulledChanges";
export {
  commitDriveManifestCursor,
  runDriveManifestSync,
} from "./driveSyncPass";
export type {
  DriveManifestSyncInput,
  DriveManifestSyncResult,
  DriveSyncStateStore,
  StoredState,
} from "./driveSyncPass";
export { createSyncStateStore } from "./syncState";
export type { SyncState, SyncStateStorage } from "./syncState";
export {
  isTextMergeable,
  resolveBinaryConflictName,
  resolveDeleteVsEdit,
  resolveTextConflict,
} from "./conflictResolver";
export type {
  BinaryConflictInput,
  BinaryConflictResult,
  DeleteVsEditInput,
  DeleteVsEditResult,
  TextConflictInput,
  TextConflictKind,
  TextConflictResult,
} from "./conflictResolver";
