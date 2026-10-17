import React from "react";
import { View } from "react-native";
import { ArrowLeft } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { IconButton, Text } from "./primitives";

export interface EditorHeaderProps {
  title: string;
  payloadBytes: number;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onBack: () => void;
}

export function EditorHeader({
  title,
  payloadBytes,
  saveStatus = "saved",
  onBack,
}: EditorHeaderProps): React.ReactElement {
  const statusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "error"
        ? "Save failed"
        : saveStatus === "unsaved"
          ? "Unsaved"
          : payloadBytes > 0
            ? `${payloadBytes} B`
            : "Saved";

  const statusColor = saveStatus === "error" ? "error" : "muted";

  return (
    <View className="h-[44px] flex-row items-center justify-between px-3 bg-bg-primary-alt border-b border-border-subtle">
      <IconButton
        icon={
          <ArrowLeft
            size={20}
            color={darkColorTokens.text.normal}
            weight="regular"
          />
        }
        accessibilityLabel="Back to reading mode"
        size="sm"
        onPress={onBack}
      />
      <Text
        variant="text"
        weight="semibold"
        color="normal"
        numberOfLines={1}
        className="flex-1 mx-2"
      >
        {title}
      </Text>
      <Text variant="caption" color={statusColor}>
        {statusLabel}
      </Text>
    </View>
  );
}
