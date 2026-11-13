import React from "react";
import { View, Pressable } from "react-native";
import {
  SidebarSimple,
  Calendar,
  SquaresFour,
  List as ListIcon,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface TodosHeaderTabsProps {
  activeTab?: "reminders" | "todos";
  onSelectTab?: (tab: "reminders" | "todos") => void;
  onOpenSidebar: () => void;
  displayMode?: "list" | "grid";
  onChangeDisplayMode?: (mode: "list" | "grid") => void;
  isCalendarVisible?: boolean;
  onToggleCalendar?: () => void;
}

export function TodosHeaderTabs({
  activeTab: _activeTab,
  onSelectTab: _onSelectTab,
  onOpenSidebar,
  displayMode = "grid",
  onChangeDisplayMode,
  isCalendarVisible = true,
  onToggleCalendar,
}: TodosHeaderTabsProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="flex-row items-center justify-between px-4 py-2.5">
      {/* Left: Sidebar Icon */}
      <Pressable
        onPress={onOpenSidebar}
        accessibilityRole="button"
        accessibilityLabel="Open sidebar"
        className="w-9 h-9 items-center justify-center -ml-1 rounded-lg active:opacity-60"
      >
        <SidebarSimple size={22} color={tokens.color.text.normal} weight="regular" />
      </Pressable>

      {/* Center: Title */}
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: tokens.color.text.normal,
        }}
      >
        Calendar & Todos
      </Text>

      {/* Right: Simple top icons for Calendar, Grid View, and List/Tree View */}
      <View className="flex-row items-center gap-1.5">
        {onToggleCalendar ? (
          <Pressable
            onPress={onToggleCalendar}
            accessibilityRole="button"
            accessibilityLabel="Toggle calendar table"
            className="w-9 h-9 items-center justify-center rounded-lg active:opacity-60"
            style={{
              backgroundColor: isCalendarVisible
                ? tokens.color.bg.secondary
                : "transparent",
            }}
          >
            <Calendar
              size={20}
              color={
                isCalendarVisible
                  ? tokens.color.interactive.accent
                  : tokens.color.text.muted
              }
              weight={isCalendarVisible ? "fill" : "regular"}
            />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => onChangeDisplayMode?.("grid")}
          accessibilityRole="button"
          accessibilityLabel="Grid view"
          className="w-9 h-9 items-center justify-center rounded-lg active:opacity-60"
          style={{
            backgroundColor:
              displayMode === "grid"
                ? tokens.color.bg.secondary
                : "transparent",
          }}
        >
          <SquaresFour
            size={20}
            color={
              displayMode === "grid"
                ? tokens.color.interactive.accent
                : tokens.color.text.muted
            }
            weight={displayMode === "grid" ? "fill" : "regular"}
          />
        </Pressable>

        <Pressable
          onPress={() => onChangeDisplayMode?.("list")}
          accessibilityRole="button"
          accessibilityLabel="List view"
          className="w-9 h-9 items-center justify-center rounded-lg active:opacity-60"
          style={{
            backgroundColor:
              displayMode === "list"
                ? tokens.color.bg.secondary
                : "transparent",
          }}
        >
          <ListIcon
            size={20}
            color={
              displayMode === "list"
                ? tokens.color.interactive.accent
                : tokens.color.text.muted
            }
            weight={displayMode === "list" ? "bold" : "regular"}
          />
        </Pressable>
      </View>
    </View>
  );
}
