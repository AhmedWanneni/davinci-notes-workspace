import { useCallback, useEffect, useState } from "react";
import type {
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingState,
} from "@app/syncthing-api";
import {
  getSyncthingApiKey,
  setSyncthingApiKey,
  clearSyncthingApiKey,
} from "./secureKeyStore";
import {
  mobileSyncthingDetect,
  mobileSyncthingStatus,
  getSyncthingQrUrl,
  MobileSyncthingError,
} from "./mobileSyncthingClient";
import {
  mobileSyncthingAddDevice,
  mobileSyncthingPendingDevices,
  mobileSyncthingAcceptDevice,
  mobileSyncthingDismissPendingDevice,
  mobileSyncthingPendingFolders,
  mobileSyncthingAcceptFolder,
  mobileSyncthingDismissPendingFolder,
  mobileSyncthingConnectedDevices,
} from "./mobileSyncthingPairing";

export interface MobileSyncthingState {
  status: SyncthingState | "loading";
  version: string;
  deviceId: string;
  deviceName: string;
  qrUrl: string | null;
  hasSavedKey: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  connectedDevices: string[];
  refresh: () => Promise<void>;
  saveKey: (key: string) => Promise<void>;
  clearKey: () => Promise<void>;
  addDevice: (id: string, name: string) => Promise<void>;
  acceptDevice: (id: string) => Promise<void>;
  dismissDevice: (id: string) => Promise<void>;
  acceptFolder: (folderId: string, targetPath: string) => Promise<void>;
  dismissFolder: (folderId: string) => Promise<void>;
}

export function useMobileSyncthing(autoRefresh = true): MobileSyncthingState {
  const [status, setStatus] = useState<SyncthingState | "loading">("loading");
  const [version, setVersion] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDevices, setPendingDevices] = useState<SyncthingPendingDevice[]>([]);
  const [pendingFolders, setPendingFolders] = useState<SyncthingPendingFolder[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const detect = await mobileSyncthingDetect();
      setVersion(detect.version);

      if (!detect.running) {
        setStatus("not-running");
        setDeviceId("");
        setQrUrl(null);
        setPendingDevices([]);
        setPendingFolders([]);
        setConnectedDevices([]);
        return;
      }

      const key = await getSyncthingApiKey();
      setHasSavedKey(Boolean(key));

      if (!key) {
        setStatus("bad-key");
        setErrorMessage("API key required to connect to Syncthing-Fork");
        setDeviceId("");
        setQrUrl(null);
        setPendingDevices([]);
        setPendingFolders([]);
        setConnectedDevices([]);
        return;
      }

      const stat = await mobileSyncthingStatus(key);
      setDeviceId(stat.deviceId);
      setDeviceName(stat.deviceName);
      setQrUrl(getSyncthingQrUrl(stat.deviceId));

      const [pDevs, pFolders, conns] = await Promise.all([
        mobileSyncthingPendingDevices(key).catch(() => []),
        mobileSyncthingPendingFolders(key).catch(() => []),
        mobileSyncthingConnectedDevices(key).catch(() => []),
      ]);

      setPendingDevices(pDevs);
      setPendingFolders(pFolders);
      setConnectedDevices(conns);
      setStatus("running");
    } catch (err: unknown) {
      setDeviceId("");
      setQrUrl(null);
      setPendingDevices([]);
      setPendingFolders([]);
      setConnectedDevices([]);

      if (err instanceof MobileSyncthingError) {
        if (err.kind === "bad-key") {
          setStatus("bad-key");
          setErrorMessage(err.message);
        } else {
          setStatus("not-running");
          setErrorMessage(err.message);
        }
      } else {
        setStatus("not-running");
        setErrorMessage("Cannot connect to Syncthing on localhost");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveKey = useCallback(
    async (newKey: string) => {
      await setSyncthingApiKey(newKey);
      setHasSavedKey(Boolean(newKey.trim()));
      await refresh();
    },
    [refresh],
  );

  const clearKey = useCallback(async () => {
    await clearSyncthingApiKey();
    setHasSavedKey(false);
    await refresh();
  }, [refresh]);

  const addDevice = useCallback(
    async (id: string, name: string) => {
      const key = await getSyncthingApiKey();
      if (!key) throw new Error("API key is not configured");
      await mobileSyncthingAddDevice(key, id, name);
      await refresh();
    },
    [refresh],
  );

  const acceptDevice = useCallback(
    async (id: string) => {
      const key = await getSyncthingApiKey();
      if (!key) throw new Error("API key is not configured");
      await mobileSyncthingAcceptDevice(key, id);
      await refresh();
    },
    [refresh],
  );

  const dismissDevice = useCallback(
    async (id: string) => {
      const key = await getSyncthingApiKey();
      if (!key) return;
      await mobileSyncthingDismissPendingDevice(key, id);
      await refresh();
    },
    [refresh],
  );

  const acceptFolder = useCallback(
    async (folderId: string, targetPath: string) => {
      const key = await getSyncthingApiKey();
      if (!key) throw new Error("API key is not configured");
      await mobileSyncthingAcceptFolder(key, folderId, targetPath);
      await refresh();
    },
    [refresh],
  );

  const dismissFolder = useCallback(
    async (folderId: string) => {
      const key = await getSyncthingApiKey();
      if (!key) return;
      await mobileSyncthingDismissPendingFolder(key, folderId);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    if (autoRefresh) {
      void refresh();
    }
  }, [autoRefresh, refresh]);

  return {
    status,
    version,
    deviceId,
    deviceName,
    qrUrl,
    hasSavedKey,
    isLoading,
    errorMessage,
    pendingDevices,
    pendingFolders,
    connectedDevices,
    refresh,
    saveKey,
    clearKey,
    addDevice,
    acceptDevice,
    dismissDevice,
    acceptFolder,
    dismissFolder,
  };
}
