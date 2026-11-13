import React from "react";
import { View, Pressable } from "react-native";
import {
  SidebarSimple,
  DotsThreeVertical,
  NotePencil,
  CheckSquare,
  MagnifyingGlass,
} from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./primitives";

export interface NewTabPageProps {
  onOpenSidebar: () => void;
  onOpenActions?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
  onOpenTodos?: () => void;
  onNewNote: () => void;
  onNewTodoList: () => void;
}

export function NewTabPage({
  onOpenSidebar,
  onOpenActions,
  onOpenSettings,
  onOpenSearch,
  onOpenTodos,
  onNewNote,
  onNewTodoList,
}: NewTabPageProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="flex-1 justify-between" style={{ backgroundColor: tokens.color.bg.primary }}>
      {/* Top Header: Sidebar on left, Search & Todos & More on right */}
      <View
        className="h-[48px] flex-row items-center justify-between px-4"
        style={{ backgroundColor: tokens.color.bg.primary }}
      >
        <Pressable
          onPress={onOpenSidebar}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar navigation"
          className="w-9 h-9 rounded-lg items-center justify-center active:bg-bg-hover"
        >
          <SidebarSimple size={20} color={tokens.color.text.normal} weight="regular" />
        </Pressable>

        <Text variant="text" weight="semibold" color="normal" style={{ fontSize: 16 }}>
          New tab
        </Text>

        <View className="flex-row items-center gap-1">
          {onOpenSearch ? (
            <Pressable
              onPress={onOpenSearch}
              accessibilityRole="button"
              accessibilityLabel="Search"
              className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
            >
              <MagnifyingGlass size={20} color={tokens.color.text.normal} weight="regular" />
            </Pressable>
          ) : null}

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

          <Pressable
            onPress={onOpenSettings ?? onOpenActions}
            accessibilityRole="button"
            accessibilityLabel="More options"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <DotsThreeVertical size={22} color={tokens.color.text.normal} weight="bold" />
          </Pressable>
        </View>
      </View>

      {/* Middle Content: Centered pill buttons matching Image 1 */}
      <View className="flex-1 items-center justify-center px-6 gap-3.5">
        {/* 1. New note button */}
        <Pressable
          onPress={onNewNote}
          accessibilityRole="button"
          accessibilityLabel="New note"
          className="active:opacity-70 active:scale-98"
          style={{
            width: 200,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 9999,
            backgroundColor: tokens.color.bg.secondary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <NotePencil size={20} color={tokens.color.text.normal} weight="regular" />
          <Text variant="body" weight="medium" color="normal" style={{ fontSize: 15 }}>
            New note
          </Text>
        </Pressable>

        {/* 2. New todo list button */}
        <Pressable
          onPress={onNewTodoList}
          accessibilityRole="button"
          accessibilityLabel="New todo list"
          className="active:opacity-70 active:scale-98"
          style={{
            width: 200,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 9999,
            backgroundColor: tokens.color.bg.secondary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <CheckSquare size={20} color={tokens.color.text.normal} weight="regular" />
          <Text variant="body" weight="medium" color="normal" style={{ fontSize: 15 }}>
            New todo list
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
