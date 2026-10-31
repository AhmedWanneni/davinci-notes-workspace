import React, { Suspense, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { formatDeviceIdGroups, parseScannedDeviceId } from "@app/syncthing-api";
import { useTheme } from "../../theme";
import { Sheet, Button, Input, Text } from "../../components/primitives";

const LazyScanner = React.lazy(() => import("./SyncthingQrScanner"));

export interface SyncthingAddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddDevice: (id: string, name: string) => Promise<void>;
}

export const SyncthingAddDeviceModal: React.FC<
  SyncthingAddDeviceModalProps
> = ({ visible, onClose, onAddDevice }) => {
  const { tokens } = useTheme();
  const [tab, setTab] = useState<"scan" | "paste">("scan");
  const [scannedId, setScannedId] = useState("");
  const [pastedId, setPastedId] = useState("");
  const [deviceName, setDeviceName] = useState("Desktop");
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const resetState = () => {
    setTab("scan");
    setScannedId("");
    setPastedId("");
    setDeviceName("Desktop");
    setAwaitingConfirm(false);
    setErrorMessage(null);
    setIsBusy(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const switchTab = (nextTab: "scan" | "paste") => {
    setTab(nextTab);
    setErrorMessage(null);
  };

  const handleScan = (rawText: string) => {
    setErrorMessage(null);
    const parsed = parseScannedDeviceId(rawText);
    if (!parsed.valid) {
      setErrorMessage(parsed.error || "Invalid Syncthing Device ID.");
      return;
    }
    if (parsed.deviceName) setDeviceName(parsed.deviceName);
    setScannedId(parsed.deviceId);
    setAwaitingConfirm(true);
  };

  const handlePasteClipboard = async () => {
    setErrorMessage(null);
    const text = await Clipboard.getStringAsync();
    if (!text) return;
    const parsed = parseScannedDeviceId(text);
    if (!parsed.valid) {
      setErrorMessage(parsed.error || "Clipboard does not contain a valid Device ID.");
      return;
    }
    if (parsed.deviceName) setDeviceName(parsed.deviceName);
    setPastedId(parsed.deviceId);
  };

  const handleConfirmAdd = async () => {
    const targetId = awaitingConfirm ? scannedId : pastedId;
    const parsed = parseScannedDeviceId(targetId);
    if (!parsed.valid) {
      setErrorMessage(parsed.error || "Invalid Device ID format.");
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    try {
      await onAddDevice(parsed.deviceId, deviceName.trim() || "Desktop");
      handleClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  };

  const activeId = awaitingConfirm ? scannedId : pastedId;

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={awaitingConfirm ? "Confirm Device Pairing" : "Add Desktop Device"}
      className="p-4"
    >
      {errorMessage ? (
        <View className="p-2.5 rounded bg-bg-status-error border border-border-status-error mb-3">
          <Text size="xs" color="error">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {awaitingConfirm ? (
        <View className="mb-3">
          <Text size="xs" color="muted" className="mb-1">
            Scanned Device ID (confirm before adding):
          </Text>
          <View className="p-3 rounded border border-border-normal bg-bg-base mb-3">
            <Text size="xs" color="normal" className="font-mono">
              {formatDeviceIdGroups(activeId)}
            </Text>
          </View>

          <Text size="xs" color="muted" className="mb-1">
            Device Name:
          </Text>
          <Input
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g. MacBook Pro"
            className="mb-4"
          />

          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setAwaitingConfirm(false)}
              disabled={isBusy}
              className="flex-1"
            >
              Scan Again
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={handleConfirmAdd}
              disabled={isBusy}
              className="flex-1"
            >
              {isBusy ? "Adding..." : "Confirm & Pair"}
            </Button>
          </View>
        </View>
      ) : (
        <View>
          {/* Segmented Tab controls */}
          <View className="flex-row mb-3 p-0.5 rounded border border-border-subtle bg-bg-base">
            <Button
              variant={tab === "scan" ? "primary" : "ghost"}
              size="sm"
              onPress={() => switchTab("scan")}
              className="flex-1"
            >
              Scan QR
            </Button>
            <Button
              variant={tab === "paste" ? "primary" : "ghost"}
              size="sm"
              onPress={() => switchTab("paste")}
              className="flex-1"
            >
              Paste ID
            </Button>
          </View>

          {tab === "scan" ? (
            <Suspense
              fallback={
                <View className="h-[240px] items-center justify-center">
                  <ActivityIndicator
                    size="small"
                    color={tokens.color.interactive.accent}
                  />
                  <Text size="xs" color="muted" className="mt-2">
                    Loading camera...
                  </Text>
                </View>
              }
            >
              <LazyScanner
                onScan={handleScan}
                onCancel={() => setTab("paste")}
              />
            </Suspense>
          ) : (
            <View className="mb-3">
              <Text size="xs" color="muted" className="mb-1">
                Paste 56-character Syncthing Device ID:
              </Text>
              <View className="flex-row gap-2 mb-3">
                <Input
                  value={pastedId}
                  onChangeText={setPastedId}
                  placeholder="Paste device ID..."
                  autoCapitalize="characters"
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

              <Text size="xs" color="muted" className="mb-1">
                Device Name:
              </Text>
              <Input
                value={deviceName}
                onChangeText={setDeviceName}
                placeholder="e.g. Desktop"
                className="mb-4"
              />

              <Button
                variant="primary"
                size="sm"
                onPress={handleConfirmAdd}
                disabled={!pastedId.trim() || isBusy}
              >
                {isBusy ? "Adding..." : "Add Device"}
              </Button>
            </View>
          )}
        </View>
      )}
    </Sheet>
  );
};

SyncthingAddDeviceModal.displayName = "SyncthingAddDeviceModal";
