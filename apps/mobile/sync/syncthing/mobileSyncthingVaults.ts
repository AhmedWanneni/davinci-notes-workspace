import type { SyncthingSharedVault } from "@app/syncthing-api";
import { normalizeDeviceId } from "@app/syncthing-api";
import { mobileSyncthingFetch } from "./mobileSyncthingClient";
import { toPosixPath } from "../../vault/pathUtils";

export async function mobileSyncthingListSharedVaults(
  apiKey: string,
  activeVaultUri?: string,
  localDeviceId?: string,
): Promise<SyncthingSharedVault[]> {
  const res = await mobileSyncthingFetch(apiKey, "/rest/config/folders");
  if (!res.ok) return [];

  const rawFolders = (await res.json()) as Array<{
    id?: string;
    label?: string;
    path?: string;
    paused?: boolean;
    devices?: Array<{ deviceID?: string }>;
  }>;

  const cleanLocalId = localDeviceId ? normalizeDeviceId(localDeviceId) : "";

  return rawFolders
    .filter((f) => f.id)
    .map((f) => {
      const sharedWith = (f.devices || [])
        .map((d) => d.deviceID || "")
        .filter((id) => id && normalizeDeviceId(id) !== cleanLocalId);

      const normFolderPath = f.path ? toPosixPath(f.path) : "";
      const normActivePath = activeVaultUri ? toPosixPath(activeVaultUri) : "";
      const isActive = Boolean(
        normActivePath &&
        normFolderPath &&
        (normFolderPath === normActivePath ||
          normActivePath.endsWith(normFolderPath) ||
          normFolderPath.endsWith(normActivePath)),
      );

      return {
        folderId: f.id || "",
        label: f.label || f.id || "Vault",
        path: f.path || "",
        sharedWithDeviceIds: sharedWith,
        paused: f.paused ?? false,
        isActiveVault: isActive,
      };
    });
}

export async function mobileSyncthingUnshareFolder(
  apiKey: string,
  folderId: string,
): Promise<void> {
  const cleanId = folderId.trim();
  await mobileSyncthingFetch(
    apiKey,
    `/rest/config/folders/${encodeURIComponent(cleanId)}`,
    {
      method: "DELETE",
    },
  );
}
