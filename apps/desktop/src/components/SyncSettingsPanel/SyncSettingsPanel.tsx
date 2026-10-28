import { Badge, Button, Typography } from "@app/design-system";
import styles from "./SyncSettingsPanel.module.scss";

export type SyncMode = "off" | "drive" | "folder";

export interface SyncSettingsPanelProps {
  mode: SyncMode;
  onSelectMode: (mode: SyncMode) => void;
  // Drive state & actions
  driveAccountEmail?: string | null;
  isDriveSignedIn?: boolean;
  isDriveSyncing?: boolean;
  lastSyncedAt?: number | null;
  syncError?: string | null;
  onDriveSignIn?: () => void;
  onDriveSignOut?: () => void;
  onDriveRefresh?: () => void;
  onDriveSyncNow?: () => void;
  // Folder state & actions
  vaultPath?: string | null;
  onOpenConflictsPanel?: () => void;
}

export function SyncSettingsPanel({
  mode,
  onSelectMode,
  driveAccountEmail,
  isDriveSignedIn = false,
  isDriveSyncing = false,
  lastSyncedAt,
  syncError,
  onDriveSignIn,
  onDriveSignOut,
  onDriveRefresh,
  onDriveSyncNow,
  vaultPath,
  onOpenConflictsPanel,
}: SyncSettingsPanelProps) {
  if (mode === "off") {
    return (
      <div className={styles["sync-settings"]}>
        <div className={styles["sync-settings__banner-info"]}>
          <Typography variant="h3" size="sm">
            Vault Synchronization
          </Typography>
          <Typography variant="text" size="xs" color="muted">
            Synchronization is currently off for this vault. Choose a sync mode
            below.
          </Typography>
        </div>

        <div className={styles["sync-settings__options"]}>
          {/* Card A: Google Drive (Recommended, Prominent) */}
          <div
            className={styles["sync-settings__card"]}
            data-recommended="true"
            data-testid="sync-option-drive"
          >
            <div className={styles["sync-settings__card-header"]}>
              <div className={styles["sync-settings__card-title-wrap"]}>
                <Typography variant="h3" size="sm">
                  Sync via Google Drive
                </Typography>
                <Badge variant="primary">Recommended</Badge>
              </div>
            </div>
            <div className={styles["sync-settings__card-body"]}>
              <p className={styles["sync-settings__note"]}>
                Built-in automatic multi-device file synchronization. Text notes
                merge automatically, conflicts resolve cleanly, and your vault
                is safely backed up in hidden app storage.
              </p>
            </div>
            <div className={styles["sync-settings__card-actions"]}>
              <Button
                variant="primary"
                onClick={() => {
                  onSelectMode("drive");
                  onDriveSignIn?.();
                }}
              >
                Enable &amp; Sign in to Google Drive
              </Button>
            </div>
          </div>

          {/* Card B: Folder Tool (Bring Your Own Tool, Secondary) */}
          <div
            className={styles["sync-settings__card"]}
            data-testid="sync-option-folder"
          >
            <div className={styles["sync-settings__card-header"]}>
              <div className={styles["sync-settings__card-title-wrap"]}>
                <Typography variant="h3" size="sm">
                  Sync via Folder Tool (Syncthing, etc.)
                </Typography>
                <Badge variant="secondary">External</Badge>
              </div>
            </div>
            <div className={styles["sync-settings__card-body"]}>
              <p className={styles["sync-settings__note"]}>
                Bring your own folder sync tool. Synchronization runs
                externally; the app automatically detects file changes and
                surfaces Syncthing conflict files for manual review.
              </p>
            </div>
            <div className={styles["sync-settings__card-actions"]}>
              <Button
                variant="secondary"
                onClick={() => onSelectMode("folder")}
              >
                Enable Folder Sync Mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "drive") {
    return (
      <div className={styles["sync-settings"]}>
        <div className={styles["sync-settings__status-banner"]}>
          <div className={styles["sync-settings__banner-info"]}>
            <Typography variant="h3" size="sm">
              Google Drive Sync Active
            </Typography>
            <Typography variant="text" size="xs" color="muted">
              {isDriveSignedIn
                ? `Account: ${driveAccountEmail || "Connected"}${lastSyncedAt ? ` · Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : ""}`
                : "Authentication required to sync"}
            </Typography>
          </div>
          <Badge variant={isDriveSignedIn ? "success" : "warning"}>
            {isDriveSignedIn ? "Connected" : "Signed Out"}
          </Badge>
        </div>

        {syncError && (
          <div
            className={styles["sync-settings__error-banner"]}
            role="alert"
            data-testid="sync-error-banner"
          >
            <span>{syncError}</span>
          </div>
        )}

        <div className={styles["sync-settings__card-actions"]}>
          {isDriveSignedIn ? (
            <>
              <Button
                variant="secondary"
                onClick={onDriveSyncNow}
                disabled={isDriveSyncing}
              >
                {isDriveSyncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button variant="secondary" onClick={onDriveRefresh}>
                Refresh Session
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  onDriveSignOut?.();
                  onSelectMode("off");
                }}
              >
                Disconnect Drive
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onDriveSignIn}>
              Sign In to Google Drive
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles["sync-settings"]}>
      <div className={styles["sync-settings__status-banner"]}>
        <div className={styles["sync-settings__banner-info"]}>
          <Typography variant="h3" size="sm">
            Folder Sync Mode Active
          </Typography>
          <Typography variant="text" size="xs" color="muted">
            Vault Path: {vaultPath || "Configured Folder"}
          </Typography>
        </div>
        <Badge variant="secondary">Folder Mode</Badge>
      </div>

      <p className={styles["sync-settings__note"]}>
        File transfer and synchronization are managed externally by your folder
        tool (Syncthing, Resilio, etc.). The app monitors disk edits
        automatically and surfaces conflict artifacts.
      </p>

      <div className={styles["sync-settings__card-actions"]}>
        <Button variant="secondary" onClick={onOpenConflictsPanel}>
          View Sync Conflicts
        </Button>
        <Button variant="secondary" onClick={() => onSelectMode("off")}>
          Disable Sync Mode
        </Button>
      </div>
    </div>
  );
}
