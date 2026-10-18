import { normalizeDeviceId } from "@app/syncthing-api";
import {
  mobileSyncthingStatus,
  mobileSyncthingFetch,
} from "./mobileSyncthingClient";

/**
 * Updates the local Syncthing device name so other nodes (e.g. desktop)
 * can see the announced name (including the pairing verification code).
 */
export async function mobileSyncthingSetLocalDeviceName(
  apiKey: string,
  name: string,
): Promise<void> {
  const cleanName = name.trim();
  if (!cleanName) return;

  const stat = await mobileSyncthingStatus(apiKey);
  const myId = stat.deviceId;
  if (!myId) return;

  // Update local device entry in devices config
  const devPayload = {
    deviceID: myId,
    name: cleanName,
  };

  const res = await mobileSyncthingFetch(
    apiKey,
    `/rest/config/devices/${encodeURIComponent(myId)}`,
    {
      method: "PUT",
      body: JSON.stringify(devPayload),
    },
  );

  if (!res.ok) {
    // Fallback: also try updating options
    await mobileSyncthingFetch(apiKey, "/rest/config/options", {
      method: "PATCH",
      body: JSON.stringify({ deviceName: cleanName }),
    }).catch(() => {});
  }
}

export interface SyncthingFolderCompletion {
  completion: number;
  needBytes: number;
  globalBytes: number;
  needItems: number;
}

/**
 * Retrieves sync completion status for a specific folder and optional remote device.
 */
export async function mobileSyncthingFolderCompletion(
  apiKey: string,
  folderId: string,
  deviceId?: string,
): Promise<SyncthingFolderCompletion> {
  let url = `/rest/db/completion?folder=${encodeURIComponent(folderId.trim())}`;
  if (deviceId) {
    url += `&device=${encodeURIComponent(normalizeDeviceId(deviceId))}`;
  }

  const res = await mobileSyncthingFetch(apiKey, url);
  if (!res.ok) {
    return { completion: 0, needBytes: 0, globalBytes: 0, needItems: 0 };
  }

  const data = (await res.json()) as {
    completion?: number;
    needBytes?: number;
    globalBytes?: number;
    needItems?: number;
  };

  return {
    completion: typeof data.completion === "number" ? Math.round(data.completion) : 0,
    needBytes: typeof data.needBytes === "number" ? data.needBytes : 0,
    globalBytes: typeof data.globalBytes === "number" ? data.globalBytes : 0,
    needItems: typeof data.needItems === "number" ? data.needItems : 0,
  };
}

/**
 * Checks if a specific remote device is actively connected.
 */
export async function mobileSyncthingIsDeviceConnected(
  apiKey: string,
  deviceId: string,
): Promise<boolean> {
  const cleanId = normalizeDeviceId(deviceId);
  const res = await mobileSyncthingFetch(apiKey, "/rest/system/connections");
  if (!res.ok) return false;

  const data = (await res.json()) as {
    connections?: Record<string, { connected?: boolean }>;
  };
  const conns = data.connections || {};
  return Object.entries(conns).some(
    ([id, info]) => normalizeDeviceId(id) === cleanId && info.connected === true,
  );
}


/**
 * Checks if a folder is already configured locally in Syncthing.
 */
export async function mobileSyncthingIsFolderConfigured(
  apiKey: string,
  folderId: string,
): Promise<boolean> {
  const res = await mobileSyncthingFetch(apiKey, "/rest/config/folders");
  if (!res.ok) return false;

  const folders = (await res.json()) as Array<{ id?: string }>;
  return folders.some((f) => f.id === folderId);
}

/**
 * Triggers an immediate folder rescan in Syncthing (or all folders if none specified).
 */
export async function mobileSyncthingTriggerScan(
  apiKey: string = "",
  folderId?: string,
): Promise<boolean> {
  let url = "/rest/db/scan";
  if (folderId && folderId.trim()) {
    url += `?folder=${encodeURIComponent(folderId.trim())}`;
  }
  const res = await mobileSyncthingFetch(apiKey, url, { method: "POST" });
  return res.ok;
}

