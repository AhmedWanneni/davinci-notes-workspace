import React from "react";
import { Check, Folder, Trash } from "@phosphor-icons/react";
import { DropdownMenuItem } from "@app/design-system";
import type { RecentVaultEntry } from "../../vault";
import styles from "./VaultSwitcher.module.scss";

export interface VaultSwitcherRecentItemProps {
  entry: RecentVaultEntry;
  isCurrent: boolean;
  onSwitchVault: (path: string) => void | Promise<void>;
  onRemove: (e: React.MouseEvent, path: string) => void | Promise<void>;
}

export function VaultSwitcherRecentItem({
  entry,
  isCurrent,
  onSwitchVault,
  onRemove,
}: VaultSwitcherRecentItemProps) {
  const isMissing = entry.exists === false;

  return (
    <DropdownMenuItem
      key={entry.path}
      disabled={isMissing}
      onClick={() => {
        if (!isMissing && !isCurrent) {
          void onSwitchVault(entry.path);
        }
      }}
      className={
        isMissing ? styles["vault-switcher__menu-item--unavailable"] : undefined
      }
    >
      <div className={styles["vault-switcher__menu-item-row"]}>
        <Folder
          size={16}
          weight={isCurrent ? "fill" : "regular"}
          className={styles["vault-switcher__vault-icon"]}
          aria-hidden="true"
        />
        <div className={styles["vault-switcher__menu-item-details"]}>
          <span className={styles["vault-switcher__menu-item-name"]}>
            {entry.name}
          </span>
          <span className={styles["vault-switcher__menu-item-path"]}>
            {entry.path}
          </span>
        </div>
        {isCurrent && (
          <Check size={14} weight="bold" aria-label="Active vault" />
        )}
        {isMissing && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className={styles["vault-switcher__missing-tag"]}>
              Missing
            </span>
            <button
              type="button"
              className={styles["vault-switcher__remove-btn"]}
              onClick={(e) => void onRemove(e, entry.path)}
              title="Remove from recent vaults"
              aria-label={`Remove ${entry.name} from list`}
            >
              <Trash size={12} weight="regular" />
            </button>
          </div>
        )}
      </div>
    </DropdownMenuItem>
  );
}
