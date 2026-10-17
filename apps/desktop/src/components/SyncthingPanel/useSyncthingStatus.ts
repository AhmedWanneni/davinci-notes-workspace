import { useCallback, useEffect, useState } from "react";
import {
  fetchSyncthingDetect,
  fetchSyncthingQrPng,
  fetchSyncthingStatus,
} from "./syncthingCommands";

export type SyncthingState =
  "loading" | "running" | "not-running" | "not-installed" | "bad-key";

export interface SyncthingStatusState {
  status: SyncthingState;
  version: string;
  guiAddress: string;
  deviceId: string;
  deviceName: string;
  uptime: number;
  qrDataUrl: string | null;
  errorMessage: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useSyncthingStatus(enabled = true): SyncthingStatusState {
  const [status, setStatus] = useState<SyncthingState>("loading");
  const [version, setVersion] = useState("");
  const [guiAddress, setGuiAddress] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [uptime, setUptime] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const detect = await fetchSyncthingDetect();
      setVersion(detect.version);
      setGuiAddress(detect.guiAddress);

      if (detect.running) {
        const stat = await fetchSyncthingStatus();
        setDeviceId(stat.deviceId);
        setDeviceName(stat.deviceName);
        setUptime(stat.uptime);

        try {
          const qr = await fetchSyncthingQrPng();
          setQrDataUrl(qr);
        } catch {
          setQrDataUrl(null);
        }

        setStatus("running");
      } else {
        setStatus("not-running");
        setQrDataUrl(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setQrDataUrl(null);

      if (msg.includes("NotInstalled")) {
        setStatus("not-installed");
      } else if (msg.includes("BadKey")) {
        setStatus("bad-key");
      } else if (msg.includes("NotRunning")) {
        setStatus("not-running");
      } else {
        setStatus("not-running");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  return {
    status,
    version,
    guiAddress,
    deviceId,
    deviceName,
    uptime,
    qrDataUrl,
    errorMessage,
    isLoading,
    refresh,
  };
}
