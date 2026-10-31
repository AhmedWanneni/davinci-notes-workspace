import React, { useState } from "react";
import { View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { formatDeviceIdGroups } from "@app/syncthing-api";
import { useTheme } from "../../theme";
import { Button, Text } from "../../components/primitives";
import { SyncthingQrView } from "./SyncthingQrView";

export interface SyncthingDeviceIdCardProps {
  deviceId: string;
  qrUrl: string | null;
  isLoading: boolean;
}

export const SyncthingDeviceIdCard: React.FC<SyncthingDeviceIdCardProps> = ({
  deviceId,
  qrUrl,
  isLoading,
}) => {
  const { tokens } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    if (!deviceId) return;
    await Clipboard.setStringAsync(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="mb-4">
      <Text size="xs" color="muted" weight="medium" className="mb-1">
        This Device ID (scan from desktop to pair):
      </Text>
      <View
        className="p-3 rounded border mb-2"
        style={{
          backgroundColor: tokens.color.bg.primary,
          borderColor: tokens.color.border.subtle,
        }}
      >
        <Text
          size="xs"
          color="normal"
          className="font-mono leading-relaxed select-all"
          selectable
        >
          {formatDeviceIdGroups(deviceId)}
        </Text>
      </View>

      <Button
        variant="secondary"
        size="sm"
        onPress={handleCopyId}
        className="mb-2"
      >
        {copied ? "Copied to Clipboard!" : "Copy Device ID"}
      </Button>

      <SyncthingQrView qrUrl={qrUrl} isLoading={isLoading ? !qrUrl : false} />
    </View>
  );
};
