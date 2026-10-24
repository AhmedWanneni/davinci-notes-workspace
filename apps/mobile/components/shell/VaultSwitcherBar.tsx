import React from "react";
import { View, Pressable } from "react-native";
import { Gear, CaretDown } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text, IconButton } from "../primitives";

export interface VaultSwitcherBarProps {
  vaultName: string;
  folderCount?: number;
  noteCount?: number;
  onSelectVault?: () => void;
  onOpenSettings?: () => void;
}

export function VaultSwitcherBar({
  vaultName,
  folderCount = 0,
  noteCount = 0,
  onSelectVault,
  onOpenSettings,
}: VaultSwitcherBarProps): React.ReactElement {
  const { tokens } = useTheme();

  const countSubtitle = `${folderCount} folders, ${noteCount} notes`;

  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 border-t"
      style={{
        backgroundColor: tokens.color.bg.primary,
        borderTopColor: tokens.color.border.subtle,
      }}
    >
      <Pressable
        onPress={onSelectVault}
        className="flex-1 mr-3"
        accessibilityRole="button"
        accessibilityLabel={`Switch vault, current vault: ${vaultName}, ${countSubtitle}`}
      >
        <View className="flex-row items-center">
          <Text
            variant="body"
            weight="semibold"
            color="normal"
            numberOfLines={1}
          >
            {vaultName}
          </Text>
          <View className="ml-1.5">
            <CaretDown
              size={14}
              color={tokens.color.text.muted}
              weight="bold"
            />
          </View>
        </View>
        <Text
          variant="caption"
          color="muted"
          numberOfLines={1}
          className="mt-0.5"
        >
          {countSubtitle}
        </Text>
      </Pressable>

      <View
        className="rounded-full overflow-hidden border"
        style={{
          borderColor: tokens.color.border.subtle,
          backgroundColor: tokens.color.bg.secondary,
        }}
      >
        <IconButton
          icon={
            <Gear size={20} color={tokens.color.text.normal} weight="regular" />
          }
          accessibilityLabel="Open settings"
          size="md"
          onPress={onOpenSettings}
        />
      </View>
    </View>
  );
}
