import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { FolderPlus, FolderSimple, BookBookmark } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Text, Input, Button, Divider, Badge } from "../components/primitives";
import { defaultVaultManager } from "./vaultManager";

export interface FirstRunVaultScreenProps {
  onVaultReady: () => void;
}

export const FirstRunVaultScreen: React.FC<FirstRunVaultScreenProps> = ({
  onVaultReady,
}) => {
  const [vaultName, setVaultName] = useState("Personal Vault");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isExpoGo =
    Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;

  const handleCreateSandbox = async () => {
    const trimmed = vaultName.trim() || "Personal Vault";
    try {
      setIsCreating(true);
      setErrorMessage(null);
      await defaultVaultManager.createSandboxVault(trimmed);
      onVaultReady();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create vault folder.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenFolder = async () => {
    if (isExpoGo) {
      setErrorMessage(
        "Direct folder picking is disabled in Expo Go. Please create a sandbox vault or run in a development build.",
      );
      return;
    }

    try {
      setIsCreating(true);
      setErrorMessage(null);
      const res = await defaultVaultManager.pickAndOpenFolder();
      if (res.success) {
        onVaultReady();
      } else if (res.error) {
        setErrorMessage(
          `${res.error}\n(Note: Direct folder picking requires development build permissions. App sandbox vaults work everywhere).`,
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "External folder access is unavailable in this environment.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-bg-primary"
      contentContainerClassName="px-6 py-8"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    >
      <View className="mb-8 items-center">
        <View className="w-14 h-14 rounded-base bg-bg-secondary border border-border-normal items-center justify-center mb-4">
          <BookBookmark size={32} color={darkColorTokens.text.accent} />
        </View>
        <Text variant="h1" color="normal" className="text-center mb-2">
          DaVinci Notes
        </Text>
        <Text variant="body" color="muted" className="text-center px-4">
          Local-first, lightweight, and fast. Your notes belong to you as plain
          Markdown files.
        </Text>
      </View>

      <View className="bg-bg-secondary rounded-card border border-border-normal p-5 mb-6">
        <Text variant="h3" color="normal" className="mb-2">
          Create New Vault
        </Text>
        <Text variant="caption" color="muted" className="mb-4">
          Created securely in the app sandbox. Always fast, zero permission
          prompts, and synced seamlessly.
        </Text>

        <Input
          value={vaultName}
          onChangeText={setVaultName}
          placeholder="e.g. Work, Notes, Research"
          className="mb-4"
          autoCapitalize="words"
        />

        <Button
          variant="primary"
          size="md"
          onPress={handleCreateSandbox}
          disabled={isCreating}
          icon={
            <FolderPlus size={18} color={darkColorTokens.text["on-accent"]} />
          }
        >
          {isCreating ? "Creating..." : "Create Vault"}
        </Button>
      </View>

      <View className="flex-row items-center my-4">
        <Divider className="flex-1" />
        <Text variant="caption" color="faint" className="px-3 uppercase">
          Or
        </Text>
        <Divider className="flex-1" />
      </View>

      <View
        className={`bg-bg-secondary rounded-card border border-border-normal p-5 mb-6 ${
          isExpoGo ? "opacity-75" : ""
        }`}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text variant="h3" color={isExpoGo ? "muted" : "normal"}>
            Open Existing Folder
          </Text>
          {isExpoGo && <Badge variant="neutral">Expo Go</Badge>}
        </View>
        <Text variant="caption" color="muted" className="mb-4">
          {isExpoGo
            ? "External folder access requires native permissions unavailable in Expo Go. Use 'Create New Vault' above or use a dev build."
            : "Open an existing folder of Markdown files from Files, iCloud Drive, or Syncthing."}
        </Text>

        <Button
          variant="secondary"
          size="md"
          onPress={handleOpenFolder}
          disabled={isCreating || isExpoGo}
          icon={
            <FolderSimple
              size={18}
              color={
                isExpoGo
                  ? darkColorTokens.text.muted
                  : darkColorTokens.text.normal
              }
            />
          }
        >
          {isExpoGo ? "Open Folder (Dev Build only)" : "Open Folder"}
        </Button>
      </View>

      {errorMessage && (
        <View className="p-4 rounded-base bg-bg-secondary border border-border-status-error mb-4">
          <Text variant="body" color="error">
            {errorMessage}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
