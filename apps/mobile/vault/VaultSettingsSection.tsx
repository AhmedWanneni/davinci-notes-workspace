import React, { useState, useEffect, useCallback } from "react";
import { View, Alert } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Folder, Plus, FolderSimple } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text, Button, Input } from "../components/primitives";
import { defaultVaultManager } from "./vaultManager";
import { VaultSwitcherItem } from "./VaultSwitcherItem";
import type { RegisteredVault } from "./vaultRegistryTypes";

export interface VaultSettingsSectionProps {
  onVaultChanged?: () => void;
}

export const VaultSettingsSection: React.FC<VaultSettingsSectionProps> = ({
  onVaultChanged,
}) => {
  const { tokens } = useTheme();
  const [vaults, setVaults] = useState<readonly RegisteredVault[]>([]);
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [renamingUri, setRenamingUri] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshRegistry = useCallback(async () => {
    const reg = await defaultVaultManager.getRegistry();
    setVaults(reg.vaults);
    setActiveUri(reg.activeVaultUri);
  }, []);

  useEffect(() => {
    void refreshRegistry();
  }, [refreshRegistry]);

  const handleSelectVault = async (uri: string) => {
    if (uri === activeUri) return;
    await defaultVaultManager.switchVault(uri);
    await refreshRegistry();
    onVaultChanged?.();
  };

  const handleRemoveVault = (vault: RegisteredVault) => {
    Alert.alert(
      "Remove Vault",
      `Are you sure you want to remove "${vault.name}" from your vault list? Your notes and files will remain untouched on disk.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await defaultVaultManager.removeVault(vault.uri);
            await refreshRegistry();
            onVaultChanged?.();
          },
        },
      ],
    );
  };

  const handleCreateNew = async () => {
    const trimmed = newVaultName.trim();
    if (!trimmed) return;
    try {
      await defaultVaultManager.createSandboxVault(trimmed);
      setNewVaultName("");
      setShowCreateInput(false);
      await refreshRegistry();
      onVaultChanged?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Creation failed.");
    }
  };

  const handleSaveRename = async () => {
    const trimmed = renamingName.trim();
    if (!renamingUri || !trimmed) return;
    try {
      await defaultVaultManager.renameVault(renamingUri, trimmed);
      setRenamingUri(null);
      setRenamingName("");
      await refreshRegistry();
      onVaultChanged?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Rename failed.");
    }
  };

  const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

  const handleOpenFolder = async () => {
    if (isExpoGo) {
      setErrorMsg("External folder picking requires native permissions unavailable in Expo Go.");
      return;
    }
    try {
      const res = await defaultVaultManager.pickAndOpenFolder();
      if (res.success) {
        await refreshRegistry();
        onVaultChanged?.();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Picker error");
    }
  };

  return (
    <View className="mb-6">
      {/* Section Header */}
      <View className="flex-row items-center mb-1">
        <View className="mr-2">
          <Folder size={18} color={tokens.color.interactive.accent} weight="bold" />
        </View>
        <Text variant="body" weight="semibold" color="normal">
          Manage Vaults
        </Text>
      </View>
      <Text variant="caption" color="muted" className="mb-3">
        Switch between registered vaults, create a new local vault, or open an external folder.
      </Text>

      {errorMsg ? (
        <View className="p-3 mb-3 bg-accent-critical/10 border border-accent-critical rounded-lg">
          <Text variant="caption" color="error">{errorMsg}</Text>
        </View>
      ) : null}

      {/* Vault List Container */}
      <View
        className="rounded-xl border overflow-hidden mb-3"
        style={{
          borderColor: tokens.color.border.subtle,
          backgroundColor: tokens.color.bg.primary,
        }}
      >
        {vaults.map((vault) => (
          <VaultSwitcherItem
            key={vault.uri}
            vault={vault}
            isActive={vault.uri === activeUri}
            isRenaming={vault.uri === renamingUri}
            renamingName={renamingName}
            onStartRename={() => {
              setRenamingUri(vault.uri);
              setRenamingName(vault.name);
            }}
            onCancelRename={() => setRenamingUri(null)}
            onChangeRenamingName={setRenamingName}
            onSaveRename={handleSaveRename}
            onSelect={() => void handleSelectVault(vault.uri)}
            onRemove={() => handleRemoveVault(vault)}
          />
        ))}
      </View>

      {/* Action Buttons / Create Input */}
      {showCreateInput ? (
        <View className="p-3 rounded-xl border gap-2" style={{ borderColor: tokens.color.border.subtle, backgroundColor: tokens.color.bg.primary }}>
          <Text variant="caption" weight="medium" color="normal">New Vault Name</Text>
          <Input value={newVaultName} onChangeText={setNewVaultName} placeholder="Enter vault name..." autoFocus />
          <View className="flex-row gap-2 justify-end mt-1">
            <Button variant="ghost" size="sm" onPress={() => setShowCreateInput(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onPress={handleCreateNew}>Create Vault</Button>
          </View>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<Plus size={16} color={tokens.color.text.normal} />}
            onPress={() => setShowCreateInput(true)}
          >
            New Vault
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<FolderSimple size={16} color={tokens.color.text.normal} />}
            onPress={handleOpenFolder}
          >
            Open Folder
          </Button>
        </View>
      )}
    </View>
  );
};
