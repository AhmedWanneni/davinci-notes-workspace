import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { useTheme } from "../theme";
import { Button, Text } from "../components/primitives";
import type { MobileSyncEngine } from "./mobileSyncEngine";
import { useSyncStatus } from "./useSyncStatus";
import {
  MobileSyncthingPanel,
  mobileSyncthingDetect,
  mobileSyncthingTriggerScan,
  getSyncthingApiKey,
} from "./syncthing";

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
    conflicts,
    errorMessage,
    isAuthenticated,
    syncNow,
    connectDrive,
    disconnectDrive,
  } = useSyncStatus(engine);

  const [isBusy, setIsBusy] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSyncPress = async () => {
    setIsBusy(true);
    setFeedbackMessage(null);
    try {
      let didSync = false;

      if (isAuthenticated && engine) {
        await syncNow();
        didSync = true;
      }
      try {
        const detect = await mobileSyncthingDetect();
        if (detect.running) {
          const key = (await getSyncthingApiKey()) || "";
          await mobileSyncthingTriggerScan(key);
          didSync = true;
        }
      } catch {
        /* Syncthing scan error handled gracefully */
      }
      if (!didSync && !isAuthenticated) {
        setFeedbackMessage(
          "Connect Google Drive or start Syncthing below to sync notes.",
        );
      }
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
      className="flex-1 py-2"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      {/* Error or Feedback Banners */}
      {errorMessage ? (
        <View
          className="p-2.5 rounded mb-3"
          style={{
            backgroundColor: tokens.color.bg["status-error"],
          }}
        >
          <Text variant="caption" style={{ color: tokens.color.text.error }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {feedbackMessage ? (
        <View
          className="p-2.5 rounded mb-3"
          style={{ backgroundColor: tokens.color.bg["status-warning"] }}
        >
          <Text variant="caption" style={{ color: tokens.color.text.warning }}>
            {feedbackMessage}
          </Text>
        </View>
      ) : null}

      {/* Google Drive Account & Sync Action */}
      <View className="mb-6 pb-2">
        <Text variant="body" weight="medium" className="mb-1">
          Google Drive Account
        </Text>
        <Text variant="caption" color="muted" className="mb-3">
          Uses non-sensitive scopes (drive.file & drive.appdata) to store
          encrypted manifests and file blocks.
        </Text>

        {isAuthenticated ? (
          <View style={{ gap: 8 }}>
            <Button
              variant="primary"
              onPress={handleSyncPress}
              disabled={isBusy || status === "syncing"}
            >
              {status === "syncing" || isBusy ? "Syncing..." : "Sync Now"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleAuthPress}
              disabled={isBusy}
            >
              Disconnect Drive
            </Button>
          </View>
        ) : (
          <Button
            variant="primary"
            onPress={handleAuthPress}
            disabled={isBusy}
          >
            Connect with Google Drive
          </Button>
        )}
      </View>

      {/* Local Peer-to-Peer Syncthing */}
      <MobileSyncthingPanel />

      {/* Conflicts section if detected */}
      {conflicts.length > 0 ? (
        <View
          className="p-3 rounded mb-6"
          style={{
            backgroundColor: tokens.color.bg["status-warning"],
          }}
        >
          <Text
            variant="body"
            weight="semibold"
            className="mb-1"
            style={{ color: tokens.color.text.warning }}
          >
            Conflicting Files ({conflicts.length})
          </Text>
          <Text variant="caption" className="mb-2" color="muted">
            These files were modified both locally and on another device.
          </Text>

          {conflicts.map((c) => (
            <View
              key={c.path}
              className="py-1.5 border-b"
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

      {/* Policy information */}
      <View className="mb-6 pt-2">
        <Text variant="caption" weight="medium" className="mb-1">
          Data & Battery Policies
        </Text>
        <Text variant="caption" color="muted">
          • Auto-sync pauses heavy binary attachments on cellular networks.
          {"\n"}• Auto-sync pauses automatically when battery is below 20%.
          {"\n"}• Manual "Sync Now" always operates without restrictions.
        </Text>
      </View>
    </ScrollView>
  );
};
