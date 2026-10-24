import { setWebPlatformMode, type PlatformAdapters } from "@app/platform-adapters";
import { TauriDialogAdapter } from "./TauriDialogAdapter";
import { TauriExternalUrlAdapter } from "./TauriExternalUrlAdapter";
import { TauriFileSystemAdapter } from "./TauriFileSystemAdapter";
import { TauriNotificationAdapter } from "./TauriNotificationAdapter";
import { TauriSecretStoreAdapter } from "./TauriSecretStoreAdapter";
import { TauriSqliteAdapter } from "./TauriSqliteAdapter";
import { TauriVaultRegistryAdapter } from "./TauriVaultRegistryAdapter";
import { TauriWatcherAdapter } from "./TauriWatcherAdapter";
import { TauriWindowControlsAdapter } from "./TauriWindowControlsAdapter";

export function createDesktopPlatformAdapters(): PlatformAdapters {
  setWebPlatformMode(false);
  return {
    fs: new TauriFileSystemAdapter(),
    watcher: new TauriWatcherAdapter(),
    sqlite: new TauriSqliteAdapter(),
    dialog: new TauriDialogAdapter(),
    secrets: new TauriSecretStoreAdapter(),
    windowControls: new TauriWindowControlsAdapter(),
    externalUrl: new TauriExternalUrlAdapter(),
    notifications: new TauriNotificationAdapter(),
    vaultRegistry: new TauriVaultRegistryAdapter(),
  };
}
