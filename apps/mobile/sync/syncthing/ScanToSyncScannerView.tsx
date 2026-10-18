import React, { Suspense, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  validatePairingInput,
  type SyncthingPairingPayload,
} from "@app/syncthing-api";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Button, Input, Text } from "../../components/primitives";

const LazyScanner = React.lazy(() => import("./SyncthingQrScanner"));

export interface ScanToSyncScannerViewProps {
  onSuccess: (payload: SyncthingPairingPayload, type: "pairing" | "raw_device") => void;
  onCancel: () => void;
}

export const ScanToSyncScannerView: React.FC<ScanToSyncScannerViewProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [tab, setTab] = useState<"camera" | "paste">("camera");
  const [pastedText, setPastedText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessInput = (raw: string) => {
    setErrorMsg(null);
    const result = validatePairingInput(raw);
    if (!result.valid) {
      setErrorMsg(result.error);
      return;
    }
    onSuccess(result.payload, result.type);
  };

  const handlePasteClipboard = async () => {
    setErrorMsg(null);
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPastedText(text.trim());
      handleProcessInput(text.trim());
    }
  };

  return (
    <View className="p-4">
      {/* Tab selection */}
      <View className="flex-row mb-3 p-0.5 rounded border border-border-subtle bg-bg-base">
        <Button
          variant={tab === "camera" ? "primary" : "ghost"}
          size="sm"
          onPress={() => {
            setTab("camera");
            setErrorMsg(null);
          }}
          className="flex-1"
        >
          Scan QR
        </Button>
        <Button
          variant={tab === "paste" ? "primary" : "ghost"}
          size="sm"
          onPress={() => {
            setTab("paste");
            setErrorMsg(null);
          }}
          className="flex-1"
        >
          Paste Code / ID
        </Button>
      </View>

      {errorMsg ? (
        <View className="p-2.5 rounded bg-bg-status-error border border-border-status-error mb-3">
          <Text size="xs" color="error">
            {errorMsg}
          </Text>
        </View>
      ) : null}

      {tab === "camera" ? (
        <Suspense
          fallback={
            <View className="h-[240px] items-center justify-center">
              <ActivityIndicator
                size="small"
                color={darkColorTokens.text.accent}
              />
              <Text size="xs" color="muted" className="mt-2">
                Loading camera...
              </Text>
            </View>
          }
        >
          <LazyScanner
            onScan={handleProcessInput}
            onCancel={() => setTab("paste")}
          />
        </Suspense>
      ) : (
        <View className="mb-2">
          <Text size="xs" color="muted" className="mb-1">
            Paste pairing link (davincinotes://pair?d=...) or 56-char Device ID:
          </Text>
          <View className="flex-row gap-2 mb-3">
            <Input
              value={pastedText}
              onChangeText={(t) => {
                setPastedText(t);
                setErrorMsg(null);
              }}
              placeholder="Paste code or device ID..."
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 font-mono text-xs"
            />
            <Button
              variant="secondary"
              size="sm"
              onPress={handlePasteClipboard}
            >
              Paste
            </Button>
          </View>

          <Button
            variant="primary"
            size="sm"
            onPress={() => handleProcessInput(pastedText)}
            disabled={!pastedText.trim()}
            className="mb-2"
          >
            Verify & Continue
          </Button>
        </View>
      )}

      <Button variant="ghost" size="sm" onPress={onCancel}>
        Cancel
      </Button>
    </View>
  );
};

ScanToSyncScannerView.displayName = "ScanToSyncScannerView";
export default ScanToSyncScannerView;
