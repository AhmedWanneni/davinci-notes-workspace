import React from "react";
import { Modal, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "./Text";
import { IconButton } from "./IconButton";

export interface SheetGroupProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function SheetGroup({
  children,
  className = "",
  style,
}: SheetGroupProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View
      className={`mb-3 overflow-hidden ${className}`}
      style={[
        {
          backgroundColor: tokens.color.bg.primary,
          borderRadius: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  backgroundColor?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  children,
  className = "",
  backgroundColor,
}) => {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 ${className}`}
        style={{
          backgroundColor: backgroundColor ?? tokens.color.bg.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Fullscreen Header */}
        {title ? (
          <View
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderBottomColor: tokens.color.border.subtle }}
          >
            <IconButton
              icon={
                <ArrowLeft
                  size={22}
                  color={tokens.color.text.normal}
                  weight="regular"
                />
              }
              accessibilityLabel="Close"
              size="sm"
              onPress={onClose}
            />
            <Text
              variant="h3"
              color="normal"
              style={{ fontSize: 16, fontWeight: "700" }}
            >
              {title}
            </Text>
            <View className="w-8" />
          </View>
        ) : null}

        {/* Body */}
        <View className="flex-1 p-4">{children}</View>
      </View>
    </Modal>
  );
};

Sheet.displayName = "Sheet";
