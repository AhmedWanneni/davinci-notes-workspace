export type SyncthingLifecycleStatus =
  | "starting"
  | "running"
  | "stopped"
  | "crashed";

export interface SyncthingStatusResult {
  status: SyncthingLifecycleStatus;
  port: number;
  deviceId: string;
  reason?: string;
  binaryPath?: string;
  binaryExists?: boolean;
  binaryExecutable?: boolean;
  exitCode?: number;
  logs?: string[];
}

export interface SyncthingRunConditionsConfig {
  wifiOnly: boolean;
  chargingOnly: boolean;
  background: boolean;
}

export interface SyncthingStatusEvent {
  status: SyncthingLifecycleStatus;
  port?: number;
  deviceId?: string;
  reason?: string;
}
