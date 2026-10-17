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
} from "./mobileSyncthingClient";

const BASE_URL = "http://127.0.0.1:8384";
const TIMEOUT_MS = 3000;

async function authedFetch(
  apiKey: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "X-API-Key": apiKey.trim(),
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    const safeMsg = sanitizeError(err, apiKey);
    throw new MobileSyncthingError("unreachable", `Syncthing unreachable: ${safeMsg}`);
  } finally {
    clearTimeout(timer);
  }
}

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
  const checkRes = await authedFetch(apiKey, "/rest/config/devices");
  if (checkRes.ok) {
    const devs = (await checkRes.json()) as Array<{ deviceID?: string }>;
    if (devs.some((d) => normalizeDeviceId(d.deviceID || "") === cleanId)) {
      throw new MobileSyncthingError("unexpected-response", "Device already added.");
    }
  }

  const payload = {
    deviceID: cleanId,
    name: name.trim(),
    addresses: ["dynamic"],
    compression: "metadata",
  };

  const res = await authedFetch(apiKey, "/rest/config/devices", {
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
  const res = await authedFetch(apiKey, "/rest/cluster/pending/devices");
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
  await authedFetch(
    apiKey,
    `/rest/cluster/pending/devices?device=${encodeURIComponent(id.trim())}`,
    { method: "DELETE" },
  );
}

export async function mobileSyncthingPendingFolders(
  apiKey: string,
): Promise<SyncthingPendingFolder[]> {
  const res = await authedFetch(apiKey, "/rest/cluster/pending/folders");
  if (!res.ok) return [];

  const raw = (await res.json()) as Record<
    string,
    { label?: string; offeredBy?: string; time?: string }
  >;
  return Object.entries(raw).map(([folderId, entry]) => ({
    folderId,
    label: entry.label || "Vault",
    offeredBy: entry.offeredBy || "",
    time: entry.time || "",
  }));
}

export async function mobileSyncthingDismissPendingFolder(
  apiKey: string,
  folderId: string,
): Promise<void> {
  await authedFetch(
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

  const payload = {
    id: folderId,
    label,
    path: targetPath,
    type: "sendreceive",
    devices,
  };

  const res = await authedFetch(apiKey, "/rest/config/folders", {
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
  const res = await authedFetch(apiKey, "/rest/system/connections");
  if (!res.ok) return [];

  const data = (await res.json()) as {
    connections?: Record<string, { connected?: boolean }>;
  };
  const conns = data.connections || {};
  return Object.entries(conns)
    .filter(([_, info]) => info.connected === true)
    .map(([id]) => id);
}
