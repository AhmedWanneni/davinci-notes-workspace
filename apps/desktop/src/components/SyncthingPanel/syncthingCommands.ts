import { invoke } from "@tauri-apps/api/core";

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

export async function fetchSyncthingDetect(): Promise<SyncthingDetectResult> {
  return invoke<SyncthingDetectResult>("syncthing_detect");
}

export async function fetchSyncthingStatus(): Promise<SyncthingStatusResult> {
  return invoke<SyncthingStatusResult>("syncthing_status");
}

export async function fetchSyncthingQrPng(): Promise<string> {
  return invoke<string>("syncthing_qr_png");
}
