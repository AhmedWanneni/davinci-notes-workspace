import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { useTheme } from "../theme";
import { Button, Text, Divider } from "../components/primitives";
import type { MobileSyncEngine } from "./mobileSyncEngine";
import { useSyncStatus } from "./useSyncStatus";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { MobileSyncthingPanel } from "./syncthing";

export interface SyncSettingsPanelProps {
  engine?: MobileSyncEngine;
  clientId?: string;
}

export const SyncSettingsPanel: React.FC<SyncSettingsPanelProps> = ({
  engine,
  clientId = "davinci-mobile-client",
}) => {
  const { tokens } = useTheme();
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
    <ScrollView
      className="flex-1 p-4"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      <View className="mb-6">
        <Text variant="h2" weight="semibold" className="mb-1">
          Sync Settings
        </Text>
        <Text variant="caption" color="muted">
          Local-first manifest sync via Google Drive. No custom server backend.
        </Text>
      </View>

      {/* Sync Status Banner */}
      <View
        className="p-4 rounded border mb-6"
        style={{
          backgroundColor: tokens.color.bg.secondary,
          borderColor: tokens.color.border.subtle,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="body" weight="medium">
            Status
          </Text>
          <SyncStatusBadge
            status={status}
            progress={progress}
            lastSyncedAt={lastSyncedAt}
            onPress={handleSyncPress}
            tokens={tokens}
          />
        </View>

        {errorMessage ? (
          <View
            className="p-3 rounded mb-3"
            style={{
              backgroundColor: tokens.color.bg["status-error"],
              borderColor: tokens.color.border["status-error"],
              borderWidth: 1,
            }}
          >
            <Text variant="caption" style={{ color: tokens.color.text.error }}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          onPress={handleSyncPress}
          disabled={isBusy || status === "syncing" || !isAuthenticated}
        >
          {status === "syncing" ? "Syncing..." : "Sync Now"}
        </Button>
      </View>

      {/* Google Drive Connection */}
      <View
        className="p-4 rounded border mb-6"
        style={{
          backgroundColor: tokens.color.bg.secondary,
          borderColor: tokens.color.border.subtle,
        }}
      >
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

      {/* Local Peer-to-Peer Syncthing */}
      <MobileSyncthingPanel />

      {/* Conflicts section if detected */}
      {conflicts.length > 0 ? (
        <View
          className="p-4 rounded mb-6"
          style={{
            backgroundColor: tokens.color.bg["status-warning"],
            borderColor: tokens.color.border["status-warning"],
            borderWidth: 1,
          }}
        >
          <Text
            variant="body"
            weight="semibold"
            className="mb-2"
            style={{ color: tokens.color.text.warning }}
          >
            Conflicting Files ({conflicts.length})
          </Text>
          <Text variant="caption" className="mb-3" color="muted">
            These files were modified both locally and on another device. In
            accordance with zero-data-loss policy, they have been left
            untouched.
          </Text>

          {conflicts.map((c) => (
            <View
              key={c.path}
              className="py-2 border-b"
              style={{ borderBottomColor: tokens.color.border.subtle }}
            >
              <Text variant="caption" weight="medium">
                {c.path}
              </Text>
              <Text variant="caption" color="muted">
                {c.message}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Divider className="my-4" />

      {/* Policy information */}
      <View
        className="p-4 rounded border"
        style={{
          backgroundColor: tokens.color.bg.secondary,
          borderColor: tokens.color.border.subtle,
        }}
      >
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
