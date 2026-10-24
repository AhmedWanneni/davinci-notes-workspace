import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Plus, FolderSimple } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Sheet, Button, Text, Input, Divider } from "../components/primitives";
import { defaultVaultManager } from "./vaultManager";
import type { RegisteredVault } from "./vaultRegistryTypes";
import { VaultSwitcherItem } from "./VaultSwitcherItem";

export interface VaultSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
  onVaultChanged: () => void;
}

export const VaultSwitcherSheet: React.FC<VaultSwitcherSheetProps> = ({
  visible,
  onClose,
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
    if (visible) {
      refreshRegistry();
      setShowCreateInput(false);
      setRenamingUri(null);
      setErrorMsg(null);
    }
  }, [visible, refreshRegistry]);

  const handleSelectVault = async (uri: string) => {
    if (uri === activeUri) {
      onClose();
      return;
    }
    await defaultVaultManager.switchVault(uri);
    onVaultChanged();
    onClose();
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
            onVaultChanged();
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
      onVaultChanged();
      onClose();
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
      onVaultChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Rename failed.");
    }
  };

  const isExpoGo =
    Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

  const handleOpenFolder = async () => {
    if (isExpoGo) {
      setErrorMsg(
        "External folder picking requires native permissions unavailable in Expo Go. Use 'New Vault' for app sandbox storage or run a development build.",
      );
      return;
    }
    try {
      const res = await defaultVaultManager.pickAndOpenFolder();
      if (res.success) {
        await refreshRegistry();
        onVaultChanged();
        onClose();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Picker error");
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Vaults">
      <ScrollView className="max-h-96 px-2 py-2">
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
            onSelect={() => handleSelectVault(vault.uri)}
            onRemove={() => handleRemoveVault(vault)}
          />
        ))}

        {errorMsg ? (
          <View className="p-3 my-2 bg-bg-secondary border border-border-status-error rounded-base">
            <Text variant="caption" color="error">
              {errorMsg}
            </Text>
          </View>
        ) : null}

        <Divider className="my-2" />

        {showCreateInput ? (
          <View className="p-2 gap-2">
            <Input
              value={newVaultName}
              onChangeText={setNewVaultName}
              placeholder="Vault name"
              autoFocus
            />
            <View className="flex-row gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowCreateInput(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onPress={handleCreateNew}>
                Create
              </Button>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-2 p-2">
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
      </ScrollView>
    </Sheet>
  );
};
