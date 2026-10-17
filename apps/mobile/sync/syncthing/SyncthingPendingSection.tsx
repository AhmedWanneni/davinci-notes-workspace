import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Directory } from "expo-file-system";
import type {
  SyncthingPendingDevice,
  SyncthingPendingFolder,
} from "@app/syncthing-api";
import { formatDeviceIdGroups } from "@app/syncthing-api";
import { Badge, Button, Text } from "../../components/primitives";
import { checkFolderAccess } from "./folderAccessChecker";

export interface SyncthingPendingSectionProps {
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  defaultTargetPath?: string;
  onAcceptDevice: (id: string) => Promise<void>;
  onDismissDevice: (id: string) => Promise<void>;
  onAcceptFolder: (folderId: string, targetPath: string) => Promise<void>;
  onDismissFolder: (folderId: string) => Promise<void>;
}

export const SyncthingPendingSection: React.FC<SyncthingPendingSectionProps> = ({
  pendingDevices,
  pendingFolders,
  defaultTargetPath = "",
  onAcceptDevice,
  onDismissDevice,
  onAcceptFolder,
  onDismissFolder,
}) => {
  const [targetPath, setTargetPath] = useState(defaultTargetPath);
  const [accessState, setAccessState] = useState<{
    checking: boolean;
    accessible: boolean;
    isNonEmpty?: boolean;
    error?: string;
  }>({ checking: false, accessible: true });
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTargetPath && !targetPath) {
      setTargetPath(defaultTargetPath);
    }
  }, [defaultTargetPath, targetPath]);

  useEffect(() => {
    let cancelled = false;
    if (!targetPath) return;

    setAccessState((s) => ({ ...s, checking: true }));
    void checkFolderAccess(targetPath).then((res) => {
      if (cancelled) return;
      setAccessState({
        checking: false,
        accessible: res.accessible,
        isNonEmpty: res.isNonEmpty,
        error: res.error,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [targetPath]);

  const handlePickDirectory = async () => {
    try {
      const picked = await Directory.pickDirectoryAsync();
      if (picked?.uri) {
        setTargetPath(picked.uri);
      }
    } catch {
      // User cancelled picker
    }
  };

  if (pendingDevices.length === 0 && pendingFolders.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {/* Pending Devices Section */}
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
            <View
              key={dev.deviceId}
              className="p-3 rounded border border-border-subtle bg-bg-secondary mb-2"
            >
              <Text size="xs" color="normal" weight="semibold">
                {dev.name || "Desktop Device"}
              </Text>
              <Text size="xs" color="muted" className="font-mono my-1">
                {formatDeviceIdGroups(dev.deviceId)}
              </Text>
              {dev.address ? (
                <Text size="xs" color="muted" className="mb-2">
                  At: {dev.address}
                </Text>
              ) : null}

              <View className="flex-row gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => onDismissDevice(dev.deviceId)}
                  disabled={busyId === dev.deviceId}
                  className="flex-1"
                >
                  Ignore
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={async () => {
                    setBusyId(dev.deviceId);
                    try {
                      await onAcceptDevice(dev.deviceId);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  disabled={busyId === dev.deviceId}
                  className="flex-1"
                >
                  {busyId === dev.deviceId ? "Accepting..." : "Accept"}
                </Button>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Pending Folders Section */}
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
            <View
              key={folder.folderId}
              className="p-3 rounded border border-border-subtle bg-bg-secondary mb-2"
            >
              <Text size="xs" color="normal" weight="semibold">
                {folder.label} ({folder.folderId})
              </Text>
              <Text size="xs" color="muted" className="mb-2">
                Offered by: {formatDeviceIdGroups(folder.offeredBy).slice(0, 15)}...
              </Text>

              {/* Destination folder path check */}
              <Text size="xs" color="muted" className="mb-1">
                Target Folder on Phone:
              </Text>
              <View className="p-2 rounded border border-border-normal bg-bg-base mb-2">
                <Text size="xs" color="normal" numberOfLines={1}>
                  {targetPath || "No folder selected"}
                </Text>
              </View>

              <Button
                variant="secondary"
                size="sm"
                onPress={handlePickDirectory}
                className="mb-2"
              >
                Choose Target Folder (SAF)
              </Button>

              {/* Access status banner */}
              {accessState.checking ? (
                <View className="flex-row items-center gap-1 mb-2">
                  <ActivityIndicator size="small" />
                  <Text size="xs" color="muted">
                    Checking folder read/write access...
                  </Text>
                </View>
              ) : !accessState.accessible ? (
                <View className="p-2 rounded bg-bg-status-error border border-border-status-error mb-2">
                  <Text size="xs" color="error">
                    {accessState.error ||
                      "Folder is not accessible by DaVinci Notes."}
                  </Text>
                </View>
              ) : accessState.isNonEmpty ? (
                <View className="p-2 rounded bg-bg-status-warning border border-border-status-warning mb-2">
                  <Text size="xs" color="warning">
                    Target folder is not empty. Contents will be merged.
                  </Text>
                </View>
              ) : null}

              <View className="flex-row gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => onDismissFolder(folder.folderId)}
                  disabled={busyId === folder.folderId}
                  className="flex-1"
                >
                  Ignore
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={async () => {
                    if (!accessState.accessible || !targetPath) return;
                    setBusyId(folder.folderId);
                    try {
                      await onAcceptFolder(folder.folderId, targetPath);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  disabled={
                    !accessState.accessible ||
                    !targetPath ||
                    busyId === folder.folderId
                  }
                  className="flex-1"
                >
                  {busyId === folder.folderId ? "Accepting..." : "Accept Folder"}
                </Button>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

SyncthingPendingSection.displayName = "SyncthingPendingSection";
