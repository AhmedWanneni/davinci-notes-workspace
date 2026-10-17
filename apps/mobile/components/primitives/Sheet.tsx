import React from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Text } from "./Text";
import { IconButton } from "./IconButton";

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
          className="absolute inset-0 bg-bg-scrim"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
        />

        {/* Sheet content surface */}
        <View
          className={`bg-bg-secondary rounded-t-bottom-sheet border-t border-border-normal z-modal ${className}`}
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-8 h-1 rounded-full bg-border-normal" />
          </View>

          {/* Header */}
          {title ? (
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-border-subtle">
              <Text variant="h3" color="normal">
                {title}
              </Text>
              <IconButton
                icon={
                  <X
                    size={20}
                    color={darkColorTokens.text.normal}
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
