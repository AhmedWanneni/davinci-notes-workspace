import React, { useState } from "react";
import { Button, Input } from "@app/design-system";
import { Check, FolderOpen } from "@phosphor-icons/react";
import { pickVaultFolder } from "../../vault/pickVaultFolder";
import type { SyncthingPendingFolder } from "./syncthingCommands";
import styles from "./SyncthingPendingSection.module.scss";

export interface SyncthingPendingFolderRowProps {
  folder: SyncthingPendingFolder;
  disabled: boolean;
  onAcceptFolder: (folderId: string, path: string, allowNonEmpty: boolean) => Promise<void>;
}

export function SyncthingPendingFolderRow({
  folder,
  disabled,
  onAcceptFolder,
}: SyncthingPendingFolderRowProps) {
  const [targetPath, setTargetPath] = useState("");
  const [allowNonEmpty, setAllowNonEmpty] = useState(false);

  const handleBrowse = async () => {
    try {
      const picked = await pickVaultFolder();
      if (picked) {
        setTargetPath(picked);
      }
    } catch {
      // ignore
    }
  };

  const handleAccept = () => {
    if (!targetPath.trim()) return;
    void onAcceptFolder(folder.folderId, targetPath.trim(), allowNonEmpty);
  };

  return (
    <div
      className={styles["pending-card__folder-offer"]}
      data-testid={`pending-folder-${folder.folderId}`}
    >
      <div className={styles["pending-card__item-info"]}>
        <span className={styles["pending-card__item-title"]}>
          <FolderOpen size={14} />
          {folder.label || folder.folderId}
        </span>
        <span className={styles["pending-card__item-id"]}>
          From: {folder.offeredBy}
        </span>
      </div>

      <div className={styles["pending-card__folder-setup"]}>
        <label
          className={styles["pending-card__label"]}
          htmlFor={`folder-path-${folder.folderId}`}
        >
          Target Destination Path:
        </label>
        <div className={styles["pending-card__path-row"]}>
          <Input
            id={`folder-path-${folder.folderId}`}
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            placeholder="/Users/name/Vaults/SharedVault"
            className={styles["pending-card__input-mono"]}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleBrowse}
            disabled={disabled}
          >
            Browse...
          </Button>
        </div>
        <label className={styles["pending-card__checkbox-label"]}>
          <input
            type="checkbox"
            checked={allowNonEmpty}
            onChange={(e) => setAllowNonEmpty(e.target.checked)}
          />
          <span>Allow syncing into a non-empty directory</span>
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAccept}
          disabled={disabled || !targetPath.trim()}
        >
          <Check size={14} />
          Accept Folder Offer
        </Button>
      </div>
    </div>
  );
}
