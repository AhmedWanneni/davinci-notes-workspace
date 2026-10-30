import React, { useState } from "react";
import { Badge, Button, Typography } from "@app/design-system";
import { ArrowSquareOut, Folder, Trash } from "@phosphor-icons/react";
import type { SyncthingSharedVault } from "./syncthingCommands";
import { showInFolder, syncthingUnshareVaultFolder } from "./syncthingCommands";
import styles from "./SyncthingSharedVaultsSection.module.scss";

export interface SyncthingSharedVaultsSectionProps {
  vaults: SyncthingSharedVault[];
  onOpenVault?: (path: string) => void;
  onUpdated: () => Promise<void>;
}

export function SyncthingSharedVaultsSection({
  vaults,
  onOpenVault,
  onUpdated,
}: SyncthingSharedVaultsSectionProps): React.JSX.Element {
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);

  const handleOpenVault = (path: string) => {
    onOpenVault?.(path);
  };

  const handleReveal = async (path: string) => {
    try {
      await showInFolder(path);
    } catch {
      // ignore reveal errors
    }
  };

  const handleUnshare = async (folderId: string) => {
    setBusyFolderId(folderId);
    try {
      await syncthingUnshareVaultFolder(folderId);
      await onUpdated();
    } finally {
      setBusyFolderId(null);
    }
  };

  return (
    <div
      className={styles["shared-vaults-card"]}
      data-testid="syncthing-shared-vaults"
    >
      <div className={styles["shared-vaults-card__header"]}>
        <div className={styles["shared-vaults-card__title"]}>
          <Folder size={16} />
          <Typography variant="h4" size="sm">
            Shared Vaults & Folders
          </Typography>
        </div>
        <Badge variant={vaults.length > 0 ? "accent" : "neutral"}>
          {vaults.length} {vaults.length === 1 ? "vault" : "vaults"}
        </Badge>
      </div>

      {vaults.length === 0 ? (
        <p className={styles["shared-vaults-card__empty-state"]}>
          No shared vaults yet. When a folder is shared and accepted, or when
          you share a vault with a paired device, it will appear here.
        </p>
      ) : (
        <ul className={styles["shared-vaults-card__list"]}>
          {vaults.map((vault) => {
            const isBusy = busyFolderId === vault.folderId;
            const deviceCount = vault.sharedWithDeviceIds.length;
            return (
              <li
                key={vault.folderId}
                className={styles["shared-vaults-card__item"]}
              >
                <div className={styles["shared-vaults-card__item-header"]}>
                  <div
                    className={styles["shared-vaults-card__item-name-group"]}
                  >
                    <span className={styles["shared-vaults-card__item-name"]}>
                      {vault.label || vault.folderId}
                    </span>
                    {vault.isActiveVault ? (
                      <Badge variant="accent">Active Vault</Badge>
                    ) : (
                      <Badge variant="neutral">Synced Vault</Badge>
                    )}
                    {vault.paused && <Badge variant="warning">Paused</Badge>}
                    <Badge variant="neutral">
                      {deviceCount} {deviceCount === 1 ? "device" : "devices"}
                    </Badge>
                  </div>

                  <div className={styles["shared-vaults-card__item-actions"]}>
                    {!vault.isActiveVault && onOpenVault && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenVault(vault.path)}
                      >
                        Open Vault
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleReveal(vault.path)}
                      title="Reveal in file manager"
                    >
                      <ArrowSquareOut size={14} /> Reveal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleUnshare(vault.folderId)}
                      disabled={isBusy}
                      title="Stop syncing this folder"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </div>

                <div className={styles["shared-vaults-card__item-path"]}>
                  <code>{vault.path}</code>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
