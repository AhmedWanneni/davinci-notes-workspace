import { SyncSettingsPanel, type SyncMode } from "../SyncSettingsPanel";
import { GitRemoteSetupPanel } from "../GitRemoteSetupPanel";
import { SettingsCard } from "./SettingsCard";
import styles from "./SettingsDialog.module.scss";

interface SyncSettingsTabProps {
  syncMode?: SyncMode;
  onSelectSyncMode?: (mode: SyncMode) => void;
  driveAccountEmail?: string | null;
  isDriveSignedIn?: boolean;
  isDriveSyncing?: boolean;
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
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  onDriveSyncNow,
  vaultPath,
  onOpenConflictsPanel,
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
          onDriveSignIn={onDriveSignIn}
          onDriveSignOut={onDriveDisconnect}
          onDriveRefresh={onDriveRefresh}
          onDriveSyncNow={onDriveSyncNow}
          vaultPath={vaultPath}
          onOpenConflictsPanel={onOpenConflictsPanel}
        />
      </SettingsCard>

      <SettingsCard title="Git Version Control">
        <GitRemoteSetupPanel />
      </SettingsCard>
    </div>
  );
}
