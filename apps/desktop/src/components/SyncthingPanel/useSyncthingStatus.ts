import { useCallback, useEffect, useState } from "react";
import {
  fetchSyncthingDetect,
  fetchSyncthingQrPng,
  fetchSyncthingStatus,
  listenSyncthingStatus,
  syncthingGetLifecycleStatus,
  syncthingPendingDevices,
  syncthingPendingFolders,
  syncthingRestart,
  syncthingStart,
  syncthingStop,
  type SyncthingPendingDevice,
  type SyncthingPendingFolder,
} from "./syncthingCommands";

export type SyncthingState =
  | "loading"
  | "starting"
  | "running"
  | "stopped"
  | "crashed"
  | "not-installed"
  | "bad-key";

const AUTO_START_KEY = "davinci.syncthing.auto_start";

export interface SyncthingStatusState {
  status: SyncthingState;
  version: string;
  guiAddress: string;
  deviceId: string;
  deviceName: string;
  uptime: number;
  qrDataUrl: string | null;
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  errorMessage: string | null;
  lastLogs: string[] | null;
  isLoading: boolean;
  autoStart: boolean;
  setAutoStart: (val: boolean) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
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
  const [pendingDevices, setPendingDevices] = useState<
    SyncthingPendingDevice[]
  >([]);
  const [pendingFolders, setPendingFolders] = useState<
    SyncthingPendingFolder[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLogs, setLastLogs] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoStart, setAutoStartState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_START_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setAutoStart = useCallback((val: boolean) => {
    setAutoStartState(val);
    try {
      localStorage.setItem(AUTO_START_KEY, val ? "true" : "false");
    } catch {
      // ignore local storage errors
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const lifecycle = await syncthingGetLifecycleStatus().catch(() => null);
      if (lifecycle) {
        if (lifecycle.state === "starting") {
          setStatus("starting");
          setIsLoading(false);
          return;
        }
        if (lifecycle.state === "crashed") {
          setStatus("crashed");
          setErrorMessage(lifecycle.reason ?? "Process exited unexpectedly");
          setLastLogs(lifecycle.lastLogs ?? null);
          setIsLoading(false);
          return;
        }
        if (lifecycle.state === "stopped") {
          setStatus("stopped");
          setQrDataUrl(null);
          setIsLoading(false);
          return;
        }
      }

      const detect = await fetchSyncthingDetect();
      setVersion(detect.version);
      setGuiAddress(detect.guiAddress);

      if (detect.running) {
        const stat = await fetchSyncthingStatus();
        setDeviceId(stat.deviceId);
        setDeviceName(stat.deviceName);
        setUptime(stat.uptime);

        const [qr, pDevs, pFolders] = await Promise.all([
          fetchSyncthingQrPng().catch(() => null),
          syncthingPendingDevices().catch(() => []),
          syncthingPendingFolders().catch(() => []),
        ]);
        setQrDataUrl(qr);
        setPendingDevices(pDevs as SyncthingPendingDevice[]);
        setPendingFolders(pFolders as SyncthingPendingFolder[]);
        setStatus("running");
      } else {
        setStatus("stopped");
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
      } else {
        setStatus("stopped");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const start = useCallback(async () => {
    setIsLoading(true);
    setStatus("starting");
    setErrorMessage(null);
    try {
      await syncthingStart();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus("crashed");
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const stop = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncthingStop();
      setStatus("stopped");
      setQrDataUrl(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restart = useCallback(async () => {
    setIsLoading(true);
    setStatus("starting");
    try {
      await syncthingRestart();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus("crashed");
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();

    let unlisten: (() => void) | undefined;
    void listenSyncthingStatus((payload) => {
      if (payload.state === "starting") setStatus("starting");
      else if (payload.state === "running") void refresh();
      else if (payload.state === "stopped") {
        setStatus("stopped");
        setQrDataUrl(null);
      } else if (payload.state === "crashed") {
        setStatus("crashed");
        setErrorMessage(payload.reason ?? "Crashed");
        setLastLogs(payload.lastLogs ?? null);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [enabled, refresh]);

  return {
    status,
    version,
    guiAddress,
    deviceId,
    deviceName,
    uptime,
    qrDataUrl,
    pendingDevices,
    pendingFolders,
    errorMessage,
    lastLogs,
    isLoading,
    autoStart,
    setAutoStart,
    start,
    stop,
    restart,
    refresh,
  };
}
