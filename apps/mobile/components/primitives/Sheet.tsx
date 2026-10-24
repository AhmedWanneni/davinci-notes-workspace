import React from "react";
import { Modal, Pressable, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
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
      className={`mb-3 overflow-hidden border ${className}`}
      style={[
        {
          backgroundColor: tokens.color.bg.primary,
          borderColor: tokens.color.border.subtle,
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
}

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  children,
  className = "",
}) => {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Scrim backdrop */}
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: tokens.color.bg.scrim }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
        />

        {/* Sheet content surface */}
        <View
          className={`border-t z-modal ${className}`}
          style={{
            backgroundColor: tokens.color.bg.secondary,
            borderColor: tokens.color.border.normal,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-2">
            <View
              className="w-8 h-1 rounded-full"
              style={{ backgroundColor: tokens.color.border.normal }}
            />
          </View>

          {/* Header */}
          {title ? (
            <View
              className="flex-row items-center justify-between px-4 py-2 border-b"
              style={{ borderBottomColor: tokens.color.border.subtle }}
            >
              <Text variant="h3" color="normal">
                {title}
              </Text>
              <IconButton
                icon={
                  <X
                    size={20}
                    color={tokens.color.text.normal}
                    weight="regular"
                  />
                }
                accessibilityLabel="Close sheet"
                size="sm"
                onPress={onClose}
              />
            </View>
          ) : null}

          {/* Body */}
          <View className="p-4">{children}</View>
        </View>
      </View>
    </Modal>
  );
};

Sheet.displayName = "Sheet";
