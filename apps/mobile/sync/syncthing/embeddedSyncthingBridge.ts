import {
  isEmbeddedSyncthingSupported,
  startEmbeddedSyncthing,
  stopEmbeddedSyncthing,
  getEmbeddedSyncthingStatus,
  getEmbeddedDeviceId,
  getEmbeddedQrDataUri,
  embeddedSyncthingRequest,
  setEmbeddedSyncthingConditions,
  isBatteryOptimizationIgnored,
  requestBatteryOptimizationExemption,
  type SyncthingStatusResult as EmbeddedStatus,
} from "expo-syncthing";

export interface EmbeddedSyncthingState {
  isEmbedded: boolean;
  status: "running" | "not-running" | "starting" | "crashed" | "unsupported";
  deviceId: string;
  port: number;
  errorMessage?: string;
}

export class EmbeddedSyncthingBridge {
  static isAvailable(): boolean {
    return isEmbeddedSyncthingSupported();
  }

  static async start(): Promise<EmbeddedStatus> {
    return await startEmbeddedSyncthing();
  }

  static async stop(): Promise<void> {
    await stopEmbeddedSyncthing();
  }

  static async getStatus(): Promise<EmbeddedStatus> {
    return await getEmbeddedSyncthingStatus();
  }

  static async getDeviceId(): Promise<string> {
    return await getEmbeddedDeviceId();
  }

  static async getQrDataUri(text: string): Promise<string> {
    return await getEmbeddedQrDataUri(text);
  }

  static async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const raw = await embeddedSyncthingRequest(method, path, body);
    if (!raw) return {} as T;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  static async configureConditions(
    wifiOnly: boolean,
    chargingOnly: boolean,
    background: boolean,
  ): Promise<void> {
    await setEmbeddedSyncthingConditions(wifiOnly, chargingOnly, background);
  }

  static async checkBatteryOptimization(): Promise<boolean> {
    return await isBatteryOptimizationIgnored();
  }

  static async requestBatteryExemption(): Promise<boolean> {
    return await requestBatteryOptimizationExemption();
  }
}
