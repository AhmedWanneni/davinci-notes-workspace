import React, { useState } from "react";
import { View } from "react-native";
import {
  formatDeviceIdGroups,
  type SyncthingPendingDevice,
} from "@app/syncthing-api";
import { Button, Text } from "../../components/primitives";

export interface SyncthingPendingDeviceRowProps {
  device: SyncthingPendingDevice;
  onAccept: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export const SyncthingPendingDeviceRow: React.FC<
  SyncthingPendingDeviceRowProps
> = ({ device, onAccept, onDismiss }) => {
  const [isBusy, setIsBusy] = useState(false);

  return (
    <View className="p-3 rounded border border-border-subtle bg-bg-secondary mb-2">
      <Text size="xs" color="normal" weight="semibold">
        {device.name || "Desktop Device"}
      </Text>
      <Text size="xs" color="muted" className="font-mono my-1">
        {formatDeviceIdGroups(device.deviceId)}
      </Text>
      {device.address ? (
        <Text size="xs" color="muted" className="mb-2">
          At: {device.address}
        </Text>
      ) : null}

      <View className="flex-row gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => onDismiss(device.deviceId)}
          disabled={isBusy}
          className="flex-1"
        >
          Ignore
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={async () => {
            setIsBusy(true);
            try {
              await onAccept(device.deviceId);
            } finally {
              setIsBusy(false);
            }
          }}
          disabled={isBusy}
          className="flex-1"
        >
          {isBusy ? "Accepting..." : "Accept"}
        </Button>
      </View>
    </View>
  );
};
