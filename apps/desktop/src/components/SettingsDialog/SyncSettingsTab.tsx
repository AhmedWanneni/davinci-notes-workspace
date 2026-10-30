import React from "react";
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
  onOpenVault?: (path: string) => void;
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
  onOpenVault,
}: SyncSettingsTabProps) {
  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Cloud Sync">
        <SyncSettingsPanel
          mode={syncMode}
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
      </SettingsCard>

      <SettingsCard title="Syncthing">
        <React.Suspense fallback={<div>Loading Syncthing...</div>}>
          <LazySyncthingPanel onOpenVault={onOpenVault} />
        </React.Suspense>
      </SettingsCard>
    </div>
  );
}
