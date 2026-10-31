import { ExpoSyncthingNative } from "./src/ExpoSyncthingModule";
import type { SyncthingStatusResult } from "./src/ExpoSyncthing.types";

export * from "./src/ExpoSyncthing.types";

export const isEmbeddedSyncthingSupported = (): boolean => {
  return ExpoSyncthingNative !== null;
};

export async function startEmbeddedSyncthing(): Promise<SyncthingStatusResult> {
  if (!ExpoSyncthingNative) {
    return {
      status: "stopped",
      port: 0,
      deviceId: "",
      reason: "Embedded Syncthing is not available on this platform",
    };
  }
  return await ExpoSyncthingNative.start();
}

export async function stopEmbeddedSyncthing(): Promise<void> {
  if (!ExpoSyncthingNative) return;
  await ExpoSyncthingNative.stop();
}

export async function getEmbeddedSyncthingStatus(): Promise<SyncthingStatusResult> {
  if (!ExpoSyncthingNative) {
    return {
      status: "stopped",
      port: 0,
      deviceId: "",
      reason: "Embedded Syncthing not supported",
    };
  }
  return await ExpoSyncthingNative.status();
}

export async function getEmbeddedDeviceId(): Promise<string> {
  if (!ExpoSyncthingNative) return "";
  return await ExpoSyncthingNative.getDeviceId();
}

export async function getEmbeddedApiKey(): Promise<string> {
  if (!ExpoSyncthingNative || !ExpoSyncthingNative.getApiKey) return "";
  return await ExpoSyncthingNative.getApiKey();
}

export async function getEmbeddedGuiAddress(): Promise<string> {
  if (!ExpoSyncthingNative || !ExpoSyncthingNative.getGuiAddress) return "";
  return await ExpoSyncthingNative.getGuiAddress();
}

export async function getEmbeddedQrDataUri(text: string): Promise<string> {
  if (!ExpoSyncthingNative) return "";
  return await ExpoSyncthingNative.getQrDataUri(text);
}

export async function embeddedSyncthingRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<string> {
  if (!ExpoSyncthingNative) {
    throw new Error("Embedded Syncthing is not supported on this platform");
  }
  const bodyStr =
    typeof body === "string" ? body : body ? JSON.stringify(body) : null;
  return await ExpoSyncthingNative.request(method, path, bodyStr);
}

export async function setEmbeddedSyncthingConditions(
  wifiOnly: boolean,
  chargingOnly: boolean,
  background: boolean,
): Promise<void> {
  if (!ExpoSyncthingNative) return;
  await ExpoSyncthingNative.setRunConditions(
    wifiOnly,
    chargingOnly,
    background,
  );
}

export async function isBatteryOptimizationIgnored(): Promise<boolean> {
  if (!ExpoSyncthingNative) return true;
  return await ExpoSyncthingNative.isBatteryOptimizationIgnored();
}

export async function requestBatteryOptimizationExemption(): Promise<boolean> {
  if (!ExpoSyncthingNative) return false;
  return await ExpoSyncthingNative.requestBatteryOptimization();
}
