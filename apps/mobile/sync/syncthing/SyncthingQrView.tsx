import React from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
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
  if (isLoading) {
    return (
      <View className="h-[200px] w-[200px] items-center justify-center bg-white rounded-lg border border-border-normal self-center">
        <ActivityIndicator size="small" color={darkColorTokens.text.accent} />
      </View>
    );
  }

  if (!qrUrl) {
    return null;
  }

  return (
    <View className="items-center my-3">
      {/* High-contrast white container ensuring scannable quiet zone */}
      <View className="p-3 bg-white rounded-lg border border-border-normal items-center justify-center">
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
