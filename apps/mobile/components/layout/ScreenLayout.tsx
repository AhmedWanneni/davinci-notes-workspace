import React from "react";
import { View, Pressable, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CaretDown } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives/Text";

export interface ScreenLayoutProps {
  title?: string;
  onTitlePress?: () => void;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  edges?: Array<"top" | "bottom" | "left" | "right">;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  onTitlePress,
  headerLeft,
  headerRight,
  edges = ["top", "left", "right"],
  children,
  className = "",
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { tokens, isDark } = useTheme();

  const paddingTop = edges.includes("top") ? insets.top : 0;
  const paddingBottom = edges.includes("bottom") ? insets.bottom : 0;
  const paddingLeft = edges.includes("left") ? insets.left : 0;
  const paddingRight = edges.includes("right") ? insets.right : 0;

  const hasHeader = Boolean(title || headerLeft || headerRight);

  return (
    <View
      className={`flex-1 ${className}`}
      style={[
        {
          backgroundColor: tokens.color.bg.primary,
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight,
        },
        style,
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {hasHeader ? (
        <View
          className="h-[44px] flex-row items-center justify-between px-3 border-b"
          style={{
            backgroundColor: tokens.color.bg.primary,
            borderBottomColor: tokens.color.border.subtle,
          }}
        >
          <View className="min-w-[44px] items-start justify-center">
            {headerLeft}
          </View>
          <View className="flex-1 items-center justify-center px-2">
            {title ? (
              onTitlePress ? (
                <Pressable
                  onPress={onTitlePress}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch vault: ${title}`}
                  className="flex-row items-center gap-1 px-2 py-1 rounded active:bg-bg-hover"
                >
                  <Text variant="h3" numberOfLines={1}>
                    {title}
                  </Text>
                  <CaretDown size={14} color={tokens.color.text.muted} />
                </Pressable>
              ) : (
                <Text variant="h3" numberOfLines={1}>
                  {title}
                </Text>
              )
            ) : null}
          </View>
          <View className="min-w-[44px] items-end justify-center">
            {headerRight}
          </View>
        </View>
      ) : null}

      <View className="flex-1">{children}</View>
    </View>
  );
};

ScreenLayout.displayName = "ScreenLayout";
