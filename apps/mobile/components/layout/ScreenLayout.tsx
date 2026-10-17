import React from "react";
import { View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "../primitives/Text";

export interface ScreenLayoutProps {
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  edges?: Array<"top" | "bottom" | "left" | "right">;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  headerLeft,
  headerRight,
  edges = ["top", "left", "right"],
  children,
  className = "",
  style,
}) => {
  const insets = useSafeAreaInsets();

  const paddingTop = edges.includes("top") ? insets.top : 0;
  const paddingBottom = edges.includes("bottom") ? insets.bottom : 0;
  const paddingLeft = edges.includes("left") ? insets.left : 0;
  const paddingRight = edges.includes("right") ? insets.right : 0;

  const hasHeader = Boolean(title || headerLeft || headerRight);

  return (
    <View
      className={`flex-1 bg-bg-primary ${className}`}
      style={[
        {
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight,
        },
        style,
      ]}
    >
      <StatusBar style="light" />

      {hasHeader && (
        <View className="h-[44px] flex-row items-center justify-between px-4 border-b border-border-subtle bg-bg-primary">
          <View className="w-[44px] items-start justify-center">
            {headerLeft}
          </View>
          <View className="flex-1 items-center justify-center">
            {title ? (
              <Text variant="h3" numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
          <View className="w-[44px] items-end justify-center">
            {headerRight}
          </View>
        </View>
      )}

      <View className="flex-1">{children}</View>
    </View>
  );
};

ScreenLayout.displayName = "ScreenLayout";
