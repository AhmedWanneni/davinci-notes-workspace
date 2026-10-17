import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { formatDeviceIdGroups } from "@app/syncthing-api";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Badge, Button, Text } from "../../components/primitives";
import { useMobileSyncthing } from "./useMobileSyncthing";
import { SyncthingQrView } from "./SyncthingQrView";
import { SyncthingKeyModal } from "./SyncthingKeyModal";

export const MobileSyncthingPanel: React.FC = () => {
  const {
    status,
    version,
    deviceId,
    deviceName,
    qrUrl,
    hasSavedKey,
    isLoading,
    errorMessage,
    refresh,
    saveKey,
    clearKey,
  } = useMobileSyncthing();

  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    if (!deviceId) return;
    await Clipboard.setStringAsync(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusVariant =
    status === "running"
      ? "success"
      : status === "bad-key"
        ? "error"
        : status === "not-running"
          ? "warning"
          : "neutral";

  const statusLabel =
    status === "running"
      ? "Running"
      : status === "bad-key"
        ? "Key Problem"
        : status === "not-running"
          ? "Not Running"
          : "Checking...";

  const statusHint =
    status === "running"
      ? `Connected to Syncthing-Fork ${version ? `(${version})` : ""}`
      : status === "bad-key"
        ? "API key invalid or missing. Configure key from Syncthing-Fork settings."
        : status === "not-running"
          ? "Syncthing-Fork is not active. Open Syncthing-Fork and ensure service is running."
          : "Probing 127.0.0.1:8384...";

  return (
    <View className="p-4 rounded-lg border border-border-normal bg-bg-secondary mb-6">
      {/* Header and status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text variant="h3" color="normal">
            Syncthing
          </Text>
          {deviceName ? (
            <Text size="xs" color="muted">
              ({deviceName})
            </Text>
          ) : null}
        </View>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </View>

      <Text size="xs" color="muted" className="mb-4">
        {statusHint}
      </Text>

      {errorMessage && status !== "running" ? (
        <View className="p-2.5 rounded bg-bg-status-error border border-border-status-error mb-4">
          <Text size="xs" color="error">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Device ID and QR Code when running */}
      {status === "running" && deviceId ? (
        <View className="mb-4">
          <Text size="xs" color="muted" weight="medium" className="mb-1">
            This Device ID
          </Text>
          <View className="p-3 rounded border border-border-subtle bg-bg-base mb-2">
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

          <SyncthingQrView
            qrUrl={qrUrl}
            isLoading={isLoading ? !qrUrl : false}
          />
        </View>
      ) : null}

      {/* Action controls */}
      <View className="flex-row gap-2 pt-2 border-t border-border-subtle">
        <Button
          variant="secondary"
          size="sm"
          onPress={refresh}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={darkColorTokens.text.normal}
            />
          ) : (
            "Refresh"
          )}
        </Button>
        <Button
          variant={hasSavedKey ? "secondary" : "primary"}
          size="sm"
          onPress={() => setModalVisible(true)}
          className="flex-1"
        >
          {hasSavedKey ? "Edit API Key" : "Set API Key"}
        </Button>
      </View>

      <SyncthingKeyModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={saveKey}
        onClear={clearKey}
        hasSavedKey={hasSavedKey}
      />
    </View>
  );
};

MobileSyncthingPanel.displayName = "MobileSyncthingPanel";
