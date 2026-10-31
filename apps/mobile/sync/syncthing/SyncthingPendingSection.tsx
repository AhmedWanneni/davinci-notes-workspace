import React, { useState } from "react";
import { View } from "react-native";
import type {
  SyncthingPendingDevice,
  SyncthingPendingFolder,
} from "@app/syncthing-api";
import { Badge, Text } from "../../components/primitives";
import { SyncthingPendingDeviceRow } from "./SyncthingPendingDeviceRow";
import { SyncthingPendingFolderRow } from "./SyncthingPendingFolderRow";

export interface SyncthingPendingSectionProps {
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  defaultTargetPath?: string;
  onAcceptDevice: (id: string) => Promise<void>;
  onDismissDevice: (id: string) => Promise<void>;
  onAcceptFolder: (folderId: string, targetPath: string) => Promise<void>;
  onDismissFolder: (folderId: string) => Promise<void>;
}

export const SyncthingPendingSection: React.FC<
  SyncthingPendingSectionProps
> = ({
  pendingDevices,
  pendingFolders,
  defaultTargetPath = "",
  onAcceptDevice,
  onDismissDevice,
  onAcceptFolder,
  onDismissFolder,
}) => {
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);

  if (pendingDevices.length === 0 && pendingFolders.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {pendingDevices.length > 0 ? (
        <View className="mb-4 p-3 rounded-lg border border-border-normal bg-bg-base">
          <View className="flex-row items-center justify-between mb-2">
            <Text variant="h3" color="normal">
              Incoming Device Requests
            </Text>
            <Badge variant="warning">{pendingDevices.length}</Badge>
          </View>
          <Text size="xs" color="muted" className="mb-3">
            Another device is requesting to connect. Explicitly accept to pair.
          </Text>

          {pendingDevices.map((dev) => (
            <SyncthingPendingDeviceRow
              key={dev.deviceId}
              device={dev}
              onAccept={onAcceptDevice}
              onDismiss={onDismissDevice}
            />
          ))}
        </View>
      ) : null}

      {pendingFolders.length > 0 ? (
        <View className="p-3 rounded-lg border border-border-normal bg-bg-base">
          <View className="flex-row items-center justify-between mb-2">
            <Text variant="h3" color="normal">
              Incoming Folder Offers
            </Text>
            <Badge variant="accent">{pendingFolders.length}</Badge>
          </View>
          <Text size="xs" color="muted" className="mb-3">
            A paired device wants to sync a vault folder with this phone.
          </Text>

          {pendingFolders.map((folder) => (
            <SyncthingPendingFolderRow
              key={folder.folderId}
              folder={folder}
              defaultTargetPath={defaultTargetPath}
              isBusy={busyFolderId === folder.folderId}
              onAccept={async (fId, path) => {
                setBusyFolderId(fId);
                try {
                  await onAcceptFolder(fId, path);
                } finally {
                  setBusyFolderId(null);
                }
              }}
              onDismiss={onDismissFolder}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

SyncthingPendingSection.displayName = "SyncthingPendingSection";
