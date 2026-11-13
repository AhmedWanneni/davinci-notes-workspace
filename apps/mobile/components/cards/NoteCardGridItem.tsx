import React from "react";
import { View, Pressable } from "react-native";
import { DotsThree } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface NoteCardGridItemProps {
  title: string;
  dateStr: string;
  snippet?: string;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export function NoteCardGridItem({
  title,
  dateStr,
  snippet,
  onPress,
  onOptionsPress,
}: NoteCardGridItemProps): React.ReactElement {
  const { tokens } = useTheme();
  const previewLines = snippet
    ? snippet
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 4)
    : ["- Document notes", "- Quick thoughts", "- Details & checklist"];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open note ${title}`}
      className="flex-1 m-1.5 p-3.5 rounded-2xl active:opacity-80"
      style={{
        backgroundColor: tokens.color.bg.primary,
        minHeight: 180,
      }}
    >
      {/* Top Header: Title & More Options */}
      <View className="flex-row items-center justify-between mb-0.5">
        <Text
          variant="body"
          weight="bold"
          numberOfLines={1}
          style={{ fontSize: 16, color: tokens.color.text.normal, flex: 1 }}
        >
          {title}
        </Text>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onOptionsPress?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Options"
          className="p-1 -mr-1 active:opacity-60"
        >
          <DotsThree size={18} color={tokens.color.text.muted} weight="bold" />
        </Pressable>
      </View>

      {/* Date */}
      <Text
        variant="caption"
        style={{
          fontSize: 12,
          color: tokens.color.text.muted,
          marginBottom: 12,
        }}
      >
        {dateStr}
      </Text>

      {/* Card Body: Realistic Document Sheet Preview */}
      <View
        className="flex-1 rounded-xl p-3 justify-center"
        style={{
          backgroundColor: tokens.color.bg.secondary,
        }}
      >
        <View
          className="w-full bg-white rounded-lg p-2.5"
          style={{ minHeight: 85 }}
        >
          {/* Miniature header line */}
          <View
            className="h-1.5 rounded-full mb-2"
            style={{
              width: "45%",
              backgroundColor: tokens.color.text.muted,
              opacity: 0.5,
            }}
          />

          {/* Miniature body lines */}
          {previewLines.map((line, idx) => (
            <Text
              key={idx}
              numberOfLines={1}
              style={{
                fontSize: 9,
                lineHeight: 13,
                color: tokens.color.text.muted,
                opacity: 0.75,
              }}
            >
              {line.replace(/^[-*]\s*\[[ x]\]\s*/i, "")}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}
