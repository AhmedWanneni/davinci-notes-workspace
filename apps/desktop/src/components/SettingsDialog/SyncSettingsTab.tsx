import React, { useEffect, useState } from "react";
import { SyncSettingsPanel, type SyncMode } from "../SyncSettingsPanel";
import { SettingsCard } from "./SettingsCard";
import styles from "./SettingsDialog.module.scss";

const LazySyncthingPanel = React.lazy(() => import("../SyncthingPanel"));

interface SyncSettingsTabProps {
  syncMode?: SyncMode;
  onSelectSyncMode?: (mode: SyncMode) => void;
  driveAccountEmail?: string | null;
  isDriveSignedIn?: boolean;
  isDriveSyncing?: boolean;
  lastSyncedAt?: number | null;
  syncError?: string | null;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  onDriveSyncNow?: () => void;
  vaultPath: string | null;
  onOpenConflictsPanel?: () => void;
}

export function SyncSettingsTab({
  syncMode = "off",
  onSelectSyncMode,
  driveAccountEmail,
  isDriveSignedIn = false,
  isDriveSyncing = false,
  lastSyncedAt,
  syncError,
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  onDriveSyncNow,
  vaultPath,
  onOpenConflictsPanel,
}: SyncSettingsTabProps) {
  const [providerTab, setProviderTab] = useState<"drive" | "folder">(
    syncMode === "folder" ? "folder" : "drive",
  );

  useEffect(() => {
    setProviderTab(syncMode === "folder" ? "folder" : "drive");
  }, [syncMode]);

  const selectProvider = (provider: "drive" | "folder") => {
    setProviderTab(provider);
    if (provider === "folder" && syncMode !== "folder") onSelectSyncMode?.("folder");
    if (provider === "drive" && syncMode === "folder") onSelectSyncMode?.("off");
  };

  return (
    <div className={styles["settings-tab-content"]}>
      <div className={styles["sync-provider-tabs"]} role="tablist" aria-label="Sync provider">
        <button type="button" role="tab" aria-selected={providerTab === "drive"} onClick={() => selectProvider("drive")}>Drive</button>
        <button type="button" role="tab" aria-selected={providerTab === "folder"} onClick={() => selectProvider("folder")}>Syncthing</button>
      </div>

      {providerTab === "drive" && <SettingsCard>
        <SyncSettingsPanel
          mode={syncMode === "drive" ? "drive" : "off"}
          showFolderOption={false}
          onSelectMode={(mode) => onSelectSyncMode?.(mode)}
          driveAccountEmail={driveAccountEmail}
          isDriveSignedIn={isDriveSignedIn}
          isDriveSyncing={isDriveSyncing}
          lastSyncedAt={lastSyncedAt}
          syncError={syncError}
          onDriveSignIn={onDriveSignIn}
          onDriveSignOut={onDriveDisconnect}
          onDriveRefresh={onDriveRefresh}
          onDriveSyncNow={onDriveSyncNow}
          vaultPath={vaultPath}
          onOpenConflictsPanel={onOpenConflictsPanel}
        />
      </SettingsCard>}

      {providerTab === "folder" && <SettingsCard>
        <React.Suspense fallback={<div>Loading Syncthing...</div>}>
          <LazySyncthingPanel
            onDisableSyncMode={() => onSelectSyncMode?.("off")}
          />
        </React.Suspense>
      </SettingsCard>}
    </div>
  );
}
