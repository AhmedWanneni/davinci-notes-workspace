import React from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { Text } from "./Text";
import { useTheme } from "../../theme";

export interface ListItemProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const ListItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ListItemProps
>(
  (
    {
      title,
      subtitle,
      left,
      right,
      onPress,
      onLongPress,
      selected = false,
      disabled = false,
      className = "",
      style,
      accessibilityLabel,
    },
    ref,
  ) => {
    const { tokens } = useTheme();

    const containerClasses = [
      "flex-row items-center justify-between min-h-[48px] px-4 py-3 border-b",
      disabled ? "opacity-50 pointer-events-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const dynamicStyle: ViewStyle = {
      borderBottomColor: tokens.color.border.subtle,
      backgroundColor: selected ? tokens.color.bg.hover : "transparent",
    };

    return (
      <Pressable
        ref={ref}
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={containerClasses}
        style={[dynamicStyle, style]}
      >
        <View className="flex-row items-center flex-1 mr-3">
          {left ? <View className="mr-3 flex-shrink-0">{left}</View> : null}
          <View className="flex-1 justify-center">
            {typeof title === "string" || typeof title === "number" ? (
              <Text
                variant="body"
                weight={selected ? "semibold" : "regular"}
                color="normal"
                numberOfLines={1}
              >
                {String(title)}
              </Text>
            ) : (
              title
            )}
            {subtitle ? (
              <View className="mt-0.5">
                {typeof subtitle === "string" ||
                typeof subtitle === "number" ? (
                  <Text variant="caption" color="muted" numberOfLines={1}>
                    {String(subtitle)}
                  </Text>
                ) : (
                  subtitle
                )}
              </View>
            ) : null}
          </View>
        </View>

        {right ? (
          <View className="flex-shrink-0 items-center justify-center">
            {right}
          </View>
        ) : null}
      </Pressable>
    );
  },
);

ListItem.displayName = "ListItem";
