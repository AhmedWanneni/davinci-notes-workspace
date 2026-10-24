export type {
  FileSystemAdapter,
  FileStat,
  VaultFileEntry,
} from "./FileSystemAdapter";
export type {
  WatcherAdapter,
  WatcherChangeEvent,
  WatcherUnlistenFn,
} from "./WatcherAdapter";
export type {
  SqliteAdapter,
  SqliteQueryResult,
} from "./SqliteAdapter";
export type {
  DialogAdapter,
  DialogConfirmOptions,
  FilePickResult,
  FolderPickResult,
} from "./DialogAdapter";
export type { SecretStoreAdapter } from "./SecretStoreAdapter";
export type { WindowControlsAdapter } from "./WindowControlsAdapter";
export type { ExternalUrlAdapter } from "./ExternalUrlAdapter";
export type {
  AppNotificationOptions,
  NotificationAdapter,
} from "./NotificationAdapter";
export type {
  RecentVaultEntry,
  VaultRegistryAdapter,
} from "./VaultRegistryAdapter";
export {
  getPlatformAdapters,
  hasPlatformAdapters,
  isWebPlatformMode,
  setPlatformAdapters,
  setWebPlatformMode,
  type PlatformAdapters,
} from "./PlatformContext";
export * from "./web";
