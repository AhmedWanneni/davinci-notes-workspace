import React from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";
import { Text } from "./Text";

export interface BadgeProps {
  variant?: "neutral" | "accent" | "success" | "warning" | "error";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

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
  const { tokens } = useTheme();

  const containerClasses = [
    "inline-flex flex-row items-center px-1.5 py-0.5 rounded-[4px] border self-start",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dynamicStyles: ViewStyle = {
    backgroundColor:
      variant === "accent"
        ? tokens.color.bg["status-accent"]
        : variant === "success"
          ? tokens.color.bg["status-success"]
          : variant === "warning"
            ? tokens.color.bg["status-warning"]
            : variant === "error"
              ? tokens.color.bg["status-error"]
              : tokens.color.bg.hover,
    borderColor:
      variant === "accent"
        ? tokens.color.border["status-accent"]
        : variant === "success"
          ? tokens.color.border["status-success"]
          : variant === "warning"
            ? tokens.color.border["status-warning"]
            : variant === "error"
              ? tokens.color.border["status-error"]
              : tokens.color.border.normal,
  };

  const textColor = VARIANT_TEXT[variant] || "muted";

  return (
    <View className={containerClasses} style={[dynamicStyles, style]}>
      {icon ? <View className="mr-1 flex-shrink-0">{icon}</View> : null}
      {React.isValidElement(children) ? (
        children
      ) : (
        <Text size="xs" weight="medium" color={textColor}>
          {children}
        </Text>
      )}
    </View>
  );
};

Badge.displayName = "Badge";
