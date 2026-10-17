import { invoke } from "@tauri-apps/api/core";

export type {
  SyncthingDetectResult,
  SyncthingStatusResult,
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingCheckItem,
  SyncthingRemoteConnectedItem,
  SyncthingFolderStateItem,
  SyncthingFolderErrorsItem,
  SyncthingSelfTestItem,
  SyncthingCheckReport,
} from "@app/syncthing-api";

export async function fetchSyncthingDetect(): Promise<SyncthingDetectResult> {
  return invoke<SyncthingDetectResult>("syncthing_detect");
}

export async function fetchSyncthingStatus(): Promise<SyncthingStatusResult> {
  return invoke<SyncthingStatusResult>("syncthing_status");
}

export async function fetchSyncthingQrPng(): Promise<string> {
  return invoke<string>("syncthing_qr_png");
}

export async function syncthingAddDevice(
  id: string,
  name: string,
): Promise<void> {
  return invoke<void>("syncthing_add_device", { id, name });
}

export async function syncthingPendingDevices(): Promise<
  SyncthingPendingDevice[]
> {
  return invoke<SyncthingPendingDevice[]>("syncthing_pending_devices");
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

export async function syncthingPendingFolders(): Promise<
  SyncthingPendingFolder[]
> {
  return invoke<SyncthingPendingFolder[]>("syncthing_pending_folders");
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
