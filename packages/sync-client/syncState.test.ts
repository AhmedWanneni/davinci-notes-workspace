import { describe, expect, it } from "vitest";
import { createSyncStateStore } from "./syncState";

describe("durable sync state", () => {
  it("round-trips the device id and Changes cursor", async () => {
    let value: string | undefined;
    const store = createSyncStateStore({
      read: async () => value,
      write: async (next) => {
        value = next;
      },
    });
    await store.save({ deviceId: "device-a", startPageToken: "token-2" });
    await expect(store.load()).resolves.toEqual({
      deviceId: "device-a",
      startPageToken: "token-2",
    });
  });
});
