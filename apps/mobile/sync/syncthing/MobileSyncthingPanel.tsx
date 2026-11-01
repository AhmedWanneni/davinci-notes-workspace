import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../../theme";
import { Badge, Button, Text } from "../../components/primitives";
import { VaultManager } from "../../vault/vaultManager";
import { normalizeToValidFileUri } from "../../vault/pathUtils";
import { useMobileSyncthing } from "./useMobileSyncthing";
import { getSyncthingStatusViewData } from "./syncthingStatusViewData";
import { SyncthingDeviceIdCard } from "./SyncthingDeviceIdCard";
import { SyncthingKeyModal } from "./SyncthingKeyModal";
import { SyncthingAddDeviceModal } from "./SyncthingAddDeviceModal";
import { SyncthingPendingSection } from "./SyncthingPendingSection";
import { SyncthingPairedDevicesSection } from "./SyncthingPairedDevicesSection";
import { SyncthingSharedVaultsSection } from "./SyncthingSharedVaultsSection";
import { ScanToSyncModal } from "./ScanToSyncModal";
import { SyncthingRunConditionsView } from "./SyncthingRunConditionsView";

export interface MobileSyncthingPanelProps {
  onVaultSwitched?: (vaultUri: string) => void;
}

export const MobileSyncthingPanel: React.FC<MobileSyncthingPanelProps> = ({
  onVaultSwitched,
}) => {
  const [defaultVaultPath, setDefaultVaultPath] = useState("");
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
    configuredDevices,
    sharedVaults,
    connectedDevices,
    refresh,
    saveKey,
    clearKey,
    addDevice,
    removeDevice,
    acceptDevice,
    dismissDevice,
    acceptFolder,
    dismissFolder,
    unshareFolder,
  } = useMobileSyncthing(true, defaultVaultPath);

  const { tokens } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [addDeviceVisible, setAddDeviceVisible] = useState(false);
  const [scanToSyncVisible, setScanToSyncVisible] = useState(false);

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

  const handleOpenVault = async (path: string, label: string) => {
    const vm = new VaultManager();
    const normalized = normalizeToValidFileUri(path);
    await vm.openDirectoryVault(normalized, label);
    setDefaultVaultPath(normalized);
    onVaultSwitched?.(normalized);
    await refresh();
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

      {status === "running" ? (
        <SyncthingPairedDevicesSection
          devices={configuredDevices}
          onRemoveDevice={removeDevice}
        />
      ) : null}

      {status === "running" ? (
        <SyncthingSharedVaultsSection
          vaults={sharedVaults}
          onOpenVault={handleOpenVault}
          onUnshareVault={unshareFolder}
        />
      ) : null}

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

      {status === "running" && deviceId ? (
        <SyncthingDeviceIdCard
          deviceId={deviceId}
          qrUrl={qrUrl}
          isLoading={isLoading}
        />
      ) : null}

      {isEmbedded ? <SyncthingRunConditionsView /> : null}

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

        <Button
          variant="secondary"
          size="sm"
          onPress={() => setAddDeviceVisible(true)}
        >
          Add Device
        </Button>

        <Button
          variant="primary"
          size="sm"
          onPress={() => setScanToSyncVisible(true)}
        >
          Scan to Sync
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
        onVaultSynced={handleOpenVault}
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
