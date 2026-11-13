import React from "react";
import { View, Pressable } from "react-native";
import { Timer, CheckCircle, Clock } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileReminderEvent } from "./types";

export interface ReminderEventRowProps {
  item: MobileReminderEvent;
  onToggle: (item: MobileReminderEvent) => void;
  onDelete?: (item: MobileReminderEvent) => void;
  onPress?: (item: MobileReminderEvent) => void;
}

export function ReminderEventRow({
  item,
  onToggle,
  onDelete,
  onPress,
}: ReminderEventRowProps): React.ReactElement {
  const { tokens } = useTheme();
  const isDone = item.status === "completed" || item.status === "early";
  const isLate = item.status === "late";

  const timerBg = isDone
    ? tokens.color.bg["status-success"]
    : tokens.color.bg["status-accent"];
  const timerColor = isDone
    ? tokens.color.text.success
    : tokens.color.interactive.accent;

  const pillBg = isDone
    ? tokens.color.bg["status-success"]
    : isLate
      ? tokens.color.bg["status-warning"]
      : tokens.color.bg.secondary;

  const pillTextColor = isDone
    ? tokens.color.text.success
    : isLate
      ? tokens.color.text.warning
      : tokens.color.text.muted;

  return (
    <Pressable
      onPress={() => (onPress ? onPress(item) : onToggle(item))}
      onLongPress={() => onDelete && onDelete(item)}
      className="flex-row items-center py-3.5 px-4 active:bg-black/5"
      style={{ gap: 12 }}
    >
      {/* Circular icon container matching reference design (tap to toggle) */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onToggle(item);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
        className="w-11 h-11 items-center justify-center rounded-full active:opacity-75"
        style={{ backgroundColor: timerBg }}
      >
        <Timer size={20} color={timerColor} weight="bold" />
      </Pressable>

      {/* Left Text Block */}
      <View className="flex-1">
        <Text
          numberOfLines={1}
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: isDone ? tokens.color.text.faint : tokens.color.text.normal,
            textDecorationLine: isDone ? "line-through" : "none",
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: tokens.color.text.muted,
            marginTop: 4,
          }}
        >
          {item.dateTime}
        </Text>
      </View>

      {/* Right Column: Project/Event name & Status pill */}
      <View className="items-end" style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.color.text.normal,
          }}
        >
          {item.project || "Events"}
        </Text>

        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: pillBg,
            gap: 4,
          }}
        >
          {isDone ? (
            <CheckCircle
              size={12}
              color={tokens.color.text.success}
              weight="fill"
            />
          ) : (
            <Clock
              size={12}
              color={
                isLate ? tokens.color.text.warning : tokens.color.text.muted
              }
              weight="fill"
            />
          )}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: pillTextColor,
            }}
          >
            {isDone ? "Done" : isLate ? "Late" : "Upcoming"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
