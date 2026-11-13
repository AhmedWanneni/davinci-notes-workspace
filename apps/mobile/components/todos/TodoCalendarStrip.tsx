import React, { useMemo } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { WeeklyCalendarDay } from "./types";

export interface TodoCalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function TodoCalendarStrip({
  selectedDate,
  onSelectDate,
}: TodoCalendarStripProps): React.ReactElement {
  const { tokens } = useTheme();

  const days: WeeklyCalendarDay[] = useMemo(() => {
    const list: WeeklyCalendarDay[] = [];
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
    // Calculate Monday of current week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedStr = selectedDate.toISOString().slice(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateString = d.toISOString().slice(0, 10);

      list.push({
        dayName: dayLabels[i],
        dayNumber: d.getDate(),
        dateString,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedStr,
      });
    }
    return list;
  }, [selectedDate]);

  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        {days.map((item) => {
          const isSelected = item.isSelected;
          return (
            <Pressable
              key={item.dateString}
              onPress={() => onSelectDate(new Date(item.dateString))}
              accessibilityRole="button"
              accessibilityLabel={`${item.dayName} ${item.dayNumber}`}
              className="items-center"
              style={{ minWidth: 42 }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? "700" : "500",
                  color: isSelected ? tokens.color.text.normal : tokens.color.text.muted,
                  marginBottom: 6,
                }}
              >
                {item.dayName}
              </Text>

              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected ? tokens.color.text.normal : "#ffffff",
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: tokens.color.border.subtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? tokens.color.bg.primary : tokens.color.text.normal,
                  }}
                >
                  {item.dayNumber}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
