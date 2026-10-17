import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Button, Text, Divider } from "../components/primitives";
import type { MobileSyncEngine } from "./mobileSyncEngine";
import { useSyncStatus } from "./useSyncStatus";
import { SyncStatusBadge } from "./SyncStatusBadge";

export interface SyncSettingsPanelProps {
  engine?: MobileSyncEngine;
  clientId?: string;
}

export const SyncSettingsPanel: React.FC<SyncSettingsPanelProps> = ({
  engine,
  clientId = "davinci-mobile-client",
}) => {
  const {
    status,
    progress,
    lastSyncedAt,
    conflicts,
    errorMessage,
    isAuthenticated,
    syncNow,
    connectDrive,
    disconnectDrive,
  } = useSyncStatus(engine);

  const [isBusy, setIsBusy] = useState(false);

  const handleSyncPress = async () => {
    setIsBusy(true);
    try {
      await syncNow();
    } finally {
      setIsBusy(false);
    }
  };

  const handleAuthPress = async () => {
    setIsBusy(true);
    try {
      if (isAuthenticated) {
        await disconnectDrive();
      } else {
        await connectDrive(clientId);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg-base p-4">
      <View className="mb-6">
        <Text variant="h2" weight="semibold" className="mb-1">
          Sync Settings
        </Text>
        <Text variant="caption" color="muted">
          Local-first manifest sync via Google Drive. No custom server backend.
        </Text>
      </View>

      {/* Sync Status Banner */}
      <View className="p-4 rounded border border-border-default bg-bg-surface mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="body" weight="medium">
            Status
          </Text>
          <SyncStatusBadge
            status={status}
            progress={progress}
            lastSyncedAt={lastSyncedAt}
            onPress={handleSyncPress}
          />
        </View>

        {errorMessage && (
          <View className="p-3 rounded bg-accent-danger/10 border border-accent-danger/20 mb-3">
            <Text variant="caption" className="text-accent-danger">
              {errorMessage}
            </Text>
          </View>
        )}

        <Button
          variant="primary"
          onPress={handleSyncPress}
          disabled={isBusy || status === "syncing" || !isAuthenticated}
        >
          {status === "syncing" ? "Syncing..." : "Sync Now"}
        </Button>
      </View>

      {/* Google Drive Connection */}
      <View className="p-4 rounded border border-border-default bg-bg-surface mb-6">
        <Text variant="body" weight="medium" className="mb-1">
          Google Drive Account
        </Text>
        <Text variant="caption" color="muted" className="mb-4">
          Uses non-sensitive scopes (drive.file & drive.appdata) to store
          encrypted manifests and file blocks.
        </Text>

        <Button
          variant={isAuthenticated ? "secondary" : "primary"}
          onPress={handleAuthPress}
          disabled={isBusy}
        >
          {isAuthenticated ? "Disconnect Drive" : "Connect with Google Drive"}
        </Button>
      </View>

      {/* Conflicts section if detected */}
      {conflicts.length > 0 && (
        <View className="p-4 rounded border border-accent-warning/30 bg-accent-warning/10 mb-6">
          <Text
            variant="body"
            weight="semibold"
            className="text-accent-warning mb-2"
          >
            Conflicting Files ({conflicts.length})
          </Text>
          <Text variant="caption" className="text-fg-secondary mb-3">
            These files were modified both locally and on another device. In
            accordance with zero-data-loss policy, they have been left
            untouched.
          </Text>

          {conflicts.map((c) => (
            <View key={c.path} className="py-2 border-b border-border-default">
              <Text variant="caption" weight="medium">
                {c.path}
              </Text>
              <Text variant="caption" color="muted">
                {c.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Divider className="my-4" />

      {/* Policy information */}
      <View className="p-4 rounded border border-border-default bg-bg-surface">
        <Text variant="caption" weight="medium" className="mb-1">
          Data & Battery Policies
        </Text>
        <Text variant="caption" color="muted">
          • Auto-sync pauses heavy binary attachments on cellular networks.
          {"\n"}• Auto-sync pauses automatically when battery is below 20% or in
          Low Power Mode.{"\n"}• Manual "Sync Now" always operates without
          restrictions.
        </Text>
      </View>
    </ScrollView>
  );
};
