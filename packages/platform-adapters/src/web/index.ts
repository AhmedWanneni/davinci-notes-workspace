export { createWebPlatformAdapters } from "./createWebPlatformAdapters";
export {
  FileSystemAccessAdapter,
  type DirectoryHandleLike,
  type FileHandleLike,
} from "./FileSystemAccessAdapter";
export { OpfsFileSystemAdapter } from "./OpfsFileSystemAdapter";
export {
  VAULT_INDEX_WEB_LOCK_NAME,
  withWebDbLock,
} from "./tabLockCoordinator";
export { normalizeVaultPath } from "./validateVaultPath";
export { WebDialogAdapter } from "./WebDialogAdapter";
export { WebExternalUrlAdapter } from "./WebExternalUrlAdapter";
export { WebNotificationAdapter } from "./WebNotificationAdapter";
export { WebSecretStoreAdapter } from "./WebSecretStoreAdapter";
export { WebSqliteAdapter, type SqliteDriver } from "./WebSqliteAdapter";
export { WebVaultRegistryAdapter } from "./WebVaultRegistryAdapter";
export { WebWatcherAdapter } from "./WebWatcherAdapter";
export { WebWindowControlsAdapter } from "./WebWindowControlsAdapter";
