import React, { useState } from "react";
import { Badge, Button, Input, Typography } from "@app/design-system";
import {
  Check,
  FolderOpen,
  UserPlus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  syncthingAcceptDevice,
  syncthingAcceptFolder,
  syncthingDismissPendingDevice,
  type SyncthingPendingDevice,
  type SyncthingPendingFolder,
} from "./syncthingCommands";
import styles from "./SyncthingPendingSection.module.scss";

interface Props {
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  onUpdated: () => Promise<void>;
}

export function SyncthingPendingSection({
  pendingDevices,
  pendingFolders,
  onUpdated,
}: Props) {
  const [folderPaths, setFolderPaths] = useState<Record<string, string>>({});
  const [allowNonEmptyMap, setAllowNonEmptyMap] = useState<
    Record<string, boolean>
  >({});
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

  const handleAcceptFolder = async (folderId: string) => {
    const path = (folderPaths[folderId] || "").trim();
    if (!path) {
      setActionError("Please specify a target destination folder path.");
      return;
    }
    setActionError(null);
    setActiveAction(`accept-folder-${folderId}`);
    try {
      await syncthingAcceptFolder(
        folderId,
        path,
        allowNonEmptyMap[folderId] ?? false,
      );
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
            <div key={dev.deviceId} className={styles["pending-card__item"]}>
              <div className={styles["pending-card__item-info"]}>
                <span className={styles["pending-card__item-title"]}>
                  {dev.name || "Remote Device"}
                </span>
                <code className={styles["pending-card__item-id"]}>
                  {dev.deviceId}
                </code>
              </div>
              <div className={styles["pending-card__actions"]}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleAcceptDevice(dev.deviceId)}
                  disabled={Boolean(activeAction)}
                  aria-label={`Accept device ${dev.name || dev.deviceId}`}
                >
                  <Check size={14} />
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleDismissDevice(dev.deviceId)}
                  disabled={Boolean(activeAction)}
                  aria-label={`Ignore device ${dev.name || dev.deviceId}`}
                >
                  <X size={14} />
                  Ignore
                </Button>
              </div>
            </div>
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
            <div
              key={f.folderId}
              className={styles["pending-card__folder-offer"]}
            >
              <div className={styles["pending-card__item-info"]}>
                <span className={styles["pending-card__item-title"]}>
                  <FolderOpen size={14} />
                  {f.label || f.folderId}
                </span>
                <span className={styles["pending-card__item-id"]}>
                  From: {f.offeredBy}
                </span>
              </div>
              <div className={styles["pending-card__folder-setup"]}>
                <label
                  className={styles["pending-card__label"]}
                  htmlFor={`folder-path-${f.folderId}`}
                >
                  Target Destination Path:
                </label>
                <Input
                  id={`folder-path-${f.folderId}`}
                  value={folderPaths[f.folderId] || ""}
                  onChange={(e) =>
                    setFolderPaths((prev) => ({
                      ...prev,
                      [f.folderId]: e.target.value,
                    }))
                  }
                  placeholder="/Users/name/Vaults/SharedVault"
                  className={styles["pending-card__input-mono"]}
                />
                <label className={styles["pending-card__checkbox-label"]}>
                  <input
                    type="checkbox"
                    checked={Boolean(allowNonEmptyMap[f.folderId])}
                    onChange={(e) =>
                      setAllowNonEmptyMap((prev) => ({
                        ...prev,
                        [f.folderId]: e.target.checked,
                      }))
                    }
                  />
                  <span>Allow syncing into a non-empty directory</span>
                </label>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleAcceptFolder(f.folderId)}
                  disabled={
                    Boolean(activeAction) ||
                    !(folderPaths[f.folderId] || "").trim()
                  }
                >
                  <Check size={14} />
                  Accept Folder Offer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
