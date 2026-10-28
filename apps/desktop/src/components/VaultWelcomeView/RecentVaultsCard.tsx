import React from "react";
import { Badge, Typography } from "@app/design-system";
import { Folder, X } from "@phosphor-icons/react";
import type { RecentVaultEntry } from "../../vault/recentVaultsRegistry";
import styles from "./RecentVaultsCard.module.scss";

export interface RecentVaultsCardProps {
  entries: RecentVaultEntry[];
  onSelectVault: (path: string) => void;
  onRemoveVault: (path: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function RecentVaultsCard({
  entries,
  onSelectVault,
  onRemoveVault,
}: RecentVaultsCardProps) {
  if (entries.length === 0) return null;

  return (
    <div className={styles["recent-vaults"]} data-testid="recent-vaults-card">
      <div className={styles["recent-vaults__header"]}>
        <Typography variant="h3" size="xs">
          Recent Vaults
        </Typography>
      </div>
      <ul className={styles["recent-vaults__list"]} role="list">
        {entries.map((entry) => (
          <li key={entry.path} className={styles["recent-vaults__item"]}>
            <button
              type="button"
              className={styles["recent-vaults__button"]}
              onClick={() => onSelectVault(entry.path)}
              aria-label={`Open ${entry.name}`}
            >
              <div className={styles["recent-vaults__name-row"]}>
                <Folder size={14} weight="regular" />
                <span className={styles["recent-vaults__name"]}>
                  {entry.name}
                </span>
                {entry.exists === false && (
                  <Badge variant="warning">Missing</Badge>
                )}
                <span className={styles["recent-vaults__time"]}>
                  {formatRelativeTime(entry.lastOpenedAt)}
                </span>
              </div>
              <span className={styles["recent-vaults__path"]}>
                {entry.path}
              </span>
            </button>
            <button
              type="button"
              className={styles["recent-vaults__remove"]}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveVault(entry.path);
              }}
              title="Remove from recents"
              aria-label={`Remove ${entry.name} from recent vaults`}
            >
              <X size={14} weight="bold" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
