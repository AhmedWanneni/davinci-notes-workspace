import React, { useState, useMemo } from "react";
import { View, Pressable } from "react-native";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface CalendarMonthTableProps {
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  taskDates?: Set<string>;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarCell {
  day: number;
  monthOffset: number; // -1 = prev, 0 = current, 1 = next
  iso: string;
}

export function CalendarMonthTable({
  selectedDate,
  onSelectDate,
  taskDates,
}: CalendarMonthTableProps): React.ReactElement {
  const { tokens } = useTheme();

  // Current view date (year & month)
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate) {
      const parts = selectedDate.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const monthNameUpper = useMemo(() => {
    return viewDate
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
  }, [viewDate]);

  // Generate 7-column calendar matrix
  const matrix = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    // 1. Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const d = new Date(year, month - 1, day);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, monthOffset: -1, iso });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, monthOffset: 0, iso });
    }

    // 3. Next month leading days to complete full weeks
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, monthOffset: 1, iso });
    }

    return cells;
  }, [year, month]);

  const handleCellPress = (cell: CalendarCell) => {
    onSelectDate(cell.iso);
    if (cell.monthOffset !== 0) {
      setViewDate(new Date(year, month + cell.monthOffset, 1));
    }
  };

  return (
    <View className="px-4 pt-2 pb-3">
      {/* Month Navigation Header matching reference image: < NOV, 2022 > */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={prevMonth}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            className="p-1 active:opacity-60"
          >
            <CaretLeft size={18} color={tokens.color.text.normal} weight="bold" />
          </Pressable>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: tokens.color.text.normal,
              letterSpacing: 0.5,
            }}
          >
            {monthNameUpper}, {year}
          </Text>

          <Pressable
            onPress={nextMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            className="p-1 active:opacity-60"
          >
            <CaretRight size={18} color={tokens.color.text.normal} weight="bold" />
          </Pressable>
        </View>
      </View>

      {/* Days of Week Row: Sun Mon Tue Wed Thu Fri Sat */}
      <View className="flex-row items-center justify-between mb-2">
        {DAYS_OF_WEEK.map((dayName) => (
          <View key={dayName} className="flex-1 items-center justify-center">
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: tokens.color.text.muted,
              }}
            >
              {dayName}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid Table */}
      <View className="flex-row flex-wrap">
        {matrix.map((cell) => {
          const isSelected = selectedDate === cell.iso;
          const isCurrentMonth = cell.monthOffset === 0;
          const hasTask = Boolean(taskDates?.has(cell.iso));

          return (
            <View
              key={cell.iso}
              style={{ width: "14.285%" }}
              className="items-center justify-center py-1"
            >
              <Pressable
                onPress={() => handleCellPress(cell)}
                accessibilityRole="button"
                accessibilityLabel={`${cell.iso}${hasTask ? ", has tasks" : ""}`}
                className="w-9 h-9 rounded-full items-center justify-center active:opacity-75"
                style={{
                  backgroundColor: isSelected
                    ? tokens.color.interactive.accent
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected ? "700" : isCurrentMonth ? "500" : "400",
                    color: isSelected
                      ? tokens.color.text["on-accent"]
                      : isCurrentMonth
                        ? tokens.color.text.normal
                        : tokens.color.text.faint,
                  }}
                >
                  {cell.day}
                </Text>

                {/* Real task indicator dot (no mock data) */}
                {hasTask ? (
                  <View
                    className="w-1.5 h-1.5 rounded-full absolute"
                    style={{
                      bottom: 2,
                      backgroundColor: isSelected
                        ? tokens.color.text["on-accent"]
                        : tokens.color.interactive.accent,
                    }}
                  />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
