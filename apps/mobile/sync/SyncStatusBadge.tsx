import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "../components/primitives/Text";
import type { SyncProgress, SyncStatus } from "./types";

export interface SyncStatusBadgeProps {
  status: SyncStatus;
  progress?: SyncProgress;
  lastSyncedAt?: number | null;
  pendingChangesCount?: number;
  onPress?: () => void;
}

function formatRelativeTime(timestamp?: number | null): string {
  if (!timestamp) return "Never synced";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Synced just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Synced ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `Synced ${diffHr}h ago`;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  progress,
  lastSyncedAt,
  pendingChangesCount = 0,
  onPress,
}) => {
  let label = formatRelativeTime(lastSyncedAt);
  let dotColorClass = "bg-accent-success";

  switch (status) {
    case "syncing": {
      const current = progress?.current ?? 0;
      const total = progress?.total ?? 0;
      label = total > 0 ? `Syncing ${current}/${total}...` : "Syncing...";
      dotColorClass = "bg-primary-400";
      break;
    }
    case "conflict": {
      label = "Conflicts detected (untouched)";
      dotColorClass = "bg-accent-warning";
      break;
    }
    case "paused-low-battery": {
      label = "Sync paused (low battery)";
      dotColorClass = "bg-accent-warning";
      break;
    }
    case "paused-metered": {
      label = "Sync paused (metered network)";
      dotColorClass = "bg-accent-warning";
      break;
    }
    case "interrupted": {
      label = "Sync interrupted — tap to resume";
      dotColorClass = "bg-accent-warning";
      break;
    }
    case "error": {
      label = "Sync error — tap to retry";
      dotColorClass = "bg-accent-danger";
      break;
    }
    case "reauth-required": {
      label = "Drive sign-in required";
      dotColorClass = "bg-accent-danger";
      break;
    }
    case "idle":
    default: {
      if (pendingChangesCount > 0) {
        label = `${pendingChangesCount} pending ${pendingChangesCount === 1 ? "change" : "changes"}`;
        dotColorClass = "bg-accent-warning";
      } else {
        label = formatRelativeTime(lastSyncedAt);
        dotColorClass = lastSyncedAt ? "bg-accent-success" : "bg-primary-500";
      }
      break;
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center px-2 py-1 rounded bg-bg-surface border border-border-default"
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${label}`}
    >
      <View className={`w-2 h-2 rounded-full mr-2 ${dotColorClass}`} />
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </TouchableOpacity>
  );
};
