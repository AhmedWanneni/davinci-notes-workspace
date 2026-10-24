import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../theme";

export interface InputProps extends Omit<RNTextInputProps, "style"> {
  variant?: "default" | "error";
  size?: "sm" | "md" | "lg";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: TextStyle;
}

const SIZE_CONTAINER: Record<string, string> = {
  sm: "h-[36px] px-2.5",
  md: "h-[44px] px-3",
  lg: "h-[48px] px-4",
};

export const Input = React.forwardRef<RNTextInput, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      prefix,
      suffix,
      disabled = false,
      className = "",
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const { tokens } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const isError = variant === "error";

    const borderColor = isError
      ? tokens.color.border["status-error"]
      : isFocused
        ? tokens.color.border.focus
        : tokens.color.border.normal;

    const containerClasses = [
      "flex-row items-center rounded-md border min-h-[44px]",
      SIZE_CONTAINER[size] || SIZE_CONTAINER.md,
      disabled ? "opacity-50 pointer-events-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <View
        className={containerClasses}
        style={{
          backgroundColor: tokens.color.bg.secondary,
          borderColor,
        }}
      >
        {prefix ? <View className="mr-2 flex-shrink-0">{prefix}</View> : null}
        <RNTextInput
          ref={ref}
          editable={!disabled}
          placeholderTextColor={tokens.color.text.faint}
          className="flex-1 text-sm h-full py-0"
          style={[{ color: tokens.color.text.normal }, style]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {suffix ? <View className="ml-2 flex-shrink-0">{suffix}</View> : null}
      </View>
    );
  },
);

Input.displayName = "Input";
