import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Badge, Button, Input, Text } from "../../components/primitives";

export interface ScanToSyncSetupGuideProps {
  status: "not-running" | "missing-key" | "invalid-key";
  onSaveKey: (key: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onCancel: () => void;
}

export const ScanToSyncSetupGuide: React.FC<ScanToSyncSetupGuideProps> = ({
  status,
  onSaveKey,
  onRefresh,
  onCancel,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setApiKey(text.trim());
      setErrorMsg(null);
    }
  };

  const handleSave = async () => {
    const clean = apiKey.trim();
    if (!clean) return;
    setIsBusy(true);
    setErrorMsg(null);
    try {
      await onSaveKey(clean);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to verify API key.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefresh = async () => {
    setIsBusy(true);
    setErrorMsg(null);
    try {
      await onRefresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Syncthing still unreachable.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text variant="h3" color="normal">
          Syncthing Setup Required
        </Text>
        <Badge variant="warning">
          {status === "not-running" ? "Not Running" : "API Key Required"}
        </Badge>
      </View>

      {errorMsg ? (
        <View className="p-2.5 rounded bg-bg-status-error border border-border-status-error mb-3">
          <Text size="xs" color="error">
            {errorMsg}
          </Text>
        </View>
      ) : null}

      {status === "not-running" ? (
        <View className="mb-4">
          <Text size="xs" color="normal" className="mb-2 leading-relaxed">
            DaVinci Notes syncs directly via the local Syncthing service on this phone,
            requiring no external servers.
          </Text>
          <View className="p-3 rounded border border-border-subtle bg-bg-base mb-3">
            <Text size="xs" color="muted" className="leading-relaxed">
              1. Open or install Syncthing-Fork (or official Syncthing).{"\n"}
              2. Ensure the background service is started and active.{"\n"}
              3. Return here and tap "Check Again".
            </Text>
          </View>
          <Button
            variant="primary"
            size="sm"
            onPress={handleRefresh}
            disabled={isBusy}
            className="mb-2"
          >
            {isBusy ? "Checking..." : "Check Again"}
          </Button>
        </View>
      ) : (
        <View className="mb-4">
          {/* Flagging the API key paste as the one-time friction */}
          <View className="p-3 rounded border border-accent-warning/30 bg-accent-warning/10 mb-3">
            <Text size="xs" color="normal" weight="semibold" className="mb-1">
              One-Time Setup Friction
            </Text>
            <Text size="xs" color="muted" className="leading-relaxed">
              Copying the API key is a one-time step. It grants DaVinci Notes secure,
              isolated access to communicate with your local Syncthing instance.
            </Text>
          </View>

          <Text size="xs" color="muted" className="mb-2 leading-relaxed">
            In Syncthing-Fork: tap Settings → Web GUI → API Key, copy the key, and paste below:
          </Text>

          <View className="flex-row gap-2 mb-3">
            <Input
              value={apiKey}
              onChangeText={(t) => {
                setApiKey(t);
                setErrorMsg(null);
              }}
              placeholder="Paste Syncthing API key..."
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 font-mono text-xs"
            />
            <Button variant="secondary" size="sm" onPress={handlePaste}>
              Paste
            </Button>
          </View>

          <Button
            variant="primary"
            size="sm"
            onPress={handleSave}
            disabled={!apiKey.trim() || isBusy}
            className="mb-2"
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={darkColorTokens.text.normal} />
            ) : (
              "Save Key & Continue to Scan"
            )}
          </Button>
        </View>
      )}

      <Button variant="ghost" size="sm" onPress={onCancel} disabled={isBusy}>
        Cancel
      </Button>
    </View>
  );
};

ScanToSyncSetupGuide.displayName = "ScanToSyncSetupGuide";
export default ScanToSyncSetupGuide;
