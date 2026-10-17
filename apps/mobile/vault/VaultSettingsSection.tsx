import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { Folder, CaretRight } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Text, Button, ListItem } from "../components/primitives";
import { defaultVaultManager } from "./vaultManager";
import { VaultSwitcherSheet } from "./VaultSwitcherSheet";
import type { VaultInfo } from "./types";

export interface VaultSettingsSectionProps {
  onVaultChanged?: () => void;
}

export const VaultSettingsSection: React.FC<VaultSettingsSectionProps> = ({
  onVaultChanged,
}) => {
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const refresh = useCallback(async () => {
    const { info } = await defaultVaultManager.getActiveAdapter();
    setVaultInfo(info);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleVaultChanged = () => {
    refresh();
    onVaultChanged?.();
  };

  return (
    <View className="mb-6 p-4 rounded-card border border-border-normal bg-bg-secondary">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Folder size={18} color={darkColorTokens.text.accent} />
          <Text variant="h3" color="normal">
            Vault
          </Text>
        </View>
      </View>

      <ListItem
        title={vaultInfo?.name ?? "No Vault"}
        subtitle={
          vaultInfo?.mode === "sandbox" ? "App Sandbox" : "External Folder"
        }
        right={<CaretRight size={16} color={darkColorTokens.text.muted} />}
        onPress={() => setIsSwitcherOpen(true)}
      />

      <View className="mt-3">
        <Button
          variant="secondary"
          size="sm"
          onPress={() => setIsSwitcherOpen(true)}
        >
          Manage Vaults
        </Button>
      </View>

      <VaultSwitcherSheet
        visible={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onVaultChanged={handleVaultChanged}
      />
    </View>
  );
};
