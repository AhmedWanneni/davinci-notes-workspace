import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { CaretDown, CaretRight, Tag as TagIcon } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Badge, Text } from "../components/primitives";

export interface PropertiesBlockProps {
  properties?: Record<string, unknown>;
  onTagPress?: (tag: string) => void;
}

export function PropertiesBlock({
  properties,
  onTagPress,
}: PropertiesBlockProps): React.ReactElement | null {
  const [collapsed, setCollapsed] = useState(false);

  if (!properties || Object.keys(properties).length === 0) {
    return null;
  }

  const entries = Object.entries(properties);

  return (
    <View className="mb-6 rounded-md border border-border-normal bg-bg-secondary overflow-hidden">
      {/* Header */}
      <Pressable
        onPress={() => setCollapsed(!collapsed)}
        className="flex-row items-center justify-between px-3 py-2 min-h-[44px] bg-bg-primary-alt border-b border-border-subtle"
        accessibilityRole="button"
        accessibilityLabel="Toggle properties"
      >
        <Text variant="caption" weight="medium" color="muted">
          PROPERTIES ({entries.length})
        </Text>
        {collapsed ? (
          <CaretRight size={14} color={darkColorTokens.text.muted} />
        ) : (
          <CaretDown size={14} color={darkColorTokens.text.muted} />
        )}
      </Pressable>

      {/* Content */}
      {!collapsed ? (
        <View className="p-3 gap-2">
          {entries.map(([key, value]) => {
            if (key === "tags" && Array.isArray(value)) {
              return (
                <View
                  key={key}
                  className="flex-row items-center flex-wrap gap-1.5 py-1"
                >
                  <View className="flex-row items-center gap-1 mr-2">
                    <TagIcon size={14} color={darkColorTokens.text.muted} />
                    <Text variant="caption" color="muted">
                      {key}:
                    </Text>
                  </View>
                  {value.map((t, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => onTagPress?.(String(t))}
                      accessibilityRole="button"
                    >
                      <Badge variant="accent">
                        #{String(t).replace(/^#/, "")}
                      </Badge>
                    </Pressable>
                  ))}
                </View>
              );
            }

            const stringVal =
              typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value ?? "");

            return (
              <View
                key={key}
                className="flex-row items-start justify-between py-1 border-b border-border-subtle/40"
              >
                <Text variant="caption" color="muted" className="w-1/3">
                  {key}
                </Text>
                <Text
                  variant="body"
                  color="normal"
                  className="flex-1 text-right"
                >
                  {stringVal}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
