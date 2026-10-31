import type {
  SyncthingConfiguredDevice,
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingSharedVault,
  SyncthingState,
} from "@app/syncthing-api";

export interface MobileSyncthingState {
  status: SyncthingState | "loading";
  version: string;
  deviceId: string;
  deviceName: string;
  qrUrl: string | null;
  hasSavedKey: boolean;
  isLoading: boolean;
  isEmbedded: boolean;
  errorMessage: string | null;
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  configuredDevices: SyncthingConfiguredDevice[];
  sharedVaults: SyncthingSharedVault[];
  connectedDevices: string[];
  refresh: () => Promise<void>;
  startService?: () => Promise<void>;
  stopService?: () => Promise<void>;
  saveKey: (key: string) => Promise<void>;
  clearKey: () => Promise<void>;
  addDevice: (id: string, name: string) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  acceptDevice: (id: string) => Promise<void>;
  dismissDevice: (id: string) => Promise<void>;
  acceptFolder: (folderId: string, targetPath: string) => Promise<void>;
  dismissFolder: (folderId: string) => Promise<void>;
  unshareFolder: (folderId: string) => Promise<void>;
}
