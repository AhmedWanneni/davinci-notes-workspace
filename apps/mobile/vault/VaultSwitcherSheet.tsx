import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Check, Trash, Plus, FolderSimple } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import {
  Sheet,
  ListItem,
  Button,
  IconButton,
  Text,
  Input,
  Divider,
} from "../components/primitives";
import { defaultVaultManager } from "./vaultManager";
import type { RegisteredVault } from "./vaultRegistryTypes";

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
  const [vaults, setVaults] = useState<readonly RegisteredVault[]>([]);
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
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

  const handleRemoveVault = async (uri: string) => {
    await defaultVaultManager.removeVault(uri);
    await refreshRegistry();
    onVaultChanged();
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

  const isExpoGo =
    Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

  const handleOpenFolder = async () => {
    if (isExpoGo) {
      setErrorMsg(
        "External folder picking is unavailable in Expo Go. Use 'New Vault' for sandbox storage or run a development build.",
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
        {vaults.map((vault) => {
          const isActive = vault.uri === activeUri;
          return (
            <ListItem
              key={vault.uri}
              title={vault.name}
              subtitle={
                vault.mode === "sandbox" ? "App Sandbox" : "External Folder"
              }
              left={
                isActive ? (
                  <Check
                    size={18}
                    color={darkColorTokens.text.accent}
                    weight="bold"
                  />
                ) : (
                  <View className="w-[18px]" />
                )
              }
              right={
                vaults.length > 1 ? (
                  <IconButton
                    icon={
                      <Trash size={16} color={darkColorTokens.text.muted} />
                    }
                    accessibilityLabel={`Remove ${vault.name}`}
                    size="sm"
                    onPress={() => handleRemoveVault(vault.uri)}
                  />
                ) : undefined
              }
              onPress={() => handleSelectVault(vault.uri)}
            />
          );
        })}

        {errorMsg && (
          <View className="p-3 my-2 bg-bg-secondary border border-border-status-error rounded-base">
            <Text variant="caption" color="error">
              {errorMsg}
            </Text>
          </View>
        )}

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
              icon={<Plus size={16} color={darkColorTokens.text.normal} />}
              onPress={() => setShowCreateInput(true)}
            >
              New Vault
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              icon={
                <FolderSimple size={16} color={darkColorTokens.text.normal} />
              }
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
