import React from "react";
import { View, Pressable } from "react-native";
import {
  SidebarSimple,
  DotsThreeVertical,
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
  mode: _mode = "note",
  onBack,
  onToggleMode: _onToggleMode,
  onOpenDrawer,
  onOpenActions,
  onOpenSearch: _onOpenSearch,
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
      {/* Left: Sidebar navigation */}
      <Pressable
        onPress={onOpenDrawer ?? onBack}
        accessibilityRole="button"
        accessibilityLabel="Open sidebar navigation"
        className="w-9 h-9 rounded-lg items-center justify-center active:bg-bg-hover"
      >
        <SidebarSimple
          size={20}
          color={tokens.color.text.normal}
          weight="regular"
        />
      </Pressable>

      {/* Middle: Clean space */}
      <View className="flex-1" />

      {/* Right: Todos and More options (...) */}
      <View className="flex-row items-center gap-1">
        {onOpenTodos ? (
          <Pressable
            onPress={onOpenTodos}
            accessibilityRole="button"
            accessibilityLabel="Todos page"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <CheckSquare size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>
        ) : null}

        {onOpenActions ? (
          <IconButton
            icon={
              <DotsThreeVertical
                size={22}
                color={tokens.color.text.normal}
                weight="bold"
              />
            }
            accessibilityLabel="More options"
            size="sm"
            onPress={onOpenActions}
          />
        ) : null}
      </View>
    </View>
  );
}
