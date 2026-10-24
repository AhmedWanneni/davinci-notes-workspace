import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { formatDeviceIdGroups } from "@app/syncthing-api";
import { useTheme } from "../../theme";
import { Badge, Button, Text } from "../../components/primitives";
import { VaultManager } from "../../vault/vaultManager";
import { useMobileSyncthing } from "./useMobileSyncthing";
import { getSyncthingStatusViewData } from "./syncthingStatusViewData";
import { SyncthingQrView } from "./SyncthingQrView";
import { SyncthingKeyModal } from "./SyncthingKeyModal";
import { SyncthingAddDeviceModal } from "./SyncthingAddDeviceModal";
import { SyncthingPendingSection } from "./SyncthingPendingSection";
import { ScanToSyncModal } from "./ScanToSyncModal";
import { SyncthingRunConditionsView } from "./SyncthingRunConditionsView";
import { mobileSyncthingTriggerScan } from "./mobileSyncthingOperations";
import { getSyncthingApiKey } from "./secureKeyStore";

export const MobileSyncthingPanel: React.FC = () => {
  const {
    status,
    version,
    deviceId,
    deviceName,
    qrUrl,
    hasSavedKey,
    isLoading,
    isEmbedded,
    errorMessage,
    pendingDevices,
    pendingFolders,
    connectedDevices,
    refresh,
    startService,
    stopService,
    saveKey,
    clearKey,
    addDevice,
    acceptDevice,
    dismissDevice,
    acceptFolder,
    dismissFolder,
  } = useMobileSyncthing();

  const { tokens } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [addDeviceVisible, setAddDeviceVisible] = useState(false);
  const [scanToSyncVisible, setScanToSyncVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [defaultVaultPath, setDefaultVaultPath] = useState("");

  useEffect(() => {
    const vm = new VaultManager();
    void vm.getRegistry().then(async (reg) => {
      if (reg.activeVaultUri) {
        setDefaultVaultPath(reg.activeVaultUri);
      } else {
        const adapter = await vm.initDefaultSandboxVault().catch(() => null);
        if (adapter) setDefaultVaultPath(adapter.vaultUri);
      }
    });
  }, []);

  const handleCopyId = async () => {
    if (!deviceId) return;
    await Clipboard.setStringAsync(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusInfo = getSyncthingStatusViewData(
    status,
    connectedDevices.length,
    version,
  );

  return (
    <View
      className="p-4 rounded-lg border mb-6"
      style={{
        backgroundColor: tokens.color.bg.secondary,
        borderColor: tokens.color.border.normal,
      }}
    >
      {/* Header and status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text variant="h3" color="normal">
            Syncthing
          </Text>
          {deviceName ? (
            <Text size="xs" color="muted">
              {`(${deviceName})`}
            </Text>
          ) : null}
        </View>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </View>

      <Text size="xs" color="muted" className="mb-4">
        {statusInfo.hint}
      </Text>

      {errorMessage && status !== "running" ? (
        <View className="p-2.5 rounded bg-bg-status-error border border-border-status-error mb-4">
          <Text size="xs" color="error">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Incoming Requests and Offers */}
      {status === "running" ? (
        <SyncthingPendingSection
          pendingDevices={pendingDevices}
          pendingFolders={pendingFolders}
          defaultTargetPath={defaultVaultPath}
          onAcceptDevice={acceptDevice}
          onDismissDevice={dismissDevice}
          onAcceptFolder={acceptFolder}
          onDismissFolder={dismissFolder}
        />
      ) : null}

      {/* Device ID and QR Code when running */}
      {status === "running" && deviceId ? (
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

          <SyncthingQrView
            qrUrl={qrUrl}
            isLoading={isLoading ? !qrUrl : false}
          />
        </View>
      ) : null}

      {/* Run Conditions (when embedded) */}
      {isEmbedded ? <SyncthingRunConditionsView /> : null}

      {/* Action controls */}
      <View
        className="flex-row gap-2 pt-2 border-t"
        style={{ borderTopColor: tokens.color.border.subtle }}
      >
        <Button
          variant="secondary"
          size="sm"
          onPress={refresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={tokens.color.text.normal} />
          ) : (
            "Refresh"
          )}
        </Button>

        {!isEmbedded ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setModalVisible(true)}
          >
            Key
          </Button>
        ) : null}
      </View>

      <ScanToSyncModal
        visible={scanToSyncVisible}
        status={status}
        hasSavedKey={hasSavedKey}
        defaultVaultPath={defaultVaultPath}
        onSaveKey={saveKey}
        onRefresh={refresh}
        onClose={() => setScanToSyncVisible(false)}
      />

      <SyncthingKeyModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={saveKey}
        onClear={clearKey}
        hasSavedKey={hasSavedKey}
      />

      <SyncthingAddDeviceModal
        visible={addDeviceVisible}
        onClose={() => setAddDeviceVisible(false)}
        onAddDevice={addDevice}
      />
    </View>
  );
};

MobileSyncthingPanel.displayName = "MobileSyncthingPanel";
