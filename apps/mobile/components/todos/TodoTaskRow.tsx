import React from "react";
import { View, Pressable } from "react-native";
import { Check, Trash } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileTodoItem } from "./types";

export interface TodoTaskRowProps {
  item: MobileTodoItem;
  onToggle: (item: MobileTodoItem) => void;
  onDelete?: (item: MobileTodoItem) => void;
  onOpenNote?: (notePath: string) => void;
}

export function TodoTaskRow({
  item,
  onToggle,
  onDelete,
  onOpenNote,
}: TodoTaskRowProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <Pressable
      onPress={() => {
        if (item.notePath && onOpenNote) onOpenNote(item.notePath);
      }}
      className="px-4 py-3 border-b flex-row items-center justify-between active:opacity-75"
      style={{
        backgroundColor: tokens.color.bg.primary,
        borderBottomColor: tokens.color.border.subtle,
      }}
    >
      {/* Checkbox */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onToggle(item);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        className="w-6 h-6 rounded-full items-center justify-center mr-3"
        style={{
          borderWidth: item.completed ? 0 : 2,
          borderColor: item.completed
            ? "transparent"
            : tokens.color.border.normal,
          backgroundColor: item.completed
            ? tokens.color.interactive.accent
            : "transparent",
        }}
      >
        {item.completed ? (
          <Check
            size={14}
            color={tokens.color.text["on-accent"]}
            weight="bold"
          />
        ) : null}
      </Pressable>

      {/* Task Content */}
      <View className="flex-1 mr-3">
        <Text
          style={{
            fontSize: 15,
            fontWeight: item.completed ? "400" : "500",
            color: item.completed
              ? tokens.color.text.muted
              : tokens.color.text.normal,
            textDecorationLine: item.completed ? "line-through" : "none",
          }}
        >
          {item.text}
        </Text>
      </View>

      {/* Trailing Trash Icon to remove task */}
      {onDelete ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onDelete(item);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Delete task ${item.text}`}
          className="p-1.5 items-center justify-center active:opacity-60"
        >
          <Trash size={17} color={tokens.color.text.muted} weight="regular" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
