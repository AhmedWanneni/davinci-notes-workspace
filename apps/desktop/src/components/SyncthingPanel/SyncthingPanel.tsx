import React, { useState } from "react";
import { Button, Typography } from "@app/design-system";
import { Check, Copy, Desktop } from "@phosphor-icons/react";
import { useSyncthingStatus } from "./useSyncthingStatus";
import { useSyncthingPairing } from "./useSyncthingPairing";
import { SyncthingStatusBanner } from "./SyncthingStatusBanner";
import { SyncthingQrPairingSection } from "./SyncthingQrPairingSection";
import { SyncthingAddDeviceSection } from "./SyncthingAddDeviceSection";
import { SyncthingPendingSection } from "./SyncthingPendingSection";
import { SyncthingSyncCheckSection } from "./SyncthingSyncCheckSection";
import { SyncthingVaultShareSection } from "./SyncthingVaultShareSection";
import styles from "./SyncthingPanel.module.scss";

export interface SyncthingPanelProps {
  customStatus?: ReturnType<typeof useSyncthingStatus>;
  customPairing?: ReturnType<typeof useSyncthingPairing>;
}

export function SyncthingPanel({
  customStatus,
  customPairing,
}: SyncthingPanelProps) {
  const hookStatus = useSyncthingStatus(!customStatus);
  const {
    status,
    version,
    guiAddress,
    deviceId,
    deviceName,
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
  } = customStatus || hookStatus;

  const hookPairing = useSyncthingPairing(
    status === "running",
    deviceId,
    deviceName,
  );
  const {
    pairingCode,
    qrDataUrl: pairingQrUrl,
    secondsLeft,
    isExpired,
    isGenerating,
    rotateCode,
  } = customPairing || hookPairing;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!deviceId) return;
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles["syncthing-panel"]} data-testid="syncthing-panel">
      {/* 1. Status Banner & Controls */}
      <SyncthingStatusBanner
        status={status}
        version={version}
        guiAddress={guiAddress}
        errorMessage={errorMessage}
        lastLogs={lastLogs}
        isLoading={isLoading}
        autoStart={autoStart}
        setAutoStart={setAutoStart}
        onStart={() => void start()}
        onStop={() => void stop()}
        onRestart={() => void restart()}
        onRefresh={() => void refresh()}
      />

      {/* 2. Raw Device ID Card (Always visible with Copy button for generic clients/paste) */}
      {Boolean(deviceId) && (
        <div className={styles["syncthing-panel__card"]}>
          <div className={styles["syncthing-panel__card-header"]}>
            <div className={styles["syncthing-panel__device-title"]}>
              <Desktop size={16} />
              <Typography variant="h4" size="sm">
                {deviceName || "Local Device"}
              </Typography>
            </div>

            <div className={styles["syncthing-panel__copy-wrap"]}>
              {copied && (
                <span
                  className={styles["syncthing-panel__toast"]}
                  role="status"
                >
                  <Check size={14} /> Copied!
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy Device ID"
              >
                <Copy size={14} />
                Copy ID
              </Button>
            </div>
          </div>

          <div className={styles["syncthing-panel__device-block"]}>
            <pre className={styles["syncthing-panel__device-id"]}>
              <code>{deviceId}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 3. Pairing QR Code with Countdown Window & Code Rotation */}
      {status === "running" && (
        <SyncthingQrPairingSection
          qrDataUrl={pairingQrUrl || qrDataUrl}
          pairingCode={pairingCode}
          secondsLeft={secondsLeft}
          isExpired={isExpired}
          isGenerating={isGenerating}
          onRotateCode={rotateCode}
        />
      )}

      {/* 4. Incoming Pending Requests (Devices + Folders) with Code Matching */}
      {status === "running" && (
        <SyncthingPendingSection
          pendingDevices={pendingDevices}
          pendingFolders={pendingFolders}
          activePairingCode={pairingCode}
          isPairingExpired={isExpired}
          onUpdated={refresh}
        />
      )}

      {/* 5. Add Remote Device */}
      {status === "running" && <SyncthingAddDeviceSection onAdded={refresh} />}

      {/* 6. Share Current Vault with Remote Device */}
      {status === "running" && (
        <SyncthingVaultShareSection onShared={refresh} />
      )}

      {/* 7. Check Sync Health Verification */}
      {status === "running" && <SyncthingSyncCheckSection />}
    </div>
  );
}

export default SyncthingPanel;
