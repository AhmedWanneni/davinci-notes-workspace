import React from "react";
import { View, Pressable } from "react-native";
import { Check, DotsThree, Trash } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileTodoItem } from "./types";

export interface TodoCardGridItemProps {
  item: MobileTodoItem;
  onToggle: (item: MobileTodoItem) => void;
  onDelete?: (item: MobileTodoItem) => void;
  onOpenNote?: (path: string) => void;
}

export function TodoCardGridItem({
  item,
  onToggle,
  onDelete,
  onOpenNote,
}: TodoCardGridItemProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <Pressable
      onPress={() => item.notePath && onOpenNote?.(item.notePath)}
      accessibilityRole="button"
      accessibilityLabel={`Open note for task ${item.text}`}
      className="flex-1 m-1.5 p-3.5 rounded-2xl active:opacity-80"
      style={{
        backgroundColor: tokens.color.bg.primary,
        minHeight: 180,
      }}
    >
      {/* Top Header: Title & Action */}
      <View className="flex-row items-center justify-between mb-0.5">
        <Text
          variant="body"
          weight="bold"
          numberOfLines={1}
          style={{
            fontSize: 15,
            color: item.completed
              ? tokens.color.text.muted
              : tokens.color.text.normal,
            textDecorationLine: item.completed ? "line-through" : "none",
            flex: 1,
          }}
        >
          {item.text}
        </Text>
        {onDelete ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete(item);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Delete task ${item.text}`}
            className="p-1 -mr-1 active:opacity-60"
          >
            <Trash size={16} color={tokens.color.text.muted} />
          </Pressable>
        ) : (
          <DotsThree size={18} color={tokens.color.text.muted} weight="bold" />
        )}
      </View>

      {/* Date / Reminder */}
      <Text
        variant="caption"
        style={{
          fontSize: 12,
          color: tokens.color.text.muted,
          marginBottom: 12,
        }}
      >
        {item.dueDate || item.reminder || item.section || "Task"}
      </Text>

      {/* Card Body: Miniature Document Sheet */}
      <View
        className="flex-1 rounded-xl p-3 justify-center"
        style={{ backgroundColor: tokens.color.bg.secondary }}
      >
        <View
          className="w-full bg-white rounded-lg p-2.5"
          style={{ minHeight: 85 }}
        >
          {/* Top miniature header with check indicator */}
          <View className="flex-row items-center justify-between mb-2">
            <View
              className="h-1.5 rounded-full"
              style={{
                width: "40%",
                backgroundColor: tokens.color.text.muted,
                opacity: 0.5,
              }}
            />
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onToggle(item);
              }}
              className="w-4 h-4 rounded-full items-center justify-center"
              style={{
                backgroundColor: item.completed
                  ? tokens.color.interactive.accent
                  : tokens.color.bg.secondary,
              }}
            >
              {item.completed ? (
                <Check
                  size={10}
                  color={tokens.color.text["on-accent"]}
                  weight="bold"
                />
              ) : null}
            </Pressable>
          </View>

          {/* Miniature body task lines */}
          <Text
            numberOfLines={2}
            style={{
              fontSize: 10,
              lineHeight: 14,
              color: item.completed
                ? tokens.color.text.faint
                : tokens.color.text.normal,
            }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
