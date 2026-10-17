import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  mobileSyncthingAddDevice,
  mobileSyncthingPendingDevices,
  mobileSyncthingAcceptDevice,
  mobileSyncthingDismissPendingDevice,
  mobileSyncthingPendingFolders,
  mobileSyncthingAcceptFolder,
  mobileSyncthingDismissPendingFolder,
  mobileSyncthingConnectedDevices,
} from "./mobileSyncthingPairing";
import * as client from "./mobileSyncthingClient";

describe("mobileSyncthingPairing", () => {
  const apiKey = "test-api-key";
  const myDeviceId = "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
  const remoteDeviceId = "ABCDEFG-1234567-ABCDEFG-1234567-ABCDEFG-1234567-ABCDEFG-1234567";

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, "mobileSyncthingStatus").mockResolvedValue({
      deviceId: myDeviceId,
      deviceName: "Phone",
      uptime: 100,
    });
  });

  it("rejects invalid device ID format", async () => {
    await expect(
      mobileSyncthingAddDevice(apiKey, "short-id", "Desktop"),
    ).rejects.toThrow("Invalid Syncthing Device ID");
  });

  it("rejects adding own device ID", async () => {
    await expect(
      mobileSyncthingAddDevice(apiKey, myDeviceId, "Desktop"),
    ).rejects.toThrow("Cannot add this device: this is your own Device ID.");
  });

  it("adds valid remote device successfully", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

    await mobileSyncthingAddDevice(apiKey, remoteDeviceId, "MacBook Pro");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("lists pending devices", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        [remoteDeviceId]: {
          name: "MacBook",
          address: "192.168.1.10:22000",
          time: "2026-10-17T12:00:00Z",
        },
      }),
    });

    const list = await mobileSyncthingPendingDevices(apiKey);
    expect(list).toHaveLength(1);
    expect(list[0].deviceId).toBe(remoteDeviceId);
    expect(list[0].name).toBe("MacBook");
  });

  it("dismisses pending device via DELETE", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await mobileSyncthingDismissPendingDevice(apiKey, remoteDeviceId);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/rest/cluster/pending/devices?device=${encodeURIComponent(remoteDeviceId)}`),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("lists pending folders", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        "davinci-vault-1": {
          label: "Notes",
          offeredBy: remoteDeviceId,
          time: "2026-10-17T12:00:00Z",
        },
      }),
    });

    const folders = await mobileSyncthingPendingFolders(apiKey);
    expect(folders).toHaveLength(1);
    expect(folders[0].folderId).toBe("davinci-vault-1");
    expect(folders[0].label).toBe("Notes");
    expect(folders[0].offeredBy).toBe(remoteDeviceId);
  });

  it("accepts folder with target path and sendreceive mode", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          "davinci-vault-1": {
            label: "Notes",
            offeredBy: remoteDeviceId,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

    await mobileSyncthingAcceptFolder(apiKey, "davinci-vault-1", "/storage/emulated/0/Vault");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/folders"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"path":"/storage/emulated/0/Vault"'),
      }),
    );
  });

  it("returns connected devices when connected is true", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        connections: {
          [remoteDeviceId]: { connected: true },
          "OTHER-DEV": { connected: false },
        },
      }),
    });

    const conns = await mobileSyncthingConnectedDevices(apiKey);
    expect(conns).toEqual([remoteDeviceId]);
  });

  it("accepts device by looking up pending name", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/rest/cluster/pending/devices")) {
        return {
          ok: true,
          json: async () => ({
            [remoteDeviceId]: { name: "Desktop Mac" },
          }),
        };
      }
      if (url.includes("/rest/config/devices")) {
        return { ok: true, json: async () => [], text: async () => "" };
      }
      return { ok: true, json: async () => ({}), text: async () => "" };
    });

    await mobileSyncthingAcceptDevice(apiKey, remoteDeviceId);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/devices"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("dismisses pending folder via DELETE", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await mobileSyncthingDismissPendingFolder(apiKey, "folder-123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/cluster/pending/folders?folder=folder-123"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
