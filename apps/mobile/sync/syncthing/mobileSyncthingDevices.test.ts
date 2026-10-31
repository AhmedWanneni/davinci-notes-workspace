import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  mobileSyncthingListDevices,
  mobileSyncthingRemoveDevice,
} from "./mobileSyncthingDevices";

describe("mobileSyncthingDevices", () => {
  const apiKey = "test-key";
  const myDeviceId = "MYDEV-1111111-2222222-3333333-4444444-5555555-6666666-7777777";
  const remoteDeviceId = "REMOTE-1111111-2222222-3333333-4444444-5555555-6666666-7777777";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists configured devices and indicates connected state and vault sharing", async () => {
    global.fetch = vi.fn()
      // devices
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { deviceID: myDeviceId, name: "Phone" },
          { deviceID: remoteDeviceId, name: "MacBook Pro", paused: false },
        ],
      })
      // connections
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connections: {
            [remoteDeviceId]: { connected: true, address: "192.168.1.50:22000" },
          },
        }),
      })
      // folders
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "vault",
            devices: [{ deviceID: myDeviceId }, { deviceID: remoteDeviceId }],
          },
        ],
      });

    const devices = await mobileSyncthingListDevices(apiKey, myDeviceId);
    expect(devices).toHaveLength(1);
    expect(devices[0].deviceId).toBe(remoteDeviceId);
    expect(devices[0].name).toBe("MacBook Pro");
    expect(devices[0].connected).toBe(true);
    expect(devices[0].isVaultShared).toBe(true);
    expect(devices[0].address).toBe("192.168.1.50:22000");
  });

  it("removes device via DELETE /rest/config/devices/:id", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, text: async () => "" });
    await mobileSyncthingRemoveDevice(apiKey, remoteDeviceId);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/devices/"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
