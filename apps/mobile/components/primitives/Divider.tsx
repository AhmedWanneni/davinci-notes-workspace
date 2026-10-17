import React from "react";
import { View, type ViewStyle } from "react-native";

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
  const isHorizontal = orientation === "horizontal";
  const borderClass =
    variant === "strong" ? "bg-border-normal" : "bg-border-subtle";

  const dimensionClass = isHorizontal ? "w-full h-[1px]" : "h-full w-[1px]";

  return (
    <View
      className={`${dimensionClass} ${borderClass} ${className}`}
      style={style}
    />
  );
};

Divider.displayName = "Divider";
