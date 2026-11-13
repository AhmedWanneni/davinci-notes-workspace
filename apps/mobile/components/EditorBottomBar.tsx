import React from "react";
import { View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SquaresFour,
  Plus,
  MagnifyingGlass,
  Bell,
  List,
} from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./primitives";

export interface EditorBottomBarProps {
  onTodo?: () => void;
  onNewNote: () => void;
  onSearch: () => void;
  onNotifications?: () => void;
  onTabs?: () => void;
  onMenu: () => void;
  tabCount?: number;
  onBack?: () => void;
  onForward?: () => void;
  activeScreen?: "todo" | "notifications" | "search" | "tabs" | "menu" | "editor";
}

export function EditorBottomBar({
  onTodo,
  onNewNote,
  onSearch,
  onNotifications,
  onTabs,
  onMenu,
  tabCount = 1,
  onBack,
  activeScreen,
}: EditorBottomBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const bottomPadding = Platform.OS === "android" ? 0 : insets.bottom;

  const handleTodo = onTodo ?? onBack ?? (() => {});
  const handleNotifications = onNotifications ?? (() => {});

  return (
    <View
      className="flex-row items-center justify-around px-2"
      style={{
        height: 50 + bottomPadding,
        paddingBottom: bottomPadding,
        backgroundColor: tokens.color.bg.primary,
      }}
    >
      {/* 1. Todo */}
      <Pressable
        onPress={handleTodo}
        accessibilityRole="button"
        accessibilityLabel="Todos & Projects"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <SquaresFour
          size={22}
          color={
            activeScreen === "todo"
              ? tokens.color.interactive.accent
              : tokens.color.text.normal
          }
          weight={activeScreen === "todo" ? "fill" : "regular"}
        />
      </Pressable>

      {/* 2. New Note (+) */}
      <Pressable
        onPress={onNewNote}
        accessibilityRole="button"
        accessibilityLabel="Create new note"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <Plus size={22} color={tokens.color.text.normal} weight="regular" />
      </Pressable>

      {/* 3. Search */}
      <Pressable
        onPress={onSearch}
        accessibilityRole="button"
        accessibilityLabel="Search notes"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <MagnifyingGlass
          size={22}
          color={tokens.color.text.normal}
          weight="regular"
        />
      </Pressable>

      {/* 4. Notifications (reminders) */}
      <Pressable
        onPress={handleNotifications}
        accessibilityRole="button"
        accessibilityLabel="Reminders and notifications"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <Bell
          size={22}
          color={
            activeScreen === "notifications"
              ? tokens.color.interactive.accent
              : tokens.color.text.normal
          }
          weight={activeScreen === "notifications" ? "fill" : "regular"}
        />
      </Pressable>

      {/* 5. Tabs switcher [ 1 ] */}
      <Pressable
        onPress={onTabs}
        accessibilityRole="button"
        accessibilityLabel={`Open notes (${tabCount})`}
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: tokens.color.bg.secondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: tokens.color.text.normal,
              lineHeight: 13,
            }}
          >
            {tabCount}
          </Text>
        </View>
      </Pressable>

      {/* 6. Settings (Menu) */}
      <Pressable
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <List size={22} color={tokens.color.text.normal} weight="regular" />
      </Pressable>
    </View>
  );
}
