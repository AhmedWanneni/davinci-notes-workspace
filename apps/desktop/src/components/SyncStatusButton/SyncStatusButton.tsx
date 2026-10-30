import React from "react";
import {
  ArrowsClockwise,
  CloudCheck,
  CloudSlash,
  CloudWarning,
} from "@phosphor-icons/react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { useDriveSyncStore } from "../../sync/useDriveSyncStore";
import styles from "./SyncStatusButton.module.scss";

export interface SyncStatusButtonProps {
  syncMode?: "off" | "drive" | "folder";
  isDriveSignedIn?: boolean;
  isDriveSyncing?: boolean;
  syncError?: string | null;
  onSyncNow?: () => void;
  onOpenSyncSettings?: () => void;
  className?: string;
}

export function SyncStatusButton({
  syncMode: propSyncMode,
  isDriveSignedIn: propIsSignedIn,
  isDriveSyncing: propIsSyncing,
  syncError: propSyncError,
  onSyncNow,
  onOpenSyncSettings,
  className,
}: SyncStatusButtonProps) {
  const storeSyncMode = useWorkspaceStore((state) => state.syncMode);
  const storeIsSignedIn = useDriveSyncStore((state) => state.isDriveSignedIn);
  const storeIsSyncing = useDriveSyncStore((state) => state.isDriveSyncing);
  const storeSyncError = useDriveSyncStore((state) => state.syncError);
  const storeSyncNow = useDriveSyncStore((state) => state.syncNow);

  const syncMode = propSyncMode ?? storeSyncMode;
  const isDriveSignedIn = propIsSignedIn ?? storeIsSignedIn;
  const isDriveSyncing = propIsSyncing ?? storeIsSyncing;
  const syncError = propSyncError !== undefined ? propSyncError : storeSyncError;

  const handleClick = () => {
    if (isDriveSyncing) return;
    if (syncMode === "drive" && isDriveSignedIn && !syncError) {
      if (onSyncNow) {
        onSyncNow();
      } else {
        void storeSyncNow();
      }
    } else {
      onOpenSyncSettings?.();
    }
  };

  let icon: React.ReactNode;
  let title: string;
  let stateAttr: "syncing" | "error" | "disconnected" | "synced";

  if (isDriveSyncing) {
    stateAttr = "syncing";
    title = "Google Drive: Syncing notes...";
    icon = (
      <ArrowsClockwise
        size={16}
        weight="bold"
        className={styles["sync-status-btn__spinner"]}
      />
    );
  } else if (syncError) {
    stateAttr = "error";
    title = `Google Drive: Not synced (${syncError}) — click to open settings`;
    icon = <CloudWarning size={16} weight="bold" />;
  } else if (syncMode !== "drive" || !isDriveSignedIn) {
    stateAttr = "disconnected";
    title =
      syncMode !== "drive"
        ? "Google Drive sync is off (Click to open settings)"
        : "Google Drive: Not connected (Click to open settings)";
    icon = <CloudSlash size={16} weight="regular" />;
  } else {
    stateAttr = "synced";
    title = "Google Drive: Synced (Click to sync now)";
    icon = <CloudCheck size={16} weight="bold" />;
  }

  const combinedClass = className
    ? `${styles["sync-status-btn"]} ${className}`
    : styles["sync-status-btn"];

  return (
    <button
      type="button"
      className={combinedClass}
      onClick={handleClick}
      aria-label={title}
      title={title}
      data-state={stateAttr}
      data-testid="sync-status-button"
      disabled={isDriveSyncing}
    >
      {icon}
    </button>
  );
}
