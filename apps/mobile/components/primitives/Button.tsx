import React from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { mobileTokens } from "@app/design-tokens/mobile";
import { Text } from "./Text";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const VARIANT_CONTAINER: Record<string, string> = {
  primary: "bg-interactive-accent border-transparent active:opacity-80",
  secondary: "bg-transparent border-border-normal active:bg-bg-hover",
  ghost: "bg-transparent border-transparent active:bg-bg-hover",
  danger: "bg-transparent border-border-normal active:bg-bg-hover",
};

const VARIANT_TEXT_COLOR: Record<string, "on-accent" | "normal" | "error"> = {
  primary: "on-accent",
  secondary: "normal",
  ghost: "normal",
  danger: "error",
};

const SIZE_CONTAINER: Record<string, string> = {
  sm: "h-[36px] px-3",
  md: "h-[44px] px-4",
  lg: "h-[48px] px-6",
  icon: "h-[44px] w-[44px] p-0 justify-center",
};

export const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      disabled = false,
      onPress,
      icon,
      children,
      className = "",
      style,
      accessibilityLabel,
    },
    ref,
  ) => {
    const isSmOrIcon = size === "sm" || size === "icon";
    const hitSlopValue = isSmOrIcon
      ? {
          top: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
          bottom: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
          left: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
          right: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
        }
      : undefined;

    const containerClasses = [
      "flex-row items-center justify-center rounded-md border min-h-[44px]",
      VARIANT_CONTAINER[variant] || VARIANT_CONTAINER.primary,
      SIZE_CONTAINER[size] || SIZE_CONTAINER.md,
      disabled ? "opacity-50 pointer-events-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const textColor = VARIANT_TEXT_COLOR[variant] || "normal";
    const textSize = size === "lg" ? "lg" : size === "sm" ? "sm" : "base";

    return (
      <Pressable
        ref={ref}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlopValue}
        className={containerClasses}
        style={style}
      >
        {icon && (
          <View
            className={
              children ? "mr-2 flex-row items-center" : "flex-row items-center"
            }
          >
            {icon}
          </View>
        )}
        {typeof children === "string" ? (
          <Text
            size={textSize}
            weight="medium"
            color={textColor}
            className="select-none"
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);

Button.displayName = "Button";
