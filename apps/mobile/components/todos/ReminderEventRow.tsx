import React from "react";
import { View, Pressable } from "react-native";
import { Timer, CheckCircle, Clock } from "phosphor-react-native";
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
  const isDone = item.status === "completed" || item.status === "early";
  const isLate = item.status === "late";

  return (
    <Pressable
      onPress={() => (onPress ? onPress(item) : onToggle(item))}
      onLongPress={() => onDelete && onDelete(item)}
      className="flex-row items-center py-3.5 px-4 active:bg-black/5"
      style={{ gap: 14 }}
    >
      {/* Circular icon container matching reference design */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: 44,
          height: 44,
          backgroundColor: isDone ? "#dcfce7" : "#eff6ff",
        }}
      >
        <Timer size={20} color={isDone ? "#16a34a" : "#2563eb"} weight="bold" />
      </View>

      {/* Left Text Block */}
      <View className="flex-1">
        <Text
          numberOfLines={1}
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: isDone ? "#9ca3af" : "#111827",
            textDecorationLine: isDone ? "line-through" : "none",
          }}
        >
          {item.title}
        </Text>
        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
          {item.dateTime}
        </Text>
      </View>

      {/* Right Column: Project/Event name & Status pill */}
      <View className="items-end" style={{ gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
          {item.project || "Events"}
        </Text>

        <View
          className="flex-row items-center px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: isDone ? "#dcfce7" : isLate ? "#ffedd5" : "#f3f4f6",
            gap: 4,
          }}
        >
          {isDone ? (
            <CheckCircle size={12} color="#16a34a" weight="fill" />
          ) : (
            <Clock size={12} color={isLate ? "#ea580c" : "#6b7280"} weight="fill" />
          )}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: isDone ? "#15803d" : isLate ? "#c2410c" : "#4b5563",
            }}
          >
            {isDone ? "Done" : isLate ? "Late" : "Upcoming"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
