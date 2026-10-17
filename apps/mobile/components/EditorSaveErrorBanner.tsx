import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./primitives";

export interface EditorSaveErrorBannerProps {
  error: string;
  onRetry: () => void;
}

export function EditorSaveErrorBanner({
  error,
  onRetry,
}: EditorSaveErrorBannerProps): React.ReactElement {
  return (
    <View className="flex-row items-center justify-between mx-4 my-2 p-3 rounded-lg bg-accent-critical/10 border border-accent-critical">
      <Text
        variant="caption"
        color="error"
        className="flex-1 mr-2"
        numberOfLines={2}
      >
        Couldn't save: {error}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry saving note"
        onPress={onRetry}
        className="px-3 py-1 rounded bg-interactive-accent"
      >
        <Text variant="caption" color="normal" weight="semibold">
          Retry
        </Text>
      </Pressable>
    </View>
  );
}
