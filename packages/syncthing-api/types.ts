export type SyncthingState =
  "running" | "not-running" | "not-installed" | "bad-key";

export interface SyncthingDetectResult {
  running: boolean;
  version: string;
  guiAddress: string;
}

export interface SyncthingStatusResult {
  deviceId: string;
  deviceName: string;
  uptime: number;
}

export interface SyncthingPendingDevice {
  deviceId: string;
  name: string;
  address: string;
  time: string;
}

export interface SyncthingPendingFolder {
  folderId: string;
  label: string;
  offeredBy: string;
  time: string;
}

export interface SyncthingCheckItem {
  passed: boolean;
  reason: string;
}

export interface SyncthingRemoteConnectedItem {
  passed: boolean;
  reason: string;
  connectedDevices: string[];
}

export interface SyncthingFolderStateItem {
  passed: boolean;
  reason: string;
  folderId: string | null;
  state: string | null;
  outOfSyncItems: number;
  remoteCompletions: Record<string, number>;
}

export interface SyncthingFolderErrorsItem {
  passed: boolean;
  reason: string;
  errors: string[];
}

export interface SyncthingSelfTestItem {
  passed: boolean;
  reason: string;
  roundTripMs: number | null;
}

export interface SyncthingCheckReport {
  reachability: SyncthingCheckItem;
  remoteConnected: SyncthingRemoteConnectedItem;
  folderState: SyncthingFolderStateItem;
  folderErrors: SyncthingFolderErrorsItem;
  selfTest: SyncthingSelfTestItem;
}

export interface SyncthingStatusState {
  status: SyncthingState;
  version: string;
  guiAddress: string;
  deviceId: string;
  deviceName: string;
  uptime: number;
  qrDataUrl: string | null;
  errorMessage: string | null;
  isLoading: boolean;
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
}
