export type SyncStatus =
  | "idle"
  | "syncing"
  | "conflict"
  | "error"
  | "reauth-required"
  | "paused-low-battery"
  | "paused-metered"
  | "interrupted";

export type SyncPhase =
  | "idle"
  | "generating-manifest"
  | "diffing"
  | "uploading"
  | "downloading"
  | "indexing"
  | "complete";

export interface SyncProgress {
  phase: SyncPhase;
  current: number;
  total: number;
  currentItem?: string;
}

export type NetworkType = "wifi" | "cellular" | "none" | "unknown";

export interface NetworkBatteryState {
  networkType: NetworkType;
  isMetered: boolean;
  batteryLevel: number; // 0.0 to 1.0 (or -1 if unknown)
  isLowPowerMode: boolean;
}

export interface SyncPolicyConfig {
  allowCellularSync: boolean; // if false, pauses large/binary uploads on cellular
  pauseOnLowBattery: boolean; // if true, pauses auto-sync below threshold
  lowBatteryThresholdPercent: number; // e.g. 20 (0.20)
  autoSyncOnForeground: boolean;
  autoSyncOnSave: boolean;
  saveDebounceMs: number;
}

export interface SyncConflictInfo {
  path: string;
  localHash?: string;
  remoteHash?: string;
  message: string;
  resolution?: string;
}

export interface SyncPassResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  conflicts: SyncConflictInfo[];
  error?: string;
  reauthRequired?: boolean;
  interrupted?: boolean;
  policyReason?: string;
  pendingChangesCount?: number;
}
