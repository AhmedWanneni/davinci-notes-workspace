import React from "react";
import { View, Pressable } from "react-native";
import {
  Check,
  Drop,
  Bicycle,
  Barbell,
  Footprints,
  BookOpen,
  Clock,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileTodoItem } from "./types";

export interface TodoItemCardProps {
  item: MobileTodoItem;
  onToggle: (item: MobileTodoItem) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function TodoItemCard({
  item,
  onToggle,
  isFirst = false,
  isLast = false,
}: TodoItemCardProps): React.ReactElement {
  const { tokens } = useTheme();

  const getIconConfig = () => {
    switch (item.iconName) {
      case "water":
        return { bg: "#fcecdb", color: "#d97736", Icon: Drop };
      case "bicycle":
        return { bg: "#e5f4d8", color: "#5b9e32", Icon: Bicycle };
      case "stretch":
        return { bg: "#f6e4f7", color: "#a854ad", Icon: Barbell };
      case "walk":
        return { bg: "#feeed8", color: "#c98232", Icon: Footprints };
      case "book":
        return { bg: "#e2ecf9", color: "#3b7dd8", Icon: BookOpen };
      default:
        return { bg: "#f0f0f0", color: "#555555", Icon: Check };
    }
  };

  const { bg, color, Icon } = getIconConfig();

  return (
    <View className="flex-row items-center px-6 py-2.5">
      {/* Timeline Checkbox column */}
      <View className="items-center mr-4" style={{ width: 28 }}>
        {/* Top connector line */}
        <View
          style={{
            width: 1,
            height: 18,
            borderStyle: "dashed",
            borderLeftWidth: 1,
            borderColor: isFirst ? "transparent" : "#d8d8d8",
          }}
        />

        {/* Check Circle */}
        <Pressable
          onPress={() => onToggle(item)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          accessibilityLabel={`Mark ${item.text} as ${item.completed ? "incomplete" : "complete"}`}
          className="items-center justify-center active:scale-95"
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: item.completed ? "#d97736" : "#ffffff",
            borderWidth: item.completed ? 0 : 1.5,
            borderColor: item.completed ? "#d97736" : "#b0b0b0",
          }}
        >
          {item.completed ? <Check size={14} color="#ffffff" weight="bold" /> : null}
        </Pressable>

        {/* Bottom connector line */}
        <View
          style={{
            width: 1,
            height: 18,
            borderStyle: "dashed",
            borderLeftWidth: 1,
            borderColor: isLast ? "transparent" : "#d8d8d8",
          }}
        />
      </View>

      {/* Item Card */}
      <Pressable
        onPress={() => onToggle(item)}
        className="flex-1 flex-row items-center justify-between p-3.5 rounded-2xl active:opacity-90"
        style={{
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: tokens.color.border.subtle,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View className="flex-row items-center flex-1 mr-2">
          {/* Leading Icon in soft square */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: bg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Icon size={22} color={color} weight="regular" />
          </View>

          {/* Title & Streak / Subtitle */}
          <View className="flex-1">
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: item.completed ? tokens.color.text.muted : tokens.color.text.normal,
                textDecorationLine: item.completed ? "line-through" : "none",
              }}
            >
              {item.text}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: tokens.color.text.muted,
                marginTop: 2,
              }}
            >
              {item.reminder ? item.reminder : `Streak ${item.streakDays ?? 3} days`}
            </Text>
          </View>
        </View>

        {/* Right side: Duration with clock */}
        <View className="flex-row items-center pl-3 border-l border-border-subtle">
          <View className="items-center">
            <Clock size={16} color={tokens.color.text.muted} weight="regular" />
            <Text
              style={{
                fontSize: 10,
                color: tokens.color.text.muted,
                marginTop: 2,
                fontWeight: "500",
              }}
            >
              {item.duration ?? "5 min"}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
