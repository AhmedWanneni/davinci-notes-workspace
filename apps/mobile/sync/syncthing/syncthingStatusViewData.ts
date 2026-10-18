import type { SyncthingState } from "@app/syncthing-api";

export interface SyncthingStatusViewData {
  variant: "success" | "accent" | "error" | "warning" | "neutral";
  label: string;
  hint: string;
}

export function getSyncthingStatusViewData(
  status: SyncthingState | "loading" | "checking",
  connectedCount: number,
  version?: string,
): SyncthingStatusViewData {
  const isConnected = connectedCount > 0;

  if (status === "running") {
    return {
      variant: isConnected ? "success" : "accent",
      label: isConnected ? `Connected (${connectedCount})` : "Online",
      hint: isConnected
        ? `Connected to ${connectedCount} peer${connectedCount > 1 ? "s" : ""} on Syncthing ${version ? `(${version})` : ""}`
        : `Syncthing ${version ? `(${version})` : ""} online. Ready to sync notes.`,
    };
  }

  if (status === "bad-key") {
    return {
      variant: "error",
      label: "Key Problem",
      hint: "API key invalid or missing. Configure key in settings.",
    };
  }

  if (status === "not-installed") {
    return {
      variant: "warning",
      label: "Not Installed",
      hint: "Syncthing is not installed or native binary is missing.",
    };
  }

  if (status === "not-running") {
    return {
      variant: "warning",
      label: "Stopped",
      hint: "Syncthing is stopped. Tap Start to enable sync.",
    };
  }

  return {
    variant: "neutral",
    label: "Checking...",
    hint: "Checking Syncthing status...",
  };
}
