import React from "react";
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../theme";

export interface TextProps extends Omit<RNTextProps, "style"> {
  variant?: "h1" | "h2" | "h3" | "h4" | "text" | "editor" | "body" | "caption";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?:
    | "normal"
    | "muted"
    | "faint"
    | "accent"
    | "on-accent"
    | "error"
    | "success"
    | "warning";
  className?: string;
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<string, string> = {
  h1: "text-2xl font-bold tracking-tight text-text-normal",
  h2: "text-xl font-semibold tracking-tight text-text-normal",
  h3: "text-lg font-semibold text-text-normal",
  h4: "text-base font-semibold text-text-normal",
  text: "text-sm text-text-normal",
  body: "text-base text-text-normal",
  caption: "text-xs text-text-muted",
  editor: "text-base text-text-normal font-mono",
};

const SIZE_STYLES: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

const WEIGHT_STYLES: Record<string, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const COLOR_STYLES: Record<string, string> = {
  normal: "text-text-normal",
  muted: "text-text-muted",
  faint: "text-text-faint",
  accent: "text-text-accent",
  "on-accent": "text-text-on-accent",
  error: "text-text-error",
  success: "text-text-success",
  warning: "text-text-warning",
};

export const Text = React.forwardRef<any, TextProps>(
  (
    {
      variant = "text",
      size,
      weight,
      color,
      className = "",
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const { tokens } = useTheme();

    const colorMap: Record<NonNullable<TextProps["color"]>, string> = {
      normal: tokens.color.text.normal,
      muted: tokens.color.text.muted,
      faint: tokens.color.text.faint,
      accent: tokens.color.interactive.accent,
      "on-accent": tokens.color.text["on-accent"],
      error: tokens.color.text.error,
      success: tokens.color.text.success,
      warning: tokens.color.text.warning,
    };

    const resolvedColor = color
      ? colorMap[color]
      : variant === "caption"
        ? tokens.color.text.muted
        : tokens.color.text.normal;

    const classList = [
      VARIANT_STYLES[variant] || VARIANT_STYLES.text,
      size && SIZE_STYLES[size],
      weight && WEIGHT_STYLES[weight],
      color && COLOR_STYLES[color],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <RNText
        ref={ref}
        className={classList}
        style={[{ color: resolvedColor }, style]}
        {...props}
      >
        {children}
      </RNText>
    );
  },
);

Text.displayName = "Text";
