import { requireNativeModule } from "expo-modules-core";
import type { SyncthingStatusResult } from "./ExpoSyncthing.types";

interface NativeExpoSyncthing {
  start(): Promise<SyncthingStatusResult>;
  stop(): Promise<void>;
  status(): Promise<SyncthingStatusResult>;
  getDeviceId(): Promise<string>;
  getApiKey?(): Promise<string>;
  getGuiAddress?(): Promise<string>;
  getQrDataUri(text: string): Promise<string>;
  request(method: string, path: string, body?: string | null): Promise<string>;
  setRunConditions(
    wifiOnly: boolean,
    chargingOnly: boolean,
    background: boolean,
  ): Promise<void>;
  isBatteryOptimizationIgnored(): Promise<boolean>;
  requestBatteryOptimization(): Promise<boolean>;
  addListener(eventName: string, listener: (...args: unknown[]) => void): void;
  removeListeners(count: number): void;
}

let nativeModule: NativeExpoSyncthing | null = null;
try {
  nativeModule = requireNativeModule<NativeExpoSyncthing>("ExpoSyncthing");
} catch {
  // Graceful fallback when running in web or environment without native binary
  nativeModule = null;
}

export const ExpoSyncthingNative = nativeModule;
