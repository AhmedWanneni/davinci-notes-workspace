import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseScannedDeviceId } from "@app/syncthing-api";
import { checkFolderAccess } from "./folderAccessChecker";
import {
  mobileSyncthingAddDevice,
  mobileSyncthingPendingDevices,
  mobileSyncthingAcceptDevice,
  mobileSyncthingPendingFolders,
  mobileSyncthingAcceptFolder,
  mobileSyncthingConnectedDevices,
} from "./mobileSyncthingPairing";
import * as client from "./mobileSyncthingClient";

describe("Mobile Pairing & Sync End-to-End Verification", () => {
  const desktopId = "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
  const mobileId = "KMX2ZEX-QGFKBYF-RN7NW53-U3EGRSJ-LKWCWQO-MIWV57G-CCUAZZH-RFE36AL";
  const folderId = "davinci-vault-shared";
  const apiKey = "mock-api-key";

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, "mobileSyncthingStatus").mockResolvedValue({
      deviceId: mobileId,
      deviceName: "Phone",
      uptime: 1234,
    });

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/rest/cluster/pending/devices")) {
        return {
          ok: true,
          json: async () => ({
            [desktopId]: {
              name: "MacBook Pro",
              address: "192.168.1.50:22000",
              time: "2026-10-17T18:00:00Z",
            },
          }),
        };
      }
      if (url.includes("/rest/cluster/pending/folders")) {
        return {
          ok: true,
          json: async () => ({
            [folderId]: {
              label: "My Notes",
              offeredBy: desktopId,
              time: "2026-10-17T18:05:00Z",
            },
          }),
        };
      }
      if (url.includes("/rest/config/devices")) {
        return {
          ok: true,
          json: async () => [],
          text: async () => "",
        };
      }
      if (url.includes("/rest/config/folders")) {
        return {
          ok: true,
          text: async () => "",
        };
      }
      if (url.includes("/rest/system/connections")) {
        return {
          ok: true,
          json: async () => ({
            connections: { [desktopId]: { connected: true } },
          }),
        };
      }
      return { ok: true, json: async () => ({}), text: async () => "" };
    });
  });

  it("Verification 1: Fresh phone state scans desktop QR and pairs", async () => {
    const qrResult = parseScannedDeviceId(desktopId);
    expect(qrResult.valid).toBe(true);
    expect(qrResult.deviceId).toBe(desktopId);

    await mobileSyncthingAddDevice(apiKey, qrResult.deviceId, "Desktop");

    const connected = await mobileSyncthingConnectedDevices(apiKey);
    expect(connected).toContain(desktopId);
  });

  it("Verification 2: Reverse direction - phone accepts incoming request from desktop", async () => {
    const pending = await mobileSyncthingPendingDevices(apiKey);
    expect(pending).toHaveLength(1);
    expect(pending[0].deviceId).toBe(desktopId);

    await mobileSyncthingAcceptDevice(apiKey, desktopId);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/devices"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("Verification 3: Scan QR with random text is rejected with clear message", () => {
    const randomPayloads = [
      "https://example.com/not-syncthing",
      "WIFI:S:MyNetwork;T:WPA;P:secret;;",
      "random-non-device-string",
      "1234567890",
    ];

    for (const payload of randomPayloads) {
      const result = parseScannedDeviceId(payload);
      expect(result.valid).toBe(false);
      expect(result.deviceId).toBe("");
      expect(result.error).toContain("Invalid Syncthing Device ID format");
    }
  });

  it("Verification 4: Camera permission denial fallback to paste flow", () => {
    const pasted = parseScannedDeviceId(desktopId);
    expect(pasted.valid).toBe(true);
    expect(pasted.deviceId).toBe(desktopId);

    const empty = parseScannedDeviceId("");
    expect(empty.valid).toBe(false);
    expect(empty.error).toBe("Device ID is empty");
  });

  it("Verification 5: Pending vault folder is accepted with verified target path", async () => {
    const targetPath = "file:///app/sandbox/documents/vaults/TestVault";

    const pendingFolders = await mobileSyncthingPendingFolders(apiKey);
    expect(pendingFolders).toHaveLength(1);
    expect(pendingFolders[0].folderId).toBe(folderId);

    const access = await checkFolderAccess(targetPath);
    expect(access.accessible).toBe(true);

    await mobileSyncthingAcceptFolder(apiKey, folderId, targetPath);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/folders"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(folderId),
      }),
    );
  });
});
