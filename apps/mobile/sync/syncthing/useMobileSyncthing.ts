import { useCallback, useEffect, useState } from "react";
import type { SyncthingState } from "@app/syncthing-api";
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

export interface MobileSyncthingState {
  status: SyncthingState | "loading";
  version: string;
  deviceId: string;
  deviceName: string;
  qrUrl: string | null;
  hasSavedKey: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  saveKey: (key: string) => Promise<void>;
  clearKey: () => Promise<void>;
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
        return;
      }

      const key = await getSyncthingApiKey();
      setHasSavedKey(Boolean(key));

      if (!key) {
        setStatus("bad-key");
        setErrorMessage("API key required to connect to Syncthing-Fork");
        setDeviceId("");
        setQrUrl(null);
        return;
      }

      const stat = await mobileSyncthingStatus(key);
      setDeviceId(stat.deviceId);
      setDeviceName(stat.deviceName);
      setQrUrl(getSyncthingQrUrl(stat.deviceId));
      setStatus("running");
    } catch (err: unknown) {
      setDeviceId("");
      setQrUrl(null);

      if (err instanceof MobileSyncthingError) {
        if (err.kind === "bad-key") {
          setStatus("bad-key");
          setErrorMessage(err.message);
        } else if (err.kind === "not-running") {
          setStatus("not-running");
          setErrorMessage("Syncthing-Fork is not running on 127.0.0.1:8384");
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
    refresh,
    saveKey,
    clearKey,
  };
}
