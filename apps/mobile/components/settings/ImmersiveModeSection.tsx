import React from "react";
import { View, Switch, Platform } from "react-native";
import { CornersOut } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { useImmersiveMode } from "../../settings";

export function ImmersiveModeSection(): React.ReactElement {
  const { tokens } = useTheme();
  const { isImmersiveMode, setImmersiveMode } = useImmersiveMode();

  return (
    <View className="mb-6 pt-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="mr-2.5">
            <CornersOut
              size={18}
              color={tokens.color.interactive.accent}
              weight="bold"
            />
          </View>
          <View className="flex-1">
            <Text variant="h3" color="normal">
              Immersive Mode
            </Text>
            {Platform.OS !== "android" ? (
              <Text size="xs" color="muted">
                (Android only)
              </Text>
            ) : null}
          </View>
        </View>

        <Switch
          value={isImmersiveMode}
          onValueChange={(val) => void setImmersiveMode(val)}
          trackColor={{
            false: tokens.color.bg.hover,
            true: tokens.color.interactive.accent,
          }}
          thumbColor={tokens.color.text["on-accent"]}
          accessibilityLabel="Toggle immersive mode"
        />
      </View>

      <Text variant="caption" color="muted">
        Hide the Android navigation bar on note reading and editor screens for a
        distraction-free view.
      </Text>
    </View>
  );
}
