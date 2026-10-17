import React from "react";
import { View, type ViewStyle } from "react-native";
import { Text } from "./Text";

export interface BadgeProps {
  variant?: "neutral" | "accent" | "success" | "warning" | "error";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

const VARIANT_CONTAINER: Record<string, string> = {
  neutral: "bg-bg-hover border-border-normal",
  accent: "bg-bg-status-accent border-border-status-accent",
  success: "bg-bg-status-success border-border-status-success",
  warning: "bg-bg-status-warning border-border-status-warning",
  error: "bg-bg-status-error border-border-status-error",
};

const VARIANT_TEXT: Record<
  string,
  "muted" | "accent" | "success" | "warning" | "error"
> = {
  neutral: "muted",
  accent: "accent",
  success: "success",
  warning: "warning",
  error: "error",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  icon,
  children,
  className = "",
  style,
}) => {
  const containerClasses = [
    "inline-flex flex-row items-center px-1.5 py-0.5 rounded-[4px] border self-start",
    VARIANT_CONTAINER[variant] || VARIANT_CONTAINER.neutral,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const textColor = VARIANT_TEXT[variant] || "muted";

  return (
    <View className={containerClasses} style={style}>
      {icon && <View className="mr-1 flex-shrink-0">{icon}</View>}
      {typeof children === "string" ? (
        <Text size="xs" weight="medium" color={textColor}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

Badge.displayName = "Badge";
