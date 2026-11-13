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
  const isNote = mode === "note" || mode === "edit";

  return (
    <View
      className="h-[48px] flex-row items-center justify-between px-4"
      style={{
        backgroundColor: tokens.color.bg.primary,
      }}
    >
      {/* Left: Rounded icon box for sidebar / navigation */}
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

      {/* Middle: Clean space */}
      <View className="flex-1" />

      {/* Right: Search, Todos, Note/Text mode switcher, and 3-dots */}
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

        {onToggleMode ? (
          <View
            style={{
              flexDirection: "row",
              backgroundColor: tokens.color.bg.hover,
              borderRadius: 8,
              padding: 2,
              marginRight: 4,
            }}
          >
            <Pressable
              onPress={() => onToggleMode("note")}
              accessibilityRole="button"
              accessibilityLabel="Switch to note mode"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: isNote ? "#000000" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isNote ? "#ffffff" : tokens.color.text.muted,
                }}
              >
                Note
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onToggleMode("text")}
              accessibilityRole="button"
              accessibilityLabel="Switch to text mode"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: !isNote ? "#000000" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: !isNote ? "#ffffff" : tokens.color.text.muted,
                }}
              >
                Text
              </Text>
            </Pressable>
          </View>
        ) : null}

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
    </View>
  );
}
