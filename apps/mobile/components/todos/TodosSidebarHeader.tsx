import React from "react";
import { View, Pressable } from "react-native";
import { X, FolderSimplePlus, CheckSquare } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface TodosSidebarHeaderProps {
  onClose: () => void;
  onAddProject: () => void;
}

export function TodosSidebarHeader({
  onClose,
  onAddProject,
}: TodosSidebarHeaderProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View
      className="flex-row items-center justify-between px-4 pb-3 border-b"
      style={{ borderBottomColor: tokens.color.border.subtle }}
    >
      <View className="flex-row items-center gap-2">
        <CheckSquare size={22} color={tokens.color.text.normal} weight="bold" />
        <Text
          style={{
            fontSize: 19,
            fontWeight: "700",
            color: tokens.color.text.normal,
          }}
        >
          Projects & Todos
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={() => {
            onClose();
            onAddProject();
          }}
          accessibilityRole="button"
          accessibilityLabel="Add project folder"
          className="p-1.5 active:opacity-60"
        >
          <FolderSimplePlus size={22} color={tokens.color.text.normal} />
        </Pressable>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close page"
          className="p-1.5 active:opacity-60"
        >
          <X size={22} color={tokens.color.text.normal} />
        </Pressable>
      </View>
    </View>
  );
}
