import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Text, Sheet } from "../components/primitives";
import type { OutlineHeading } from "./markdownAst";

export interface OutlineSheetProps {
  visible: boolean;
  onClose: () => void;
  outline: OutlineHeading[];
  onSelectHeading: (heading: OutlineHeading) => void;
}

export function OutlineSheet({
  visible,
  onClose,
  outline,
  onSelectHeading,
}: OutlineSheetProps): React.ReactElement {
  const getIndentClass = (level: number): string => {
    switch (level) {
      case 1:
        return "pl-2";
      case 2:
        return "pl-4";
      case 3:
        return "pl-6";
      case 4:
        return "pl-8";
      case 5:
        return "pl-10";
      default:
        return "pl-12";
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Outline">
      <ScrollView className="max-h-[60vh]" showsVerticalScrollIndicator={false}>
        {outline.length === 0 ? (
          <View className="py-6 items-center">
            <Text variant="body" color="muted">
              No headings found in this note.
            </Text>
          </View>
        ) : (
          outline.map((heading) => (
            <Pressable
              key={heading.id}
              onPress={() => {
                onSelectHeading(heading);
                onClose();
              }}
              className={`py-2.5 pr-3 min-h-[44px] border-b border-border-subtle/50 flex-row items-center ${getIndentClass(
                heading.level,
              )} active:bg-bg-hover`}
              accessibilityRole="button"
              accessibilityLabel={`Heading level ${heading.level}: ${heading.text}`}
            >
              <Text variant="caption" color="muted" className="w-8 font-mono">
                H{heading.level}
              </Text>
              <Text
                variant="body"
                weight={heading.level <= 2 ? "semibold" : "regular"}
                color="normal"
                className="flex-1"
                numberOfLines={1}
              >
                {heading.text}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}
