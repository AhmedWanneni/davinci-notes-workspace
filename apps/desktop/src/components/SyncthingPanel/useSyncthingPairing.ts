import { useState, useEffect, useCallback } from "react";
import {
  generatePairingCode,
  encodePairingUri,
  type SyncthingPairingPayload,
} from "@app/syncthing-api";
import {
  fetchSyncthingQrPng,
  syncthingEnsureVaultRegistered,
} from "./syncthingCommands";

export const PAIRING_WINDOW_SECONDS = 300; // 5 minutes

export function useSyncthingPairing(
  isRunning: boolean,
  deviceId: string | null,
  deviceName: string | null,
) {
  const [pairingCode, setPairingCode] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pairingPayload, setPairingPayload] =
    useState<SyncthingPairingPayload | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(PAIRING_WINDOW_SECONDS);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const rotateCode = useCallback(async () => {
    if (!isRunning || !deviceId) {
      setQrDataUrl(null);
      setPairingPayload(null);
      return;
    }

    setIsGenerating(true);
    try {
      const vaultInfo = await syncthingEnsureVaultRegistered().catch(() => ({
        folderId: "davinci-default",
        folderLabel: "Vault",
      }));

      const code = generatePairingCode();
      const payload: SyncthingPairingPayload = {
        v: 1,
        id: deviceId,
        name: deviceName || "Local Device",
        folderId: vaultInfo.folderId,
        folderLabel: vaultInfo.folderLabel,
        code,
      };

      const uri = encodePairingUri(payload);
      const qr = await fetchSyncthingQrPng(uri);

      setPairingCode(code);
      setPairingPayload(payload);
      setQrDataUrl(qr);
      setSecondsLeft(PAIRING_WINDOW_SECONDS);
    } catch {
      const fallbackQr = await fetchSyncthingQrPng(deviceId).catch(() => null);
      setQrDataUrl(fallbackQr);
    } finally {
      setIsGenerating(false);
    }
  }, [isRunning, deviceId, deviceName]);

  useEffect(() => {
    if (isRunning && deviceId && !pairingCode) {
      void rotateCode();
    } else if (!isRunning) {
      setQrDataUrl(null);
      setPairingCode("");
      setPairingPayload(null);
    }
  }, [isRunning, deviceId, pairingCode, rotateCode]);

  useEffect(() => {
    if (!isRunning || !pairingCode) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void rotateCode();
          return PAIRING_WINDOW_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, pairingCode, rotateCode]);

  return {
    pairingCode,
    pairingPayload,
    qrDataUrl,
    secondsLeft,
    isExpired: secondsLeft <= 0,
    isGenerating,
    rotateCode,
  };
}
