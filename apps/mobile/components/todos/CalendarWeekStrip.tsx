import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface CalendarWeekStripProps {
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}

const toIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CalendarWeekStrip({
  selectedDate,
  onSelectDate,
}: CalendarWeekStripProps): React.ReactElement {
  const { tokens } = useTheme();

  const weekDays = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(
      now.getDate() + (now.getDay() === 0 ? -6 : 1 - now.getDay()),
    );
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { name, dayNum: d.getDate(), iso: toIso(d) };
    });
  }, []);

  return (
    <View
      className="flex-row items-center justify-between px-4 pt-2 pb-3"
      accessibilityRole="tablist"
    >
      {weekDays.map((day) => {
        const isSel = selectedDate === day.iso;
        return (
          <Pressable
            key={day.iso}
            onPress={() => onSelectDate(day.iso)}
            className="items-center w-11"
            accessibilityRole="tab"
            accessibilityState={{ selected: isSel }}
            accessibilityLabel={`${day.name} ${day.dayNum}`}
          >
            <Text
              className="text-[13px] mb-2"
              style={{
                fontWeight: isSel ? "700" : "400",
                color: isSel
                  ? tokens.color.text.normal
                  : tokens.color.text.muted,
              }}
            >
              {day.name}
            </Text>
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{
                backgroundColor: isSel
                  ? tokens.color.interactive.accent
                  : tokens.color.bg.primary,
                borderWidth: isSel ? 0 : 1,
                borderColor: tokens.color.border.subtle,
              }}
            >
              <Text
                className="text-base"
                style={{
                  fontWeight: isSel ? "700" : "500",
                  color: isSel
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.normal,
                }}
              >
                {day.dayNum}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
