import React, { useState } from "react";
import { Badge, Typography } from "@app/design-system";
import { UserPlus, WarningCircle } from "@phosphor-icons/react";
import {
  syncthingAcceptDevice,
  syncthingAcceptFolder,
  syncthingDismissPendingDevice,
  syncthingShareVaultFolder,
  type SyncthingPendingDevice,
  type SyncthingPendingFolder,
} from "./syncthingCommands";
import { SyncthingPendingDeviceRow } from "./SyncthingPendingDeviceRow";
import { SyncthingPendingFolderRow } from "./SyncthingPendingFolderRow";
import styles from "./SyncthingPendingSection.module.scss";

interface Props {
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  activePairingCode?: string | null;
  isPairingExpired?: boolean;
  onUpdated: () => Promise<void>;
}

export function SyncthingPendingSection({
  pendingDevices,
  pendingFolders,
  activePairingCode,
  isPairingExpired,
  onUpdated,
}: Props) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  if (pendingDevices.length === 0 && pendingFolders.length === 0) {
    return null;
  }

  const handleAcceptDevice = async (id: string) => {
    setActionError(null);
    setActiveAction(`accept-dev-${id}`);
    try {
      await syncthingAcceptDevice(id);
      // Auto-share active vault folder upon accept
      await syncthingShareVaultFolder(id).catch(() => {});
      await onUpdated();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDismissDevice = async (id: string) => {
    setActionError(null);
    setActiveAction(`dismiss-dev-${id}`);
    try {
      await syncthingDismissPendingDevice(id);
      await onUpdated();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActiveAction(null);
    }
  };

  const handleAcceptFolder = async (
    folderId: string,
    path: string,
    allowNonEmpty: boolean,
  ) => {
    setActionError(null);
    setActiveAction(`accept-folder-${folderId}`);
    try {
      await syncthingAcceptFolder(folderId, path, allowNonEmpty);
      await onUpdated();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className={styles["pending-card"]}>
      <div className={styles["pending-card__header"]}>
        <div className={styles["pending-card__title"]}>
          <UserPlus size={16} />
          <Typography variant="h4" size="sm">
            Incoming Requests
          </Typography>
        </div>
        <Badge variant="warning">
          {pendingDevices.length + pendingFolders.length} pending
        </Badge>
      </div>

      {actionError && (
        <div className={styles["pending-card__error-alert"]} role="alert">
          <WarningCircle size={14} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pending Devices */}
      {pendingDevices.length > 0 && (
        <div className={styles["pending-card__list"]}>
          <Typography variant="h4" size="xs">
            Device Connection Offers
          </Typography>
          {pendingDevices.map((dev) => (
            <SyncthingPendingDeviceRow
              key={dev.deviceId}
              device={dev}
              activePairingCode={activePairingCode}
              isPairingExpired={isPairingExpired}
              disabled={Boolean(activeAction)}
              onAccept={handleAcceptDevice}
              onDismiss={handleDismissDevice}
            />
          ))}
        </div>
      )}

      {/* Pending Folders */}
      {pendingFolders.length > 0 && (
        <div className={styles["pending-card__list"]}>
          <Typography variant="h4" size="xs">
            Shared Folder Offers
          </Typography>
          {pendingFolders.map((f) => (
            <SyncthingPendingFolderRow
              key={f.folderId}
              folder={f}
              disabled={Boolean(activeAction)}
              onAcceptFolder={handleAcceptFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SyncthingPendingSection;
