import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { SyncthingConfiguredDevice } from "@app/syncthing-api";
import { formatDeviceIdGroups } from "@app/syncthing-api";
import { useTheme } from "../../theme";
import { Badge, Button, Text } from "../../components/primitives";

export interface SyncthingPairedDevicesSectionProps {
  devices: SyncthingConfiguredDevice[];
  onRemoveDevice: (id: string) => Promise<void>;
}

export const SyncthingPairedDevicesSection: React.FC<
  SyncthingPairedDevicesSectionProps
> = ({ devices, onRemoveDevice }) => {
  const { tokens } = useTheme();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (devices.length === 0) return null;

  const handleCopy = async (id: string) => {
    await Clipboard.setStringAsync(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemove = async (id: string) => {
    setBusyId(id);
    try {
      await onRemoveDevice(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View
      className="mb-4 p-3 rounded-lg border"
      style={{
        backgroundColor: tokens.color.bg.primary,
        borderColor: tokens.color.border.subtle,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text variant="h3" color="normal">
          Paired Devices
        </Text>
        <Badge variant={devices.length > 0 ? "accent" : "neutral"}>
          {`${devices.length} ${devices.length === 1 ? "device" : "devices"}`}
        </Badge>
      </View>

      {devices.map((dev) => {
        const isBusy = busyId === dev.deviceId;
        const isCopied = copiedId === dev.deviceId;
        const shortId = `${dev.deviceId.slice(0, 7)}...${dev.deviceId.slice(-7)}`;

        return (
          <View
            key={dev.deviceId}
            className="p-2.5 rounded border mb-2 last:mb-0"
            style={{
              backgroundColor: tokens.color.bg.secondary,
              borderColor: tokens.color.border.subtle,
            }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text size="sm" weight="medium" color="normal">
                  {dev.name || "Remote Device"}
                </Text>
                <Badge variant={dev.connected ? "accent" : "neutral"}>
                  {dev.connected ? "Connected" : "Disconnected"}
                </Badge>
                {dev.isVaultShared && (
                  <Badge variant="neutral">Vault Shared</Badge>
                )}
              </View>

              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleRemove(dev.deviceId)}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={tokens.color.text.muted} />
                ) : (
                  "Unpair"
                )}
              </Button>
            </View>

            <View className="flex-row items-center justify-between mt-1">
              <Text size="xs" color="muted" className="font-mono">
                {shortId}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleCopy(dev.deviceId)}
              >
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </View>
          </View>
        );
      })}
    </View>
  );
};

SyncthingPairedDevicesSection.displayName = "SyncthingPairedDevicesSection";
