import React from "react";
import { View, Pressable } from "react-native";
import { Folder, DotsThree } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface FolderCardGridItemProps {
  name: string;
  itemCount?: number;
  icon?: string;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export function FolderCardGridItem({
  name,
  itemCount = 0,
  icon,
  onPress,
  onOptionsPress,
}: FolderCardGridItemProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open folder ${name}`}
      className="flex-1 m-1.5 p-3.5 rounded-2xl active:opacity-80 shadow-sm"
      style={{
        backgroundColor: tokens.color.bg.primary,
        elevation: 2,
        minHeight: 180,
      }}
    >
      {/* Top Header: Folder Name & Options */}
      <View className="flex-row items-center justify-between mb-0.5">
        <Text
          variant="body"
          weight="bold"
          numberOfLines={1}
          style={{ fontSize: 16, color: tokens.color.text.normal, flex: 1 }}
        >
          {name}
        </Text>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onOptionsPress?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Options"
          className="p-1 -mr-1 active:opacity-60"
        >
          <DotsThree size={18} color={tokens.color.text.muted} weight="bold" />
        </Pressable>
      </View>

      {/* Subtitle: Item count */}
      <Text
        variant="caption"
        style={{
          fontSize: 12,
          color: tokens.color.text.muted,
          marginBottom: 12,
        }}
      >
        {itemCount === 1 ? "1 note" : `${itemCount} notes`}
      </Text>

      {/* Card Body: Folder Icon / Emoji display */}
      <View
        className="flex-1 rounded-xl items-center justify-center"
        style={{ backgroundColor: tokens.color.bg.secondary }}
      >
        {icon ? (
          <Text style={{ fontSize: 38 }}>{icon}</Text>
        ) : (
          <Folder size={40} color={tokens.color.interactive.accent} weight="fill" />
        )}
      </View>
    </Pressable>
  );
}
