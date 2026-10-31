import type { SyncthingConfiguredDevice } from "@app/syncthing-api";
import { normalizeDeviceId } from "@app/syncthing-api";
import { mobileSyncthingFetch } from "./mobileSyncthingClient";

export async function mobileSyncthingListDevices(
  apiKey: string,
  localDeviceId?: string,
): Promise<SyncthingConfiguredDevice[]> {
  const [devRes, connRes, folderRes] = await Promise.all([
    mobileSyncthingFetch(apiKey, "/rest/config/devices"),
    mobileSyncthingFetch(apiKey, "/rest/system/connections"),
    mobileSyncthingFetch(apiKey, "/rest/config/folders"),
  ]);

  if (!devRes.ok) return [];
  const rawDevs = (await devRes.json()) as Array<{
    deviceID?: string;
    name?: string;
    paused?: boolean;
    addresses?: string[];
  }>;

  const conns = connRes.ok
    ? (((await connRes.json()) as { connections?: Record<string, { connected?: boolean; address?: string }> }).connections || {})
    : {};

  const folders = folderRes.ok
    ? ((await folderRes.json()) as Array<{ devices?: Array<{ deviceID?: string }> }>)
    : [];

  const cleanLocalId = localDeviceId ? normalizeDeviceId(localDeviceId) : "";

  return rawDevs
    .filter((d) => d.deviceID && normalizeDeviceId(d.deviceID) !== cleanLocalId)
    .map((d) => {
      const devId = d.deviceID || "";
      const cleanId = normalizeDeviceId(devId);
      const connInfo = conns[devId];
      const isConnected = connInfo?.connected === true;
      const isShared = folders.some((f) =>
        f.devices?.some((dev) => normalizeDeviceId(dev.deviceID || "") === cleanId),
      );

      return {
        deviceId: devId,
        name: d.name || "",
        connected: isConnected,
        paused: d.paused ?? false,
        address: connInfo?.address,
        isVaultShared: isShared,
      };
    });
}

export async function mobileSyncthingRemoveDevice(
  apiKey: string,
  deviceId: string,
): Promise<void> {
  const cleanId = normalizeDeviceId(deviceId);
  await mobileSyncthingFetch(apiKey, `/rest/config/devices/${encodeURIComponent(cleanId)}`, {
    method: "DELETE",
  });
}
