import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";

export interface KeyboardAwareContainerProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
  scrollable?: boolean;
  className?: string;
  style?: ViewStyle;
  contentContainerClassName?: string;
  contentContainerStyle?: ViewStyle;
}

export const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  keyboardVerticalOffset = Platform.OS === "ios" ? 44 : 0,
  scrollable = false,
  className = "",
  style,
  contentContainerClassName,
  contentContainerStyle,
}) => {
  const behavior = Platform.OS === "ios" ? "padding" : undefined;

  return (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      className={`flex-1 ${className}`}
      style={style}
    >
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={contentContainerClassName}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </KeyboardAvoidingView>
  );
};

KeyboardAwareContainer.displayName = "KeyboardAwareContainer";
