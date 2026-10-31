import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import type { SyncthingSharedVault } from "@app/syncthing-api";
import { useTheme } from "../../theme";
import { Badge, Button, Text } from "../../components/primitives";

export interface SyncthingSharedVaultsSectionProps {
  vaults: SyncthingSharedVault[];
  onOpenVault: (path: string, label: string) => Promise<void>;
  onUnshareVault: (folderId: string) => Promise<void>;
}

export const SyncthingSharedVaultsSection: React.FC<
  SyncthingSharedVaultsSectionProps
> = ({ vaults, onOpenVault, onUnshareVault }) => {
  const { tokens } = useTheme();
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);

  if (vaults.length === 0) return null;

  const handleOpen = async (path: string, label: string) => {
    setBusyFolderId(path);
    try {
      await onOpenVault(path, label);
    } finally {
      setBusyFolderId(null);
    }
  };

  const handleUnshare = async (folderId: string) => {
    setBusyFolderId(folderId);
    try {
      await onUnshareVault(folderId);
    } finally {
      setBusyFolderId(null);
    }
  };

  return (
    <View
      className="mb-4 p-3 rounded-lg border"
      style={{
        backgroundColor: tokens.color.bg.primary,
        borderColor: tokens.color.border.subtle,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text variant="h3" color="normal">
          Shared Vaults & Folders
        </Text>
        <Badge variant={vaults.length > 0 ? "accent" : "neutral"}>
          {`${vaults.length} ${vaults.length === 1 ? "vault" : "vaults"}`}
        </Badge>
      </View>

      {vaults.map((vault) => {
        const isBusy =
          busyFolderId === vault.folderId || busyFolderId === vault.path;
        const deviceCount = vault.sharedWithDeviceIds.length;

        return (
          <View
            key={vault.folderId}
            className="p-2.5 rounded border mb-2 last:mb-0"
            style={{
              backgroundColor: tokens.color.bg.secondary,
              borderColor: tokens.color.border.subtle,
            }}
          >
            <View className="flex-row items-center justify-between mb-1.5 flex-wrap gap-1">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text size="sm" weight="medium" color="normal">
                  {vault.label || vault.folderId}
                </Text>
                {vault.isActiveVault ? (
                  <Badge variant="accent">Active Vault</Badge>
                ) : (
                  <Badge variant="neutral">Synced Vault</Badge>
                )}
                {vault.paused && <Badge variant="warning">Paused</Badge>}
                <Badge variant="neutral">
                  {`${deviceCount} ${deviceCount === 1 ? "device" : "devices"}`}
                </Badge>
              </View>

              <View className="flex-row items-center gap-1">
                {!vault.isActiveVault && (
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handleOpen(vault.path, vault.label)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator
                        size="small"
                        color={tokens.color.text["on-accent"]}
                      />
                    ) : (
                      "Open Vault"
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleUnshare(vault.folderId)}
                  disabled={isBusy}
                >
                  Unshare
                </Button>
              </View>
            </View>

            <Text size="xs" color="muted" className="font-mono" numberOfLines={1}>
              {vault.path}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

SyncthingSharedVaultsSection.displayName = "SyncthingSharedVaultsSection";
