import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  SyncthingConfiguredDevice,
  SyncthingSharedVault,
  SyncthingCheckReport,
} from "@app/syncthing-api";

export type {
  SyncthingDetectResult,
  SyncthingStatusResult,
  SyncthingConfiguredDevice,
  SyncthingSharedVault,
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingCheckItem,
  SyncthingRemoteConnectedItem,
  SyncthingFolderStateItem,
  SyncthingFolderErrorsItem,
  SyncthingSelfTestItem,
  SyncthingCheckReport,
} from "@app/syncthing-api";

export type SyncthingLifecycleState =
  "starting" | "running" | "stopped" | "crashed";

export interface SyncthingLifecycleStatus {
  state: SyncthingLifecycleState;
  reason?: string;
  guiAddress?: string;
  deviceId?: string;
  deviceName?: string;
  version?: string;
  lastLogs?: string[];
}

export async function syncthingStart(): Promise<SyncthingLifecycleStatus> {
  return invoke<SyncthingLifecycleStatus>("syncthing_start");
}

export async function syncthingStop(): Promise<SyncthingLifecycleStatus> {
  return invoke<SyncthingLifecycleStatus>("syncthing_stop");
}

export async function syncthingRestart(): Promise<SyncthingLifecycleStatus> {
  return invoke<SyncthingLifecycleStatus>("syncthing_restart");
}

export async function syncthingGetLifecycleStatus(): Promise<SyncthingLifecycleStatus> {
  return invoke<SyncthingLifecycleStatus>("syncthing_lifecycle_status");
}

export async function listenSyncthingStatus(
  callback: (status: SyncthingLifecycleStatus) => void,
): Promise<UnlistenFn> {
  return listen<SyncthingLifecycleStatus>("syncthing://status", (event) => {
    callback(event.payload);
  });
}

export async function fetchSyncthingDetect(): Promise<{
  running: boolean;
  version: string;
  guiAddress: string;
}> {
  return invoke("syncthing_detect");
}

export async function fetchSyncthingStatus(): Promise<{
  deviceId: string;
  deviceName: string;
  uptime: number;
}> {
  return invoke("syncthing_status");
}

export interface SyncthingVaultFolderInfo {
  folderId: string;
  folderLabel: string;
}

export async function fetchSyncthingQrPng(text?: string): Promise<string> {
  return invoke<string>("syncthing_qr_png", { text: text || null });
}

export async function syncthingEnsureVaultRegistered(): Promise<SyncthingVaultFolderInfo> {
  return invoke<SyncthingVaultFolderInfo>("syncthing_ensure_vault_registered");
}

export async function syncthingAddDevice(
  id: string,
  name: string,
): Promise<void> {
  return invoke<void>("syncthing_add_device", { id, name });
}

export async function syncthingListDevices(): Promise<
  SyncthingConfiguredDevice[]
> {
  return invoke<SyncthingConfiguredDevice[]>("syncthing_list_devices");
}

export async function syncthingRemoveDevice(id: string): Promise<void> {
  return invoke<void>("syncthing_remove_device", { id });
}

export async function syncthingPendingDevices() {
  return invoke("syncthing_pending_devices");
}

export async function syncthingAcceptDevice(id: string): Promise<void> {
  return invoke<void>("syncthing_accept_device", { id });
}

export async function syncthingDismissPendingDevice(id: string): Promise<void> {
  return invoke<void>("syncthing_dismiss_pending_device", { id });
}

export async function syncthingShareVaultFolder(
  deviceId: string,
): Promise<string> {
  return invoke<string>("syncthing_share_vault_folder", { deviceId });
}

export async function syncthingPendingFolders() {
  return invoke("syncthing_pending_folders");
}

export async function syncthingAcceptFolder(
  folderId: string,
  path: string,
  allowNonEmpty?: boolean,
): Promise<void> {
  return invoke<void>("syncthing_accept_folder", {
    folderId,
    path,
    allowNonEmpty: allowNonEmpty ?? false,
  });
}

export async function syncthingCheckSync(): Promise<SyncthingCheckReport> {
  return invoke<SyncthingCheckReport>("syncthing_check_sync");
}

export async function syncthingListSharedVaults(): Promise<
  SyncthingSharedVault[]
> {
  return invoke<SyncthingSharedVault[]>("syncthing_list_shared_vaults");
}

export async function syncthingUnshareVaultFolder(
  folderId: string,
): Promise<void> {
  return invoke<void>("syncthing_unshare_vault_folder", { folderId });
}

export async function showInFolder(path: string): Promise<void> {
  return invoke<void>("show_in_folder", { path });
}
