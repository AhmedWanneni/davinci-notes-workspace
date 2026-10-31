import type {
  SyncthingPendingDevice,
  SyncthingPendingFolder,
} from "@app/syncthing-api";
import {
  normalizeDeviceId,
  isValidDeviceIdFormat,
  sanitizeError,
} from "@app/syncthing-api";
import {
  MobileSyncthingError,
  mobileSyncthingStatus,
  mobileSyncthingFetch,
} from "./mobileSyncthingClient";

export async function mobileSyncthingAddDevice(
  apiKey: string,
  id: string,
  name: string,
): Promise<void> {
  const cleanId = normalizeDeviceId(id);
  if (!isValidDeviceIdFormat(cleanId)) {
    throw new MobileSyncthingError(
      "unexpected-response",
      "Invalid Syncthing Device ID (expected 56 characters)",
    );
  }

  const stat = await mobileSyncthingStatus(apiKey);
  if (normalizeDeviceId(stat.deviceId) === cleanId) {
    throw new MobileSyncthingError(
      "unexpected-response",
      "Cannot add this device: this is your own Device ID.",
    );
  }

  // Check if device is already configured
  const checkRes = await mobileSyncthingFetch(apiKey, "/rest/config/devices");
  if (checkRes.ok) {
    const devs = (await checkRes.json()) as Array<{ deviceID?: string }>;
    if (devs.some((d) => normalizeDeviceId(d.deviceID || "") === cleanId)) {
      throw new MobileSyncthingError(
        "unexpected-response",
        "Device already added.",
      );
    }
  }

  const payload = {
    deviceID: cleanId,
    name: name.trim(),
    addresses: ["dynamic"],
    compression: "metadata",
  };

  const res = await mobileSyncthingFetch(apiKey, "/rest/config/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new MobileSyncthingError(
      "unexpected-response",
      sanitizeError(txt || `HTTP ${res.status}`, apiKey),
    );
  }
}

export async function mobileSyncthingPendingDevices(
  apiKey: string,
): Promise<SyncthingPendingDevice[]> {
  const res = await mobileSyncthingFetch(
    apiKey,
    "/rest/cluster/pending/devices",
  );
  if (!res.ok) return [];

  const raw = (await res.json()) as Record<
    string,
    { name?: string; address?: string; time?: string }
  >;
  return Object.entries(raw).map(([deviceId, entry]) => ({
    deviceId,
    name: entry.name || "",
    address: entry.address || "",
    time: entry.time || "",
  }));
}

export async function mobileSyncthingAcceptDevice(
  apiKey: string,
  id: string,
): Promise<void> {
  const pendings = await mobileSyncthingPendingDevices(apiKey);
  const match = pendings.find(
    (d) => normalizeDeviceId(d.deviceId) === normalizeDeviceId(id),
  );
  await mobileSyncthingAddDevice(apiKey, id, match?.name || "Desktop");
}

export async function mobileSyncthingDismissPendingDevice(
  apiKey: string,
  id: string,
): Promise<void> {
  await mobileSyncthingFetch(
    apiKey,
    `/rest/cluster/pending/devices?device=${encodeURIComponent(id.trim())}`,
    { method: "DELETE" },
  );
}

export async function mobileSyncthingPendingFolders(
  apiKey: string,
): Promise<SyncthingPendingFolder[]> {
  const res = await mobileSyncthingFetch(
    apiKey,
    "/rest/cluster/pending/folders",
  );
  if (!res.ok) return [];

  const raw = (await res.json()) as Record<
    string,
    {
      label?: string;
      offeredBy?: string | Record<string, { label?: string; time?: string }>;
      time?: string;
    }
  >;

  const result: SyncthingPendingFolder[] = [];
  for (const [folderId, entry] of Object.entries(raw)) {
    if (typeof entry.offeredBy === "object" && entry.offeredBy !== null) {
      for (const [devId, details] of Object.entries(entry.offeredBy)) {
        result.push({
          folderId,
          label: details?.label || entry.label || "Vault",
          offeredBy: devId,
          time: details?.time || entry.time || "",
        });
      }
    } else {
      result.push({
        folderId,
        label: entry.label || "Vault",
        offeredBy: typeof entry.offeredBy === "string" ? entry.offeredBy : "",
        time: entry.time || "",
      });
    }
  }
  return result;
}

export async function mobileSyncthingDismissPendingFolder(
  apiKey: string,
  folderId: string,
): Promise<void> {
  await mobileSyncthingFetch(
    apiKey,
    `/rest/cluster/pending/folders?folder=${encodeURIComponent(folderId.trim())}`,
    { method: "DELETE" },
  );
}

export async function mobileSyncthingAcceptFolder(
  apiKey: string,
  folderId: string,
  targetPath: string,
): Promise<void> {
  const [pendings, stat] = await Promise.all([
    mobileSyncthingPendingFolders(apiKey),
    mobileSyncthingStatus(apiKey),
  ]);

  const folder = pendings.find((f) => f.folderId === folderId);
  const offeredBy = folder?.offeredBy || "";
  const label = folder?.label || "Vault";

  const devices = [{ deviceID: stat.deviceId }];
  if (offeredBy) {
    devices.push({ deviceID: offeredBy });
  }

  // Strip file:// scheme and decode URI for POSIX filesystem path
  const normalizedPath = targetPath.startsWith("file://")
    ? decodeURIComponent(targetPath.replace(/^file:\/\//, ""))
    : targetPath;

  const payload = {
    id: folderId,
    label,
    path: normalizedPath,
    type: "sendreceive",
    devices,
    rescanIntervalS: 60,
    fsWatcherEnabled: true,
    fsWatcherDelayS: 10,
  };

  const res = await mobileSyncthingFetch(apiKey, "/rest/config/folders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new MobileSyncthingError(
      "unexpected-response",
      sanitizeError(txt || `HTTP ${res.status}`, apiKey),
    );
  }
}

export async function mobileSyncthingConnectedDevices(
  apiKey: string,
): Promise<string[]> {
  const res = await mobileSyncthingFetch(apiKey, "/rest/system/connections");
  if (!res.ok) return [];

  const data = (await res.json()) as {
    connections?: Record<string, { connected?: boolean }>;
  };
  const conns = data.connections || {};
  return Object.entries(conns)
    .filter(([_, info]) => info.connected === true)
    .map(([id]) => id);
}
