import React from "react";
import { View, Pressable, Text } from "react-native";
import {
  SidebarSimple,
  DotsThreeVertical,
  MagnifyingGlass,
  CheckSquare,
} from "phosphor-react-native";
import { useTheme } from "../theme";
import { IconButton } from "./primitives";

export type EditorHeaderMode = "note" | "text" | "edit" | "preview";

export interface EditorHeaderProps {
  title?: string;
  payloadBytes?: number;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onBack: () => void;
  mode?: EditorHeaderMode;
  onToggleMode?: (nextMode: "note" | "text") => void;
  onOpenDrawer?: () => void;
  onOpenActions?: () => void;
  onOpenSearch?: () => void;
  onOpenTodos?: () => void;
}

export function EditorHeader({
  mode = "note",
  onBack,
  onToggleMode,
  onOpenDrawer,
  onOpenActions,
  onOpenSearch,
  onOpenTodos,
}: EditorHeaderProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View
      className="h-[48px] flex-row items-center justify-between px-4"
      style={{
        backgroundColor: tokens.color.bg.primary,
      }}
    >
      {/* Left: Sidebar navigation and More options (...) */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onOpenDrawer ?? onBack}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar navigation"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: tokens.color.border.subtle,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tokens.color.bg.primary,
          }}
        >
          <SidebarSimple
            size={20}
            color="#000000"
            weight="regular"
          />
        </Pressable>

        {onOpenActions ? (
          <IconButton
            icon={
              <DotsThreeVertical
                size={22}
                color="#000000"
                weight="bold"
              />
            }
            accessibilityLabel="More options"
            size="sm"
            onPress={onOpenActions}
          />
        ) : null}
      </View>

      {/* Middle: Clean space */}
      <View className="flex-1" />

      {/* Right: Search and Todos */}
      <View className="flex-row items-center gap-1">
        {onOpenSearch ? (
          <Pressable
            onPress={onOpenSearch}
            accessibilityRole="button"
            accessibilityLabel="Search"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <MagnifyingGlass size={20} color="#000000" weight="regular" />
          </Pressable>
        ) : null}

        {onOpenTodos ? (
          <Pressable
            onPress={onOpenTodos}
            accessibilityRole="button"
            accessibilityLabel="Todos page"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <CheckSquare size={20} color="#000000" weight="regular" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
