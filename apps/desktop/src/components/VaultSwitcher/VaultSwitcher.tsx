import React, { useState, useEffect } from "react";
import {
  CaretUpDown,
  Question,
  Folder,
  FolderOpen,
  FolderPlus,
  ListBullets,
  ArrowsClockwise,
  CloudArrowDown,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Tooltip,
  TooltipProvider,
} from "@app/design-system";
import {
  getRecentVaults,
  removeRecentVault,
  type RecentVaultEntry,
} from "../../vault";
import { VaultSwitcherRecentItem } from "./VaultSwitcherRecentItem";
import styles from "./VaultSwitcher.module.scss";

export interface VaultSwitcherProps {
  vaultName?: string;
  vaultPath: string | null;
  isCollapsed?: boolean;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onOpenLogs?: () => void;
  onSwitchVault: (path: string) => void | Promise<void>;
  onOpenFolderPicker: () => void | Promise<void>;
  onCreateNewVault?: () => void | Promise<void>;
  onOpenVaultFromDrive?: () => void | Promise<void>;
  onSyncVault?: () => void | Promise<void>;
}

export function VaultSwitcher({
  vaultName,
  vaultPath,
  isCollapsed = false,
  onOpenSettings: _onOpenSettings,
  onOpenHelp,
  onOpenLogs,
  onSwitchVault,
  onOpenFolderPicker,
  onCreateNewVault,
  onOpenVaultFromDrive,
  onSyncVault,
}: VaultSwitcherProps) {
  const [recentVaults, setRecentVaults] = useState<RecentVaultEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadRecent = async () => {
    const list = await getRecentVaults();
    setRecentVaults(list);
  };

  useEffect(() => {
    if (isOpen) {
      void loadRecent();
    }
  }, [isOpen]);

  const handleRemove = async (e: React.MouseEvent, pathToRemove: string) => {
    e.stopPropagation();
    const updated = await removeRecentVault(pathToRemove);
    setRecentVaults(updated);
  };

  const effectiveName =
    vaultName || (vaultPath ? vaultPath.split("/").pop() || "Vault" : "Vault");

  const triggerBtn = (
    <button
      type="button"
      className={styles["vault-switcher__trigger"]}
      data-collapsed={isCollapsed || undefined}
      onClick={() => setIsOpen((prev) => !prev)}
      aria-label={`Current vault: ${effectiveName}. Click to switch vault.`}
      title={vaultPath ?? undefined}
    >
      {isCollapsed ? (
        <Folder size={18} weight="regular" />
      ) : (
        <>
          <CaretUpDown
            size={16}
            weight="regular"
            className={styles["vault-switcher__caret"]}
          />
          <span className={styles["vault-switcher__name"]}>{effectiveName}</span>
        </>
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`${styles["vault-switcher"]}${isCollapsed ? ` ${styles["vault-switcher--collapsed"]}` : ""}`}
        data-testid="vault-switcher"
      >
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            {isCollapsed ? (
              <Tooltip content={`Vault: ${effectiveName}`} contentProps={{ side: "right" }}>
                {triggerBtn}
              </Tooltip>
            ) : (
              triggerBtn
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align={isCollapsed ? "end" : "start"}
            side={isCollapsed ? "right" : "top"}
            className={styles["vault-switcher__menu-content"]}
          >
            {recentVaults.map((entry) => (
              <VaultSwitcherRecentItem
                key={entry.path}
                entry={entry}
                isCurrent={entry.path === vaultPath}
                onSwitchVault={onSwitchVault}
                onRemove={handleRemove}
              />
            ))}

            {recentVaults.length > 0 && <DropdownMenuSeparator />}

            <DropdownMenuItem onClick={() => void onOpenFolderPicker()}>
              <FolderOpen size={16} weight="regular" style={{ marginRight: 8 }} />
              <span>Open folder as vault…</span>
            </DropdownMenuItem>

            {onCreateNewVault && (
              <DropdownMenuItem onClick={() => void onCreateNewVault()}>
                <FolderPlus size={16} weight="regular" style={{ marginRight: 8 }} />
                <span>Create new vault…</span>
              </DropdownMenuItem>
            )}

            {onOpenVaultFromDrive && (
              <DropdownMenuItem onClick={() => void onOpenVaultFromDrive()}>
                <CloudArrowDown size={16} weight="regular" style={{ marginRight: 8 }} />
                <span>Open vault from Drive…</span>
              </DropdownMenuItem>
            )}

            {onSyncVault && (
              <DropdownMenuItem onClick={() => void onSyncVault()}>
                <ArrowsClockwise size={16} weight="regular" style={{ marginRight: 8 }} />
                <span>Sync vault with Drive…</span>
              </DropdownMenuItem>
            )}

            {onOpenLogs && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void onOpenLogs()}>
                  <ListBullets size={16} weight="regular" style={{ marginRight: 8 }} />
                  <span>View vault logs…</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {!isCollapsed && (
          <div className={styles["vault-switcher__actions"]}>
            <Tooltip content="Help" contentProps={{ side: "top" }}>
              <button
                type="button"
                className={styles["vault-switcher__icon-btn"]}
                onClick={() => {
                  if (onOpenHelp) {
                    onOpenHelp();
                  } else {
                    console.info("[help] Help clicked (stub).");
                  }
                }}
                aria-label="Help"
              >
                <Question size={18} weight="regular" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
