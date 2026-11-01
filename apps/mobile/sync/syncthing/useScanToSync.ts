import { useState, useCallback, useRef, useEffect } from "react";
import {
  normalizeDeviceId,
  type SyncthingPairingPayload,
  type SyncthingState,
} from "@app/syncthing-api";
import { getSyncthingApiKey } from "./secureKeyStore";
import {
  mobileSyncthingAddDevice,
  mobileSyncthingPendingFolders,
  mobileSyncthingAcceptFolder,
} from "./mobileSyncthingPairing";
import {
  mobileSyncthingDetect,
  mobileSyncthingStatus,
} from "./mobileSyncthingClient";
import {
  mobileSyncthingFolderCompletion,
  mobileSyncthingIsDeviceConnected,
  mobileSyncthingIsFolderConfigured,
  mobileSyncthingSetLocalDeviceName,
  mobileSyncthingTriggerScan,
} from "./mobileSyncthingOperations";
import { EmbeddedSyncthingBridge } from "./embeddedSyncthingBridge";
import type { ScanToSyncStage } from "./ScanToSyncProgressView";

export type ScanToSyncStep = "scanner" | "confirm" | "progress";

const WAIT_DESKTOP_TIMEOUT_MS = 45000;
const SYNC_TIMEOUT_MS = 60000;

export function useScanToSync(
  isOpen: boolean,
  _status: SyncthingState | "loading" | "checking",
  _hasSavedKey: boolean,
  _defaultVaultPath: string,
) {
  const [step, setStep] = useState<ScanToSyncStep>("scanner");
  const [stage, setStage] = useState<ScanToSyncStage>("connecting");
  const [payload, setPayload] = useState<SyncthingPairingPayload | null>(null);
  const [targetPath, setTargetPath] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const abortRef = useRef<boolean>(false);

  const resetFlow = useCallback(() => {
    abortRef.current = true;
    setPayload(null);
    setTargetPath("");
    setProgressPercent(0);
    setErrorMessage(null);
    setIsBusy(false);
    setStep("scanner");
  }, []);

  useEffect(() => {
    if (isOpen) {
      abortRef.current = false;
      setStep("scanner");
      if (EmbeddedSyncthingBridge.isAvailable()) {
        void EmbeddedSyncthingBridge.start().catch(() => {});
      }
    } else {
      resetFlow();
    }
  }, [isOpen, resetFlow]);

  const handleScanSuccess = (scannedPayload: SyncthingPairingPayload) => {
    setPayload(scannedPayload);
    setStep("confirm");
  };

  const handleConfirm = async (selectedTarget: string) => {
    if (!payload) return;
    setTargetPath(selectedTarget);
    setIsBusy(true);
    setStep("progress");
    setStage("connecting");
    setErrorMessage(null);
    setProgressPercent(0);
    abortRef.current = false;

    try {
      let apiKey = "";
      if (EmbeddedSyncthingBridge.isAvailable()) {
        const startRes = await EmbeddedSyncthingBridge.start();
        if (startRes.status !== "running") {
          const detail = `${startRes.reason || "Failed to start Syncthing"}${startRes.binaryPath ? ` (path: ${startRes.binaryPath}, exists=${startRes.binaryExists}, canExecute=${startRes.binaryExecutable})` : ""}${startRes.exitCode != null ? ` [code: ${startRes.exitCode}]` : ""}`;
          throw new Error(detail);
        }
      } else {
        const detect = await mobileSyncthingDetect();
        if (!detect.running) {
          throw new Error(
            "Syncthing daemon is not running on this phone. Ensure embedded Syncthing is supported on your platform.",
          );
        }
        apiKey = (await getSyncthingApiKey()) || "";
      }

      // Step 1: Update local phone device name so desktop sees the verification code
      const currentStat = await mobileSyncthingStatus(apiKey).catch(() => null);
      const baseName = currentStat?.deviceName || "Mobile";
      const cleanBase = baseName.split("-")[0].split("(")[0].trim() || "Mobile";
      const phoneAnnounceName = payload.code
        ? `${cleanBase}-${payload.code}`
        : cleanBase;

      await mobileSyncthingSetLocalDeviceName(apiKey, phoneAnnounceName).catch(
        () => {},
      );

      // Add desktop device if not yet added
      try {
        await mobileSyncthingAddDevice(apiKey, payload.id, payload.name);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.toLowerCase().includes("already added")) {
          throw err;
        }
      }

      // Step 2: Wait for desktop to accept pairing and offer folder
      setStage("waiting_desktop");
      const startWait = Date.now();
      let matchedFolder: { folderId: string } | null = null;

      while (!matchedFolder && !abortRef.current) {
        if (Date.now() - startWait > WAIT_DESKTOP_TIMEOUT_MS) {
          throw new Error(
            `Waiting for ${payload.name || "desktop"} to accept timed out. Ensure pairing was accepted on desktop.`,
          );
        }

        const pending = await mobileSyncthingPendingFolders(apiKey);
        // Accept ONLY the folder whose id matches payload.folderId and offeredBy matches payload.id
        const found = pending.find(
          (f) =>
            f.folderId === payload.folderId &&
            normalizeDeviceId(f.offeredBy) === normalizeDeviceId(payload.id),
        );

        if (found) {
          matchedFolder = found;
          break;
        }

        // Check if desktop already accepted and folder is already configured
        const alreadyConfigured = await mobileSyncthingIsFolderConfigured(
          apiKey,
          payload.folderId,
        );
        if (alreadyConfigured) {
          matchedFolder = { folderId: payload.folderId };
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (abortRef.current) return;

      // Step 3: Accept folder and track completion
      setStage("syncing");
      const isConfigured = await mobileSyncthingIsFolderConfigured(
        apiKey,
        payload.folderId,
      );
      if (!isConfigured && matchedFolder) {
        await mobileSyncthingAcceptFolder(
          apiKey,
          payload.folderId,
          selectedTarget,
        );
      }
      await mobileSyncthingTriggerScan(apiKey, payload.folderId).catch(
        () => {},
      );

      const syncStart = Date.now();
      let isDone = false;

      while (!isDone && !abortRef.current) {
        if (Date.now() - syncStart > SYNC_TIMEOUT_MS) {
          const connected = await mobileSyncthingIsDeviceConnected(
            apiKey,
            payload.id,
          );
          if (!connected) {
            throw new Error(
              "Desktop not reachable. Ensure both devices are on the same local network.",
            );
          }
          // If still syncing but timeout reached, mark complete if mostly done
          break;
        }

        const comp = await mobileSyncthingFolderCompletion(
          apiKey,
          payload.folderId,
          payload.id,
        );
        setProgressPercent(comp.completion);

        if (
          comp.completion === 100 ||
          (comp.needBytes === 0 && comp.needItems === 0)
        ) {
          isDone = true;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (abortRef.current) return;
      setProgressPercent(100);
      setStage("completed");
    } catch (err: unknown) {
      if (abortRef.current) return;
      setStage("error");
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsBusy(false);
    }
  };

  return {
    step,
    stage,
    payload,
    targetPath,
    progressPercent,
    errorMessage,
    isBusy,
    setStep,
    handleScanSuccess,
    handleConfirm,
    resetFlow,
  };
}
