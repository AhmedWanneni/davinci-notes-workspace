import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EmbeddedSyncthingBridge,
} from "./embeddedSyncthingBridge";
import {
  mobileSyncthingDetect,
  mobileSyncthingStatus,
  mobileSyncthingFetch,
} from "./mobileSyncthingClient";
import * as expoSyncthingModule from "expo-syncthing";

describe("EmbeddedSyncthingBridge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reports availability based on platform support", () => {
    vi.spyOn(expoSyncthingModule, "isEmbeddedSyncthingSupported").mockReturnValue(true);
    expect(EmbeddedSyncthingBridge.isAvailable()).toBe(true);

    vi.spyOn(expoSyncthingModule, "isEmbeddedSyncthingSupported").mockReturnValue(false);
    expect(EmbeddedSyncthingBridge.isAvailable()).toBe(false);
  });

  it("starts the embedded daemon via native module", async () => {
    const mockStart = vi.spyOn(expoSyncthingModule, "startEmbeddedSyncthing").mockResolvedValue({
      status: "running",
      port: 23456,
      deviceId: "ABCDEF1-2345678-ABCDEF1-2345678-ABCDEF1-2345678-ABCDEF1-2345678",
    });

    const res = await EmbeddedSyncthingBridge.start();
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("running");
    expect(res.port).toBe(23456);
  });

  it("stops the daemon via native module", async () => {
    const mockStop = vi.spyOn(expoSyncthingModule, "stopEmbeddedSyncthing").mockResolvedValue(undefined);
    await EmbeddedSyncthingBridge.stop();
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("queries daemon status and device ID", async () => {
    vi.spyOn(expoSyncthingModule, "getEmbeddedSyncthingStatus").mockResolvedValue({
      status: "running",
      port: 19876,
      deviceId: "DEV-ID-123",
    });
    vi.spyOn(expoSyncthingModule, "getEmbeddedDeviceId").mockResolvedValue("DEV-ID-123");

    const stat = await EmbeddedSyncthingBridge.getStatus();
    expect(stat.status).toBe("running");
    expect(stat.port).toBe(19876);

    const devId = await EmbeddedSyncthingBridge.getDeviceId();
    expect(devId).toBe("DEV-ID-123");
  });

  it("proxies REST requests through native allowlist without exposing keys", async () => {
    const mockReq = vi
      .spyOn(expoSyncthingModule, "embeddedSyncthingRequest")
      .mockResolvedValue(JSON.stringify({ myID: "DEV-123", uptime: 42 }));

    const data = await EmbeddedSyncthingBridge.request<{ myID: string; uptime: number }>(
      "GET",
      "/rest/system/status",
    );

    expect(mockReq).toHaveBeenCalledWith("GET", "/rest/system/status", undefined);
    expect(data.myID).toBe("DEV-123");
    expect(data.uptime).toBe(42);
  });

  it("handles run condition updates and battery optimization checks", async () => {
    const mockConds = vi
      .spyOn(expoSyncthingModule, "setEmbeddedSyncthingConditions")
      .mockResolvedValue(undefined);
    const mockCheckBattery = vi
      .spyOn(expoSyncthingModule, "isBatteryOptimizationIgnored")
      .mockResolvedValue(true);
    const mockReqBattery = vi
      .spyOn(expoSyncthingModule, "requestBatteryOptimizationExemption")
      .mockResolvedValue(true);

    await EmbeddedSyncthingBridge.configureConditions(true, false, true);
    expect(mockConds).toHaveBeenCalledWith(true, false, true);

    const isIgnored = await EmbeddedSyncthingBridge.checkBatteryOptimization();
    expect(mockCheckBattery).toHaveBeenCalledTimes(1);
    expect(isIgnored).toBe(true);

    const reqSuccess = await EmbeddedSyncthingBridge.requestBatteryExemption();
    expect(mockReqBattery).toHaveBeenCalledTimes(1);
    expect(reqSuccess).toBe(true);
  });
});

describe("Embedded Mobile Syncthing Client Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("mobileSyncthingDetect uses embedded status when available", async () => {
    vi.spyOn(EmbeddedSyncthingBridge, "isAvailable").mockReturnValue(true);
    vi.spyOn(EmbeddedSyncthingBridge, "getStatus").mockResolvedValue({
      status: "running",
      port: 33445,
      deviceId: "DEV-ABC",
    });

    const res = await mobileSyncthingDetect();
    expect(res.running).toBe(true);
    expect(res.guiAddress).toBe("127.0.0.1:33445");
  });

  it("mobileSyncthingStatus fetches from embedded proxy without requiring external key", async () => {
    vi.spyOn(EmbeddedSyncthingBridge, "isAvailable").mockReturnValue(true);
    vi.spyOn(EmbeddedSyncthingBridge, "getDeviceId").mockResolvedValue("EMBEDDED-DEVICE-ID");
    vi.spyOn(EmbeddedSyncthingBridge, "request").mockResolvedValue(
      JSON.stringify({ myID: "EMBEDDED-DEVICE-ID", urVersion: "Mobile", uptime: 100 }),
    );

    // Call with empty key
    const stat = await mobileSyncthingStatus("");
    expect(stat.deviceId).toBe("EMBEDDED-DEVICE-ID");
    expect(stat.deviceName).toBe("Mobile");
    expect(stat.uptime).toBe(100);
  });

  it("mobileSyncthingFetch routes via embedded bridge without HTTP cleartext config", async () => {
    vi.spyOn(EmbeddedSyncthingBridge, "isAvailable").mockReturnValue(true);
    const mockRequest = vi.spyOn(EmbeddedSyncthingBridge, "request").mockResolvedValue(
      JSON.stringify([{ folderId: "vault-1", label: "My Notes" }]),
    );

    const res = await mobileSyncthingFetch("", "/rest/cluster/pending/folders");
    expect(res.ok).toBe(true);
    expect(mockRequest).toHaveBeenCalledWith("GET", "/rest/cluster/pending/folders", undefined);
    const body = await res.json();
    expect(body).toEqual([{ folderId: "vault-1", label: "My Notes" }]);
  });
});
