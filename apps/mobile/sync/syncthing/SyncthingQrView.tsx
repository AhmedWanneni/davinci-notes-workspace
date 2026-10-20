import React from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme";
import { Text } from "../../components/primitives";

export interface SyncthingQrViewProps {
  qrUrl: string | null;
  isLoading?: boolean;
}

/**
 * Renders the Syncthing Device QR code with a clean, high-contrast white quiet zone.
 * Suitable for scanning by another phone's camera in dark mode.
 */
export const SyncthingQrView: React.FC<SyncthingQrViewProps> = ({
  qrUrl,
  isLoading = false,
}) => {
  const { tokens } = useTheme();

  if (isLoading) {
    return (
      <View
        className="h-[200px] w-[200px] items-center justify-center bg-white rounded-lg border self-center"
        style={{ borderColor: tokens.color.border.normal }}
      >
        <ActivityIndicator
          size="small"
          color={tokens.color.interactive.accent}
        />
      </View>
    );
  }

  if (!qrUrl) {
    return null;
  }

  return (
    <View className="items-center my-3">
      {/* High-contrast white container ensuring scannable quiet zone */}
      <View
        className="p-3 bg-white rounded-lg border items-center justify-center"
        style={{ borderColor: tokens.color.border.normal }}
      >
        <Image
          source={{ uri: qrUrl }}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
          accessibilityLabel="Syncthing Device ID QR code"
        />
      </View>
      <Text size="xs" color="muted" className="mt-2 text-center">
        Scan from another phone or tablet to pair
      </Text>
    </View>
  );
};

SyncthingQrView.displayName = "SyncthingQrView";
