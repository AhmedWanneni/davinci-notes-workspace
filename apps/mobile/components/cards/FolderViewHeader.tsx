import React from "react";
import { View, Pressable } from "react-native";
import {
  CaretDown,
  List as ListIcon,
  SquaresFour,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export type FolderDisplayMode = "list" | "grid";

export interface FolderViewHeaderProps {
  folderLabel?: string;
  sortLabel?: string;
  displayMode: FolderDisplayMode;
  onChangeDisplayMode: (mode: FolderDisplayMode) => void;
  onPressFolderDropdown?: () => void;
  onPressSortDropdown?: () => void;
}

export function FolderViewHeader({
  folderLabel = "Все файлы",
  sortLabel = "Последние",
  displayMode,
  onChangeDisplayMode,
  onPressFolderDropdown,
  onPressSortDropdown,
}: FolderViewHeaderProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="flex-row items-center justify-between px-4 py-2.5">
      {/* Left Filters */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onPressFolderDropdown}
          accessibilityRole="button"
          accessibilityLabel={folderLabel}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text
            variant="body"
            weight="medium"
            style={{ fontSize: 15, color: tokens.color.text.muted }}
          >
            {folderLabel}
          </Text>
          <CaretDown size={14} color={tokens.color.text.muted} weight="bold" />
        </Pressable>

        <Pressable
          onPress={onPressSortDropdown}
          accessibilityRole="button"
          accessibilityLabel={sortLabel}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text
            variant="body"
            weight="medium"
            style={{ fontSize: 15, color: tokens.color.text.muted }}
          >
            {sortLabel}
          </Text>
          <CaretDown size={14} color={tokens.color.text.muted} weight="bold" />
        </Pressable>
      </View>

      {/* Right View Mode Toggle (List vs Grid) */}
      <View
        className="flex-row items-center p-1 rounded-xl"
        style={{ backgroundColor: tokens.color.bg.secondary }}
      >
        <Pressable
          onPress={() => onChangeDisplayMode("list")}
          accessibilityRole="button"
          accessibilityLabel="List view"
          className="w-8 h-8 rounded-lg items-center justify-center active:opacity-75"
          style={{
            backgroundColor:
              displayMode === "list" ? tokens.color.bg.primary : "transparent",
          }}
        >
          <ListIcon
            size={18}
            color={
              displayMode === "list"
                ? tokens.color.text.normal
                : tokens.color.text.muted
            }
            weight={displayMode === "list" ? "bold" : "regular"}
          />
        </Pressable>

        <Pressable
          onPress={() => onChangeDisplayMode("grid")}
          accessibilityRole="button"
          accessibilityLabel="Grid view"
          className="w-8 h-8 rounded-lg items-center justify-center active:opacity-75"
          style={{
            backgroundColor:
              displayMode === "grid" ? tokens.color.bg.primary : "transparent",
          }}
        >
          <SquaresFour
            size={18}
            color={
              displayMode === "grid"
                ? tokens.color.text.normal
                : tokens.color.text.muted
            }
            weight={displayMode === "grid" ? "fill" : "regular"}
          />
        </Pressable>
      </View>
    </View>
  );
}
