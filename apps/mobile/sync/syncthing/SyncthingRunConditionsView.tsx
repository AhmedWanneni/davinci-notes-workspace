import React, { useEffect, useState } from "react";
import { View, Switch } from "react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Button, Text } from "../../components/primitives";
import { EmbeddedSyncthingBridge } from "./embeddedSyncthingBridge";

export const SyncthingRunConditionsView: React.FC = () => {
  const [wifiOnly, setWifiOnly] = useState(false);
  const [chargingOnly, setChargingOnly] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [isBatteryIgnored, setIsBatteryIgnored] = useState(false);
  const [isRequestingBattery, setIsRequestingBattery] = useState(false);

  useEffect(() => {
    void EmbeddedSyncthingBridge.checkBatteryOptimization().then((ignored) => {
      setIsBatteryIgnored(ignored);
    });
  }, []);

  const handleToggleConditions = async (
    newWifi: boolean,
    newCharging: boolean,
    newBackground: boolean,
  ) => {
    setWifiOnly(newWifi);
    setChargingOnly(newCharging);
    setBackgroundSync(newBackground);
    await EmbeddedSyncthingBridge.configureConditions(
      newWifi,
      newCharging,
      newBackground,
    );
  };

  const handleRequestBattery = async () => {
    setIsRequestingBattery(true);
    try {
      await EmbeddedSyncthingBridge.requestBatteryExemption();
      const updated = await EmbeddedSyncthingBridge.checkBatteryOptimization();
      setIsBatteryIgnored(updated);
    } finally {
      setIsRequestingBattery(false);
    }
  };

  return (
    <View className="mt-3 p-3 rounded border border-border-subtle bg-bg-base">
      <Text size="xs" color="normal" weight="semibold" className="mb-2">
        Sync Conditions & Background Behavior
      </Text>

      {/* Wi-Fi only */}
      <View className="flex-row items-center justify-between py-1.5 border-b border-border-subtle">
        <View className="flex-1 mr-2">
          <Text size="xs" color="normal">
            Wi-Fi Only
          </Text>
          <Text size="xs" color="muted">
            Pause sync on metered cellular data
          </Text>
        </View>
        <Switch
          value={wifiOnly}
          onValueChange={(val) =>
            void handleToggleConditions(val, chargingOnly, backgroundSync)
          }
          trackColor={{
            false: darkColorTokens.border.subtle,
            true: darkColorTokens.text.accent,
          }}
          thumbColor={darkColorTokens.text.normal}
        />
      </View>

      {/* Charging only */}
      <View className="flex-row items-center justify-between py-1.5 border-b border-border-subtle">
        <View className="flex-1 mr-2">
          <Text size="xs" color="normal">
            Only While Charging
          </Text>
          <Text size="xs" color="muted">
            Preserve battery life on the move
          </Text>
        </View>
        <Switch
          value={chargingOnly}
          onValueChange={(val) =>
            void handleToggleConditions(wifiOnly, val, backgroundSync)
          }
          trackColor={{
            false: darkColorTokens.border.subtle,
            true: darkColorTokens.text.accent,
          }}
          thumbColor={darkColorTokens.text.normal}
        />
      </View>

      {/* Sync in background */}
      <View className="flex-row items-center justify-between py-1.5 border-b border-border-subtle">
        <View className="flex-1 mr-2">
          <Text size="xs" color="normal">
            Sync in Background
          </Text>
          <Text size="xs" color="muted">
            Keep notes updated when app is closed
          </Text>
        </View>
        <Switch
          value={backgroundSync}
          onValueChange={(val) =>
            void handleToggleConditions(wifiOnly, chargingOnly, val)
          }
          trackColor={{
            false: darkColorTokens.border.subtle,
            true: darkColorTokens.text.accent,
          }}
          thumbColor={darkColorTokens.text.normal}
        />
      </View>

      {/* Battery Optimization */}
      <View className="pt-2">
        <View className="flex-row items-center justify-between mb-1">
          <Text size="xs" color="normal">
            Battery Optimization
          </Text>
          <Text
            size="xs"
            color={isBatteryIgnored ? "normal" : "warning"}
            weight="medium"
          >
            {isBatteryIgnored ? "Exempted" : "Optimized"}
          </Text>
        </View>
        <Text size="xs" color="muted" className="mb-2 leading-relaxed">
          {isBatteryIgnored
            ? "Sync service can run continuously without Android suspending it."
            : "Android may pause background sync when locked to save power."}
        </Text>
        {!isBatteryIgnored ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={handleRequestBattery}
            disabled={isRequestingBattery}
          >
            {isRequestingBattery
              ? "Checking..."
              : "Allow Background Activity"}
          </Button>
        ) : null}
      </View>
    </View>
  );
};

SyncthingRunConditionsView.displayName = "SyncthingRunConditionsView";
