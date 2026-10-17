import React from "react";
import { View } from "react-native";
import { WarningCircle } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Button, Text } from "./primitives";

export interface VaultInaccessibleBannerProps {
  error?: string;
  onRecover: () => void;
}

export function VaultInaccessibleBanner({
  error,
  onRecover,
}: VaultInaccessibleBannerProps): React.ReactElement {
  return (
    <View className="m-4 p-4 border border-border-normal bg-bg-secondary rounded-md">
      <View className="flex-row items-center gap-2 mb-2">
        <WarningCircle size={20} color={darkColorTokens.text.error} />
        <Text variant="h3" color="error">
          Vault Inaccessible
        </Text>
      </View>
      <Text variant="body" color="muted" className="mb-4">
        {error ?? "The vault folder is missing or permission was revoked."}
      </Text>
      <Button variant="primary" onPress={onRecover}>
        Recover Default Vault
      </Button>
    </View>
  );
}
