import React from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  variant?: "normal" | "strong";
  className?: string;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  variant = "normal",
  className = "",
  style,
}) => {
  const { tokens } = useTheme();
  const isHorizontal = orientation === "horizontal";
  const dimensionClass = isHorizontal ? "w-full h-[1px]" : "h-full w-[1px]";
  const backgroundColor =
    variant === "strong"
      ? tokens.color.border.normal
      : tokens.color.border.subtle;

  return (
    <View
      className={`${dimensionClass} ${className}`}
      style={[{ backgroundColor }, style]}
    />
  );
};

Divider.displayName = "Divider";
