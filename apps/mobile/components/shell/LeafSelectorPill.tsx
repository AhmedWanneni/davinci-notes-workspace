import React from "react";
import { View, Pressable } from "react-native";
import {
  FolderSimple,
  MagnifyingGlass,
  Tag,
  CaretDown,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export type NavigationLeafType = "files" | "search" | "tags";

export interface LeafSelectorPillProps {
  activeLeaf?: NavigationLeafType;
  onSelectLeaf?: (leaf: NavigationLeafType) => void;
  onPressPill?: () => void;
}

export function LeafSelectorPill({
  activeLeaf = "files",
  onPressPill,
}: LeafSelectorPillProps): React.ReactElement {
  const { tokens } = useTheme();

  const leafConfig = {
    files: {
      label: "Files",
      icon: (c: string) => <FolderSimple size={18} color={c} weight="fill" />,
    },
    search: {
      label: "Search",
      icon: (c: string) => (
        <MagnifyingGlass size={18} color={c} weight="bold" />
      ),
    },
    tags: {
      label: "Tags",
      icon: (c: string) => <Tag size={18} color={c} weight="fill" />,
    },
  }[activeLeaf];

  return (
    <Pressable
      onPress={onPressPill}
      accessibilityRole="button"
      accessibilityLabel={`Navigation leaf: ${leafConfig.label}`}
      className="flex-row items-center px-3 py-1.5 rounded-full border self-start"
      style={{
        backgroundColor: tokens.color.bg.secondary,
        borderColor: tokens.color.border.subtle,
      }}
    >
      <View className="mr-1.5">
        {leafConfig.icon(tokens.color.interactive.accent)}
      </View>
      <Text variant="text" weight="semibold" color="normal">
        {leafConfig.label}
      </Text>
      <View className="ml-1.5">
        <CaretDown size={14} color={tokens.color.text.muted} weight="bold" />
      </View>
    </Pressable>
  );
}
