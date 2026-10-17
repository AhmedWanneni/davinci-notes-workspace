import React from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { mobileTokens } from "@app/design-tokens/mobile";

export interface IconButtonProps {
  icon: React.ReactNode;
  accessibilityLabel: string;
  variant?: "ghost" | "secondary" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  className?: string;
  style?: ViewStyle;
}

const VARIANT_CONTAINER: Record<string, string> = {
  ghost: "bg-transparent border-transparent active:bg-bg-hover",
  secondary: "bg-transparent border-border-normal active:bg-bg-hover",
  primary: "bg-interactive-accent border-transparent active:opacity-80",
  danger: "bg-transparent border-border-normal active:bg-bg-hover",
};

const SIZE_CONTAINER: Record<string, string> = {
  sm: "h-[36px] w-[36px]",
  md: "h-[44px] w-[44px]",
  lg: "h-[48px] w-[48px]",
};

export const IconButton = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  IconButtonProps
>(
  (
    {
      icon,
      accessibilityLabel,
      variant = "ghost",
      size = "md",
      disabled = false,
      onPress,
      className = "",
      style,
    },
    ref,
  ) => {
    const isSm = size === "sm";
    const hitSlopValue = isSm
      ? {
          top: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
          bottom: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
          left: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
          right: Math.max(0, (mobileTokens.minTouchTarget - 36) / 2),
        }
      : undefined;

    const containerClasses = [
      "items-center justify-center rounded-md border min-h-[44px] min-w-[44px]",
      VARIANT_CONTAINER[variant] || VARIANT_CONTAINER.ghost,
      SIZE_CONTAINER[size] || SIZE_CONTAINER.md,
      disabled ? "opacity-50 pointer-events-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

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
        {icon}
      </Pressable>
    );
  },
);

IconButton.displayName = "IconButton";
