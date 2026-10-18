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
