import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  formatDeviceIdGroups,
  type SyncthingPendingFolder,
} from "@app/syncthing-api";
import * as FileSystem from "expo-file-system/legacy";
import { pickDirectory } from "../../vault/fs/vaultStorage";
import { Button, Text } from "../../components/primitives";
import {
  checkFolderAccess,
  type FolderAccessCheckResult,
} from "./folderAccessChecker";
import {
  resolveSandboxTarget,
  createFreshSandboxFolder,
} from "./sandboxTargetResolver";

export interface SyncthingPendingFolderRowProps {
  folder: SyncthingPendingFolder;
  defaultTargetPath?: string;
  isBusy: boolean;
  onAccept: (folderId: string, targetPath: string) => Promise<void>;
  onDismiss: (folderId: string) => Promise<void>;
}

export const SyncthingPendingFolderRow: React.FC<
  SyncthingPendingFolderRowProps
> = ({ folder, defaultTargetPath, isBusy, onAccept, onDismiss }) => {
  const defaultSandbox = resolveSandboxTarget(folder);
  const [targetPath, setTargetPath] = useState(defaultSandbox);
  const [accessResult, setAccessResult] =
    useState<FolderAccessCheckResult | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!targetPath) return;

    setCheckingAccess(true);
    void checkFolderAccess(targetPath).then((res) => {
      if (cancelled) return;
      setAccessResult(res);
      setCheckingAccess(false);
    });

    return () => {
      cancelled = true;
    };
  }, [targetPath]);

  const handleCreateNewFolder = async () => {
    setCheckingAccess(true);
    const newTarget = await createFreshSandboxFolder(folder);
    setTargetPath(newTarget);
  };

  const handlePickDirectory = async () => {
    try {
      const picked = await pickDirectory();
      if (picked?.uri) {
        setTargetPath(picked.uri);
      }
    } catch {
      // User cancelled picker
    }
  };

  const isContent = targetPath.startsWith("content://");
  const canAccept =
    !isBusy && !checkingAccess && accessResult?.accessible && !isContent;

  return (
    <View className="p-3 rounded border border-border-subtle bg-bg-secondary mb-2">
      <Text size="xs" color="normal" weight="semibold">
        {folder.label} ({folder.folderId})
      </Text>
      <Text size="xs" color="muted" className="mb-2">
        Offered by: {formatDeviceIdGroups(folder.offeredBy).slice(0, 15)}...
      </Text>

      <Text size="xs" color="muted" className="mb-1">
        Local Target Folder:
      </Text>
      <View className="p-2 rounded border border-border-normal bg-bg-base mb-2">
        <Text size="xs" color="normal" numberOfLines={1}>
          {targetPath || "No folder selected"}
        </Text>
      </View>

      <View className="flex-row gap-2 mb-2">
        <Button
          variant="secondary"
          size="sm"
          onPress={handleCreateNewFolder}
          className="flex-1"
        >
          + New Folder
        </Button>
        {defaultTargetPath && targetPath !== defaultTargetPath ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setTargetPath(defaultTargetPath)}
            className="flex-1"
          >
            Use Active Vault
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onPress={handlePickDirectory}
          className="flex-1"
        >
          Browse
        </Button>
      </View>

      {checkingAccess ? (
        <View className="flex-row items-center gap-1 mb-2">
          <ActivityIndicator size="small" />
          <Text size="xs" color="muted">
            Checking storage access...
          </Text>
        </View>
      ) : isContent ? (
        <View className="p-2 rounded bg-bg-status-error border border-border-status-error mb-2">
          <Text size="xs" color="error">
            External Document Picker (content://) cannot be used by Syncthing.
            Tap &ldquo;+ New Folder&rdquo; to sync in app storage.
          </Text>
        </View>
      ) : !accessResult?.accessible ? (
        <View className="p-2 rounded bg-bg-status-error border border-border-status-error mb-2">
          <Text size="xs" color="error">
            {accessResult?.error || "Folder is not accessible."}
          </Text>
        </View>
      ) : accessResult?.isNonEmpty ? (
        <View className="p-2.5 rounded bg-accent-warning/10 border border-accent-warning/30 mb-2">
          <Text size="xs" color="normal" weight="semibold">
            ⚠️ Target folder is not empty
          </Text>
          <Text size="xs" color="muted" className="mt-0.5 mb-2">
            Existing files in this folder may be merged during sync.
          </Text>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleCreateNewFolder}
          >
            + Create New Empty Folder
          </Button>
        </View>
      ) : (
        <Text size="xs" color="success" className="mb-2">
          ✓ Ready and empty (clean sync target)
        </Text>
      )}

      <View className="flex-row gap-2 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => onDismiss(folder.folderId)}
          disabled={isBusy}
          className="flex-1"
        >
          Ignore
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={async () => {
            if (!canAccept) return;
            try {
              await FileSystem.makeDirectoryAsync(targetPath, {
                intermediates: true,
              });
            } catch {
              // Best effort directory create
            }
            await onAccept(folder.folderId, targetPath);
          }}
          disabled={!canAccept}
          className="flex-1"
        >
          {isBusy ? "Accepting..." : "Accept Folder"}
        </Button>
      </View>
    </View>
  );
};

