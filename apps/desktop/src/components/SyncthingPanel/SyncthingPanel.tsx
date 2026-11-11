import React from "react";
import { Button } from "@app/design-system";
import { useSyncthingStatus } from "./useSyncthingStatus";
import { useSyncthingPairing } from "./useSyncthingPairing";
import { SyncthingStatusBanner } from "./SyncthingStatusBanner";
import { SyncthingQrPairingSection } from "./SyncthingQrPairingSection";
import { SyncthingAddDeviceSection } from "./SyncthingAddDeviceSection";
import { SyncthingPairedDevicesSection } from "./SyncthingPairedDevicesSection";
import { SyncthingLocalDeviceCard } from "./SyncthingLocalDeviceCard";
import { SyncthingSyncCheckSection } from "./SyncthingSyncCheckSection";
import { SyncthingConnectOptions } from "./SyncthingConnectOptions";
import styles from "./SyncthingPanel.module.scss";

export interface SyncthingPanelProps {
  customStatus?: ReturnType<typeof useSyncthingStatus>;
  customPairing?: ReturnType<typeof useSyncthingPairing>;
  onDisableSyncMode?: () => void;
}

export function SyncthingPanel({
  customStatus,
  customPairing,
  onDisableSyncMode,
}: SyncthingPanelProps) {
  const hookStatus = useSyncthingStatus(!customStatus);
  const {
    status,
    version,
    guiAddress,
    deviceId,
    deviceName,
    qrDataUrl,
    configuredDevices = [],
    pendingDevices,
    pendingFolders,
    sharedVaults = [],
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
        onStart={() => void start()}
        onStop={() => void stop()}
        onRestart={() => void restart()}
        onRefresh={() => void refresh()}
      />

      {/* 2. Raw Device ID Card (Always visible for copying ID to other devices) */}
      {Boolean(deviceId) && (
        <SyncthingLocalDeviceCard
          deviceId={deviceId}
          deviceName={deviceName}
          autoStart={autoStart}
          setAutoStart={setAutoStart}
          onUpdated={refresh}
        />
      )}

      {/* 3. Paired Devices List (Always visible when Syncthing is running) */}
      {status === "running" && (
        <SyncthingPairedDevicesSection
          devices={configuredDevices}
          pendingDevices={pendingDevices}
          pendingFolders={pendingFolders}
          sharedVaults={sharedVaults}
          activePairingCode={pairingCode}
          isPairingExpired={isExpired}
          onUpdated={refresh}
        />
      )}

      {/* 4. Incoming Pending Requests (Only visible when pending offers exist) */}

      {/* 5. Connect another device */}
      {status === "running" && (
        <SyncthingConnectOptions
          mobileContent={
            <SyncthingQrPairingSection
              qrDataUrl={pairingQrUrl || qrDataUrl}
              pairingCode={pairingCode}
              secondsLeft={secondsLeft}
              isExpired={isExpired}
              isGenerating={isGenerating}
              onRotateCode={rotateCode}
            />
          }
          desktopContent={
            <SyncthingAddDeviceSection
              onAdded={refresh}
            />
          }
        />
      )}

      {/* 6. Check Sync Health Verification */}
      {status === "running" && <SyncthingSyncCheckSection />}
      {onDisableSyncMode && status !== "loading" && (
        <Button variant="ghost" size="sm" onClick={onDisableSyncMode}>
          Disable Folder Sync Mode
        </Button>
      )}
    </div>
  );
}

export default SyncthingPanel;
