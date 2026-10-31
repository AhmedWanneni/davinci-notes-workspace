import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  mobileSyncthingListSharedVaults,
  mobileSyncthingUnshareFolder,
} from "./mobileSyncthingVaults";

describe("mobileSyncthingVaults", () => {
  const apiKey = "test-key";
  const myDeviceId = "MYDEV-1111111-2222222-3333333-4444444-5555555-6666666-7777777";
  const remoteDeviceId = "REMOTE-1111111-2222222-3333333-4444444-5555555-6666666-7777777";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists shared vaults and marks active vault correctly", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "davinci-vault-1",
          label: "My Notes",
          path: "/storage/emulated/0/Documents/My Notes",
          devices: [{ deviceID: myDeviceId }, { deviceID: remoteDeviceId }],
          paused: false,
        },
        {
          id: "davinci-vault-2",
          label: "Work Notes",
          path: "/storage/emulated/0/Documents/Work Notes",
          devices: [{ deviceID: myDeviceId }],
          paused: true,
        },
      ],
    });

    const vaults = await mobileSyncthingListSharedVaults(
      apiKey,
      "/storage/emulated/0/Documents/My Notes",
      myDeviceId,
    );

    expect(vaults).toHaveLength(2);
    expect(vaults[0].folderId).toBe("davinci-vault-1");
    expect(vaults[0].label).toBe("My Notes");
    expect(vaults[0].isActiveVault).toBe(true);
    expect(vaults[0].sharedWithDeviceIds).toEqual([remoteDeviceId]);

    expect(vaults[1].folderId).toBe("davinci-vault-2");
    expect(vaults[1].isActiveVault).toBe(false);
    expect(vaults[1].paused).toBe(true);
    expect(vaults[1].sharedWithDeviceIds).toEqual([]);
  });

  it("unshares folder via DELETE /rest/config/folders/:id", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, text: async () => "" });
    await mobileSyncthingUnshareFolder(apiKey, "davinci-vault-1");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/folders/davinci-vault-1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
