import React from "react";
import { View, ActivityIndicator } from "react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Badge, Button, Text } from "../../components/primitives";

export type ScanToSyncStage =
  | "connecting"
  | "waiting_desktop"
  | "syncing"
  | "completed"
  | "error";

export interface ScanToSyncProgressViewProps {
  stage: ScanToSyncStage;
  progressPercent: number;
  pairingCode: string;
  desktopName: string;
  errorMessage?: string | null;
  onRetry: () => void;
  onDone: () => void;
  onCancel: () => void;
}

export const ScanToSyncProgressView: React.FC<ScanToSyncProgressViewProps> = ({
  stage,
  progressPercent,
  pairingCode,
  desktopName,
  errorMessage,
  onRetry,
  onDone,
  onCancel,
}) => {
  const isBusy = stage === "connecting" || stage === "waiting_desktop" || stage === "syncing";

  return (
    <View className="p-4">
      {/* Stage Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text variant="h3" color="normal">
          {stage === "completed"
            ? "Pairing Complete"
            : stage === "error"
              ? "Sync Error"
              : "Syncing with Desktop"}
        </Text>
        <Badge
          variant={
            stage === "completed"
              ? "success"
              : stage === "error"
                ? "error"
                : "accent"
          }
        >
          {stage === "connecting"
            ? "Connecting"
            : stage === "waiting_desktop"
              ? "Waiting Desktop"
              : stage === "syncing"
                ? `${progressPercent}%`
                : stage === "completed"
                  ? "Up to Date"
                  : "Failed"}
        </Badge>
      </View>

      {/* Step Indicators */}
      <View className="p-3 rounded border border-border-subtle bg-bg-base mb-4">
        {/* Step 1: Connecting */}
        <View className="flex-row items-center gap-3 mb-3">
          <Text size="sm">
            {stage === "connecting"
              ? "⏳"
              : "✓"}
          </Text>
          <View className="flex-1">
            <Text size="xs" color="normal" weight="medium">
              1. Add Desktop Device
            </Text>
            <Text size="xs" color="muted">
              {stage === "connecting"
                ? "Registering desktop and verification code..."
                : "Desktop device registered"}
            </Text>
          </View>
        </View>

        {/* Step 2: Desktop Acceptance */}
        <View className="flex-row items-center gap-3 mb-3">
          <Text size="sm">
            {stage === "connecting"
              ? "○"
              : stage === "waiting_desktop"
                ? "⏳"
                : "✓"}
          </Text>
          <View className="flex-1">
            <Text size="xs" color="normal" weight="medium">
              2. Accept on Desktop
            </Text>
            <Text size="xs" color="muted">
              {stage === "waiting_desktop"
                ? `Waiting for ${desktopName || "Desktop"} to accept code ${pairingCode}...`
                : stage === "connecting"
                  ? "Waiting for connection..."
                  : "Pairing accepted on desktop"}
            </Text>
          </View>
        </View>

        {/* Step 3: Vault Sync */}
        <View className="flex-row items-center gap-3">
          <Text size="sm">
            {stage === "completed"
              ? "✓"
              : stage === "syncing"
                ? "⏳"
                : "○"}
          </Text>
          <View className="flex-1">
            <Text size="xs" color="normal" weight="medium">
              3. Sync Vault Notes
            </Text>
            <Text size="xs" color="muted">
              {stage === "syncing"
                ? `Syncing files... (${progressPercent}%)`
                : stage === "completed"
                  ? "All notes synchronized and up to date"
                  : "Pending folder acceptance"}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar during syncing */}
      {stage === "syncing" ? (
        <View className="mb-4">
          <View className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden border border-border-subtle">
            <View
              className="h-full bg-accent-primary"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </View>
          <Text size="xs" color="muted" className="text-right mt-1">
            {progressPercent}% completed
          </Text>
        </View>
      ) : null}

      {/* Error display */}
      {stage === "error" && errorMessage ? (
        <View className="p-3 rounded bg-bg-status-error border border-border-status-error mb-4">
          <Text size="xs" color="error" weight="medium" className="mb-1">
            Pairing Unsuccessful
          </Text>
          <Text size="xs" color="error" className="leading-relaxed">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Active spinner */}
      {isBusy ? (
        <View className="items-center justify-center py-2 mb-2">
          <ActivityIndicator size="small" color={darkColorTokens.text.accent} />
          <Text size="xs" color="muted" className="mt-2 text-center">
            {stage === "waiting_desktop"
              ? `Check ${desktopName || "Desktop"} screen to confirm pairing request.`
              : "Synchronizing data..."}
          </Text>
        </View>
      ) : null}

      {/* Bottom action buttons */}
      {stage === "completed" ? (
        <Button variant="primary" size="sm" onPress={onDone} className="w-full">
          Done & Open Notes
        </Button>
      ) : stage === "error" ? (
        <View className="flex-row gap-2">
          <Button variant="secondary" size="sm" onPress={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onPress={onRetry} className="flex-1">
            Retry
          </Button>
        </View>
      ) : (
        <Button variant="ghost" size="sm" onPress={onCancel} className="w-full">
          Cancel
        </Button>
      )}
    </View>
  );
};

ScanToSyncProgressView.displayName = "ScanToSyncProgressView";
export default ScanToSyncProgressView;
