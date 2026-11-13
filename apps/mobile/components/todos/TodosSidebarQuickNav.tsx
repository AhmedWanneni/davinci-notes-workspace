import React from "react";
import { View, Pressable } from "react-native";
import { Calendar, SquaresFour } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface TodosSidebarQuickNavProps {
  onSelectReminders?: () => void;
  onToggleGridMode?: () => void;
}

export function TodosSidebarQuickNav({
  onSelectReminders,
  onToggleGridMode,
}: TodosSidebarQuickNavProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="px-3 pt-2 pb-1 gap-1.5">
      <Pressable
        onPress={onSelectReminders}
        accessibilityRole="button"
        accessibilityLabel="Open Calendar and Reminders"
        className="flex-row items-center gap-2.5 px-3 py-2 rounded-xl active:bg-bg-hover"
        style={{ backgroundColor: tokens.color.bg.secondary }}
      >
        <Calendar
          size={18}
          color={tokens.color.interactive.accent}
          weight="bold"
        />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.color.text.normal,
          }}
        >
          Calendar & Reminders
        </Text>
      </Pressable>

      <Pressable
        onPress={onToggleGridMode}
        accessibilityRole="button"
        accessibilityLabel="Toggle 2-column card grid view"
        className="flex-row items-center gap-2.5 px-3 py-2 rounded-xl active:bg-bg-hover"
        style={{ backgroundColor: tokens.color.bg.secondary }}
      >
        <SquaresFour
          size={18}
          color={tokens.color.interactive.accent}
          weight="bold"
        />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.color.text.normal,
          }}
        >
          2-Column Card Grid View
        </Text>
      </Pressable>
    </View>
  );
}
