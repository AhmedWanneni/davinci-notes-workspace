import React from "react";
import { View } from "react-native";
import { WarningCircle } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Button, Text } from "./primitives";

export interface VaultInaccessibleBannerProps {
  error?: string;
  onRecover: () => void;
  onCreateNewFolder?: () => void;
}

export function VaultInaccessibleBanner({
  error,
  onRecover,
  onCreateNewFolder,
}: VaultInaccessibleBannerProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="m-4 p-4 border border-border-normal bg-bg-secondary rounded-md">
      <View className="flex-row items-center gap-2 mb-2">
        <WarningCircle size={20} color={tokens.color.text.error} />
        <Text variant="h3" color="error">
          Vault Inaccessible
        </Text>
      </View>
      <Text variant="body" color="muted" className="mb-4">
        {error ?? "The vault folder is missing or permission was revoked."}
      </Text>
      <View className="flex-row gap-2">
        <Button
          variant="primary"
          size="sm"
          onPress={onRecover}
          className="flex-1"
        >
          Recover Default
        </Button>
        {onCreateNewFolder ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={onCreateNewFolder}
            className="flex-1"
          >
            Create New Vault
          </Button>
        ) : null}
      </View>
    </View>
  );
}
