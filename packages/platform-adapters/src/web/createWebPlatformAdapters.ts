import { setWebPlatformMode, type PlatformAdapters } from "../PlatformContext";
import { OpfsFileSystemAdapter } from "./OpfsFileSystemAdapter";
import { WebDialogAdapter } from "./WebDialogAdapter";
import { WebExternalUrlAdapter } from "./WebExternalUrlAdapter";
import { WebNotificationAdapter } from "./WebNotificationAdapter";
import { WebSecretStoreAdapter } from "./WebSecretStoreAdapter";
import { WebSqliteAdapter } from "./WebSqliteAdapter";
import { WebVaultRegistryAdapter } from "./WebVaultRegistryAdapter";
import { WebWatcherAdapter } from "./WebWatcherAdapter";
import { WebWindowControlsAdapter } from "./WebWindowControlsAdapter";

export function createWebPlatformAdapters(
  overrides?: Partial<PlatformAdapters>
): PlatformAdapters {
  setWebPlatformMode(true);
  return {
    fs: overrides?.fs ?? new OpfsFileSystemAdapter(),
    watcher: overrides?.watcher ?? new WebWatcherAdapter(),
    sqlite: overrides?.sqlite ?? new WebSqliteAdapter(),
    dialog: overrides?.dialog ?? new WebDialogAdapter(),
    secrets: overrides?.secrets ?? new WebSecretStoreAdapter(),
    windowControls: overrides?.windowControls ?? new WebWindowControlsAdapter(),
    externalUrl: overrides?.externalUrl ?? new WebExternalUrlAdapter(),
    notifications: overrides?.notifications ?? new WebNotificationAdapter(),
    vaultRegistry: overrides?.vaultRegistry ?? new WebVaultRegistryAdapter(),
  };
}
