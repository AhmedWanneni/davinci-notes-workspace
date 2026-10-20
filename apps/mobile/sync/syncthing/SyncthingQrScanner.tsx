import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTheme } from "../../theme";
import { Button, Text } from "../../components/primitives";

export interface SyncthingQrScannerProps {
  onScan: (rawText: string) => void;
  onCancel: () => void;
}

export const SyncthingQrScanner: React.FC<SyncthingQrScannerProps> = ({
  onScan,
  onCancel,
}) => {
  const { tokens } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Request permission only when the scanner opens
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  if (!permission) {
    return (
      <View className="h-[260px] items-center justify-center p-4">
        <ActivityIndicator
          size="small"
          color={tokens.color.interactive.accent}
        />
        <Text size="xs" color="muted" className="mt-2">
          Initializing camera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        className="p-4 items-center justify-center rounded-lg border my-2"
        style={{
          backgroundColor: tokens.color.bg.primary,
          borderColor: tokens.color.border.normal,
        }}
      >
        <Text
          size="sm"
          color="normal"
          weight="semibold"
          className="mb-1 text-center"
        >
          Camera Permission Required
        </Text>
        <Text size="xs" color="muted" className="text-center mb-3">
          Camera access is needed to scan desktop Syncthing QR codes. You can
          also paste the Device ID manually.
        </Text>
        <View className="flex-row gap-2">
          <Button variant="secondary" size="sm" onPress={onCancel}>
            Use Paste Flow
          </Button>
          <Button
            variant="primary"
            size="sm"
            onPress={() => requestPermission()}
          >
            Grant Permission
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View
      className="overflow-hidden rounded-lg border my-2 bg-black"
      style={{
        borderColor: tokens.color.border.normal,
      }}
    >
      <View className="h-[240px] w-full relative">
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={(result) => {
            if (scanned || !result.data) return;
            setScanned(true);
            onScan(result.data);
          }}
        />

        {/* Viewfinder crosshairs */}
        <View className="absolute inset-0 items-center justify-center pointer-events-none">
          <View
            className="w-[160px] h-[160px] rounded-md opacity-75"
            style={{
              borderColor: tokens.color.interactive.accent,
              borderWidth: 2,
            }}
          />
        </View>
      </View>

      <View
        className="p-2 flex-row justify-between items-center border-t"
        style={{
          backgroundColor: tokens.color.bg.secondary,
          borderTopColor: tokens.color.border.subtle,
        }}
      >
        <Text size="xs" color="muted">
          Align QR code within frame
        </Text>
        <Button variant="ghost" size="sm" onPress={onCancel}>
          Cancel
        </Button>
      </View>
    </View>
  );
};

SyncthingQrScanner.displayName = "SyncthingQrScanner";
export default SyncthingQrScanner;
