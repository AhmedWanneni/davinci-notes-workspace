import { useCallback, useEffect, useState } from "react";
import type {
  SyncthingConfiguredDevice,
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingSharedVault,
  SyncthingState,
} from "@app/syncthing-api";
import type { MobileSyncthingState } from "./mobileSyncthingTypes";
export type { MobileSyncthingState };
import {
  getSyncthingApiKey,
  setSyncthingApiKey,
  clearSyncthingApiKey,
} from "./secureKeyStore";
import {
  mobileSyncthingDetect,
  mobileSyncthingStatus,
  getMobileSyncthingQrUri,
  MobileSyncthingError,
} from "./mobileSyncthingClient";
import { EmbeddedSyncthingBridge } from "./embeddedSyncthingBridge";
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
import {
  mobileSyncthingListDevices,
  mobileSyncthingRemoveDevice,
} from "./mobileSyncthingDevices";
import {
  mobileSyncthingListSharedVaults,
  mobileSyncthingUnshareFolder,
} from "./mobileSyncthingVaults";

export function useMobileSyncthing(
  autoRefresh = true,
  activeVaultUri = "",
): MobileSyncthingState {
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
  const [configuredDevices, setConfiguredDevices] = useState<SyncthingConfiguredDevice[]>([]);
  const [sharedVaults, setSharedVaults] = useState<SyncthingSharedVault[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  const isEmbedded = EmbeddedSyncthingBridge.isAvailable();

  const resetActive = () => {
    setDeviceId("");
    setQrUrl(null);
    setPendingDevices([]);
    setPendingFolders([]);
    setConfiguredDevices([]);
    setSharedVaults([]);
    setConnectedDevices([]);
  };

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const detect = await mobileSyncthingDetect();
      setVersion(detect.version);

      if (!detect.running) {
        setStatus("not-running");
        resetActive();
        return;
      }

      const key = (await getSyncthingApiKey()) || "";
      const isEmb = EmbeddedSyncthingBridge.isAvailable();
      setHasSavedKey(isEmb || Boolean(key));

      if (!isEmb && !key) {
        setStatus("bad-key");
        setErrorMessage("API key required to connect to Syncthing-Fork");
        resetActive();
        return;
      }

      const stat = await mobileSyncthingStatus(key);
      setDeviceId(stat.deviceId);
      setDeviceName(stat.deviceName);
      const qr = await getMobileSyncthingQrUri(stat.deviceId);
      setQrUrl(qr);

      const [pDevs, pFolders, cDevs, sVaults, conns] = await Promise.all([
        mobileSyncthingPendingDevices(key).catch(() => []),
        mobileSyncthingPendingFolders(key).catch(() => []),
        mobileSyncthingListDevices(key, stat.deviceId).catch(() => []),
        mobileSyncthingListSharedVaults(key, activeVaultUri, stat.deviceId).catch(() => []),
        mobileSyncthingConnectedDevices(key).catch(() => []),
      ]);

      setPendingDevices(pDevs);
      setPendingFolders(pFolders);
      setConfiguredDevices(cDevs);
      setSharedVaults(sVaults);
      setConnectedDevices(conns);
      setStatus("running");
    } catch (err: unknown) {
      resetActive();
      const isBadKey = err instanceof MobileSyncthingError && err.kind === "bad-key";
      setStatus(isBadKey ? "bad-key" : "not-running");
      setErrorMessage(err instanceof Error ? err.message : "Cannot connect to Syncthing");
    } finally {
      setIsLoading(false);
    }
  }, [activeVaultUri]);

  const getKey = async () => {
    const key = (await getSyncthingApiKey()) || "";
    if (!EmbeddedSyncthingBridge.isAvailable() && !key) {
      throw new Error("API key is not configured");
    }
    return key;
  };

  const startService = useCallback(async () => {
    if (EmbeddedSyncthingBridge.isAvailable()) {
      setIsLoading(true);
      await EmbeddedSyncthingBridge.start();
      await refresh();
    }
  }, [refresh]);

  const stopService = useCallback(async () => {
    if (EmbeddedSyncthingBridge.isAvailable()) {
      setIsLoading(true);
      await EmbeddedSyncthingBridge.stop();
      await refresh();
    }
  }, [refresh]);

  const saveKey = useCallback(async (k: string) => {
    await setSyncthingApiKey(k);
    setHasSavedKey(Boolean(k.trim()));
    await refresh();
  }, [refresh]);

  const clearKey = useCallback(async () => {
    await clearSyncthingApiKey();
    setHasSavedKey(false);
    await refresh();
  }, [refresh]);

  const addDevice = useCallback(async (id: string, name: string) => {
    await mobileSyncthingAddDevice(await getKey(), id, name);
    await refresh();
  }, [refresh]);

  const removeDevice = useCallback(async (id: string) => {
    await mobileSyncthingRemoveDevice(await getKey(), id);
    await refresh();
  }, [refresh]);

  const acceptDevice = useCallback(async (id: string) => {
    await mobileSyncthingAcceptDevice(await getKey(), id);
    await refresh();
  }, [refresh]);

  const dismissDevice = useCallback(async (id: string) => {
    await mobileSyncthingDismissPendingDevice(await getKey(), id);
    await refresh();
  }, [refresh]);

  const acceptFolder = useCallback(async (fId: string, path: string) => {
    await mobileSyncthingAcceptFolder(await getKey(), fId, path);
    await refresh();
  }, [refresh]);

  const dismissFolder = useCallback(async (fId: string) => {
    await mobileSyncthingDismissPendingFolder(await getKey(), fId);
    await refresh();
  }, [refresh]);

  const unshareFolder = useCallback(async (fId: string) => {
    await mobileSyncthingUnshareFolder(await getKey(), fId);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (autoRefresh) void refresh();
  }, [autoRefresh, refresh]);

  return {
    status,
    version,
    deviceId,
    deviceName,
    qrUrl,
    hasSavedKey,
    isLoading,
    isEmbedded,
    errorMessage,
    pendingDevices,
    pendingFolders,
    configuredDevices,
    sharedVaults,
    connectedDevices,
    refresh,
    startService,
    stopService,
    saveKey,
    clearKey,
    addDevice,
    removeDevice,
    acceptDevice,
    dismissDevice,
    acceptFolder,
    dismissFolder,
    unshareFolder,
  };
}
