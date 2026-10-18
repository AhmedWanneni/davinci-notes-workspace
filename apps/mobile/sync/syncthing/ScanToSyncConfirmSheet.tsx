import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  formatDeviceIdGroups,
  type SyncthingPairingPayload,
} from "@app/syncthing-api";
import { Paths } from "expo-file-system";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Badge, Button, Text } from "../../components/primitives";
import {
  checkFolderAccess,
  type FolderAccessCheckResult,
} from "./folderAccessChecker";

export interface ScanToSyncConfirmSheetProps {
  payload: SyncthingPairingPayload;
  defaultTargetPath: string;
  isBusy: boolean;
  onConfirm: (targetPath: string) => Promise<void>;
  onBack: () => void;
  onCancel: () => void;
}

export const ScanToSyncConfirmSheet: React.FC<ScanToSyncConfirmSheetProps> = ({
  payload,
  defaultTargetPath,
  isBusy,
  onConfirm,
  onBack,
  onCancel,
}) => {
  const resolvedTarget =
    defaultTargetPath.trim() || `${Paths.document.uri}/vault`;
  const [accessResult, setAccessResult] =
    useState<FolderAccessCheckResult | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setCheckingAccess(true);
    void checkFolderAccess(resolvedTarget).then((res) => {
      if (!cancelled) {
        setAccessResult(res);
        setCheckingAccess(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedTarget]);

  const canConfirm =
    !isBusy && !checkingAccess && accessResult?.accessible === true;

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text variant="h3" color="normal">
          Confirm Pairing
        </Text>
        {payload.code ? (
          <Badge variant="accent">{`Code: ${payload.code}`}</Badge>
        ) : null}
      </View>

      <Text size="xs" color="muted" className="mb-3 leading-relaxed">
        Review desktop connection and vault details. Nothing is added until you confirm.
      </Text>

      {/* Desktop info card */}
      <View className="p-3 rounded border border-border-subtle bg-bg-base mb-3">
        <Text size="xs" color="muted" weight="medium" className="mb-0.5">
          Desktop Device:
        </Text>
        <Text size="sm" color="normal" weight="semibold" className="mb-2">
          {payload.name || "Desktop"}
        </Text>

        <Text size="xs" color="muted" weight="medium" className="mb-0.5">
          Device ID:
        </Text>
        <Text size="xs" color="normal" className="font-mono mb-2 leading-relaxed" selectable>
          {formatDeviceIdGroups(payload.id)}
        </Text>

        <Text size="xs" color="muted" weight="medium" className="mb-0.5">
          Vault to Sync:
        </Text>
        <Text size="sm" color="normal" weight="semibold">
          {payload.folderLabel || "Vault"} ({payload.folderId})
        </Text>
      </View>

      {/* Target path check */}
      <View className="p-3 rounded border border-border-subtle bg-bg-base mb-4">
        <Text size="xs" color="muted" weight="medium" className="mb-0.5">
          Local Storage Target:
        </Text>
        <Text size="xs" color="normal" className="font-mono mb-2" numberOfLines={2}>
          {resolvedTarget}
        </Text>

        {checkingAccess ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color={darkColorTokens.text.accent} />
            <Text size="xs" color="muted">
              Checking storage read/write access...
            </Text>
          </View>
        ) : accessResult?.accessible ? (
          accessResult.isNonEmpty ? (
            <View className="p-2 rounded bg-accent-warning/10 border border-accent-warning/30">
              <Text size="xs" color="normal" weight="medium">
                ⚠️ Target folder is not empty
              </Text>
              <Text size="xs" color="muted" className="mt-0.5">
                Existing files in this folder may be merged during sync.
              </Text>
            </View>
          ) : (
            <Text size="xs" color="success">
              ✓ Ready and empty (read/write access verified)
            </Text>
          )
        ) : (
          <View className="p-2 rounded bg-bg-status-error border border-border-status-error">
            <Text size="xs" color="error" weight="medium">
              Storage Access Error
            </Text>
            <Text size="xs" color="error" className="mt-0.5">
              {accessResult?.error || "Cannot write to target folder."}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-2 mb-2">
        <Button
          variant="secondary"
          size="sm"
          onPress={onBack}
          disabled={isBusy}
          className="flex-1"
        >
          Scan Again
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={() => onConfirm(resolvedTarget)}
          disabled={!canConfirm}
          className="flex-1"
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={darkColorTokens.text.normal} />
          ) : (
            "Confirm & Pair"
          )}
        </Button>
      </View>

      <Button variant="ghost" size="sm" onPress={onCancel} disabled={isBusy}>
        Cancel
      </Button>
    </View>
  );
};

ScanToSyncConfirmSheet.displayName = "ScanToSyncConfirmSheet";
export default ScanToSyncConfirmSheet;
