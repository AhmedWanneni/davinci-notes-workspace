import React from "react";
import { View } from "react-native";
import { Check, Trash, PencilSimple } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import {
  ListItem,
  Button,
  IconButton,
  Text,
  Input,
  Badge,
} from "../components/primitives";
import type { RegisteredVault } from "./vaultRegistryTypes";

export interface VaultSwitcherItemProps {
  vault: RegisteredVault;
  isActive: boolean;
  isRenaming: boolean;
  renamingName: string;
  onStartRename: () => void;
  onCancelRename: () => void;
  onChangeRenamingName: (val: string) => void;
  onSaveRename: () => void;
  onSelect: () => void;
  onRemove: () => void;
}

export const VaultSwitcherItem: React.FC<VaultSwitcherItemProps> = ({
  vault,
  isActive,
  isRenaming,
  renamingName,
  onStartRename,
  onCancelRename,
  onChangeRenamingName,
  onSaveRename,
  onSelect,
  onRemove,
}) => {
  if (isRenaming) {
    return (
      <View className="p-2 gap-2 bg-bg-hover rounded-md my-1">
        <Text variant="caption" color="muted">
          Rename display name:
        </Text>
        <Input
          value={renamingName}
          onChangeText={onChangeRenamingName}
          placeholder="Vault display name"
          autoFocus
        />
        <View className="flex-row gap-2 justify-end">
          <Button variant="ghost" size="sm" onPress={onCancelRename}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onPress={onSaveRename}>
            Save
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ListItem
      title={vault.name}
      subtitle={
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <Badge variant={vault.mode === "sandbox" ? "neutral" : "accent"}>
            {vault.mode === "sandbox" ? "App Sandbox" : "External Folder"}
          </Badge>
        </View>
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
        <View className="flex-row items-center gap-1">
          <IconButton
            icon={
              <PencilSimple
                size={16}
                color={darkColorTokens.text.muted}
              />
            }
            onPress={onStartRename}
            accessibilityLabel={`Rename ${vault.name}`}
            size="sm"
          />
          {!isActive ? (
            <IconButton
              icon={
                <Trash
                  size={16}
                  color={darkColorTokens.text.muted}
                />
              }
              onPress={onRemove}
              accessibilityLabel={`Remove ${vault.name}`}
              size="sm"
            />
          ) : null}
        </View>
      }
      onPress={onSelect}
    />
  );
};
