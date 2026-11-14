import React from "react";
import { View, Pressable } from "react-native";
import { SidebarSimple, Calendar } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface TodosHeaderTabsProps {
  title?: string;
  activeTab?: "reminders" | "todos";
  onSelectTab?: (tab: "reminders" | "todos") => void;
  onOpenSidebar: () => void;
  displayMode?: "list" | "grid";
  onChangeDisplayMode?: (mode: "list" | "grid") => void;
  isCalendarVisible?: boolean;
  onToggleCalendar?: () => void;
}

export function TodosHeaderTabs({
  title = "Todos",
  onOpenSidebar,
  isCalendarVisible = false,
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
        {title}
      </Text>

      {/* Right: Calendar toggle button (no list icon) */}
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
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>
    </View>
  );
}
