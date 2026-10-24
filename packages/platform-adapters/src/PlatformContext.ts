import type { DialogAdapter } from "./DialogAdapter";
import type { ExternalUrlAdapter } from "./ExternalUrlAdapter";
import type { FileSystemAdapter } from "./FileSystemAdapter";
import type { NotificationAdapter } from "./NotificationAdapter";
import type { SecretStoreAdapter } from "./SecretStoreAdapter";
import type { SqliteAdapter } from "./SqliteAdapter";
import type { VaultRegistryAdapter } from "./VaultRegistryAdapter";
import type { WatcherAdapter } from "./WatcherAdapter";
import type { WindowControlsAdapter } from "./WindowControlsAdapter";

export interface PlatformAdapters {
  fs: FileSystemAdapter;
  watcher: WatcherAdapter;
  sqlite: SqliteAdapter;
  dialog: DialogAdapter;
  secrets: SecretStoreAdapter;
  windowControls: WindowControlsAdapter;
  externalUrl: ExternalUrlAdapter;
  notifications: NotificationAdapter;
  vaultRegistry: VaultRegistryAdapter;
}

let activePlatformAdapters: PlatformAdapters | undefined;
let webPlatformMode = false;

export function setWebPlatformMode(enabled: boolean): void {
  webPlatformMode = enabled;
}

export function isWebPlatformMode(): boolean {
  return webPlatformMode;
}

export function setPlatformAdapters(
  adapters: PlatformAdapters | Partial<PlatformAdapters> | undefined,
): void {
  activePlatformAdapters = adapters as PlatformAdapters | undefined;
  if (adapters === undefined) {
    webPlatformMode = false;
  }
}

export function getPlatformAdapters(): PlatformAdapters {
  if (!activePlatformAdapters) {
    throw new Error(
      "Platform adapters have not been initialized. Call setPlatformAdapters() at application startup.",
    );
  }
  return activePlatformAdapters;
}

export function hasPlatformAdapters(): boolean {
  return activePlatformAdapters !== undefined;
}
