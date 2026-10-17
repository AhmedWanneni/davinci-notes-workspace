import React from "react";
import { View } from "react-native";
import { Button, Text } from "./primitives";

export interface EditorConflictBannerProps {
  onOverwrite: () => void;
  onReload: () => void;
}

export function EditorConflictBanner({
  onOverwrite,
  onReload,
}: EditorConflictBannerProps): React.ReactElement {
  return (
    <View className="bg-bg-status-warning border-b border-border-status-warning px-3 py-2 flex-row items-center justify-between">
      <Text variant="caption" color="warning" className="flex-1 mr-2">
        ⚠️ Note was modified externally on disk.
      </Text>
      <View className="flex-row gap-2">
        <Button variant="secondary" size="sm" onPress={onReload}>
          Reload Disk
        </Button>
        <Button variant="danger" size="sm" onPress={onOverwrite}>
          Overwrite
        </Button>
      </View>
    </View>
  );
}
