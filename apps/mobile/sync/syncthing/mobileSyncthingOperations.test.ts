import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  mobileSyncthingFolderCompletion,
  mobileSyncthingIsDeviceConnected,
  mobileSyncthingIsFolderConfigured,
  mobileSyncthingSetLocalDeviceName,
  mobileSyncthingTriggerScan,
} from "./mobileSyncthingOperations";

describe("mobileSyncthingOperations", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("updates local device name via PUT /rest/config/devices/:id", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/rest/system/status")) {
        return new Response(JSON.stringify({ myID: "LOCAL-DEV-ID-123", uptime: 100 }), {
          status: 200,
        });
      }
      if (url.includes("/rest/config/devices/LOCAL-DEV-ID-123") && init?.method === "PUT") {
        return new Response("", { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });
    global.fetch = fetchMock;

    await mobileSyncthingSetLocalDeviceName("test-key", "Pixel 8 (482910)");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/rest/config/devices/LOCAL-DEV-ID-123"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "X-API-Key": "test-key",
        }),
        body: JSON.stringify({
          deviceID: "LOCAL-DEV-ID-123",
          name: "Pixel 8 (482910)",
        }),
      }),
    );
  });

  it("polls folder completion percentage accurately", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/rest/db/completion")) {
        return new Response(
          JSON.stringify({
            completion: 85.6,
            needBytes: 1024,
            globalBytes: 8192,
            needItems: 2,
          }),
          { status: 200 },
        );
      }
      return new Response("Not found", { status: 404 });
    });
    global.fetch = fetchMock;

    const res = await mobileSyncthingFolderCompletion("test-key", "vault-1");
    expect(res.completion).toBe(86);
    expect(res.needBytes).toBe(1024);
    expect(res.globalBytes).toBe(8192);
    expect(res.needItems).toBe(2);
  });

  it("checks whether a device is connected", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          connections: {
            "TARGET-DEV-ID": { connected: true },
            "OTHER-DEV-ID": { connected: false },
          },
        }),
        { status: 200 },
      );
    });
    global.fetch = fetchMock;

    const isConnected = await mobileSyncthingIsDeviceConnected("test-key", "TARGET-DEV-ID");
    expect(isConnected).toBe(true);

    const isOtherConnected = await mobileSyncthingIsDeviceConnected("test-key", "OTHER-DEV-ID");
    expect(isOtherConnected).toBe(false);
  });

  it("checks if a folder is already configured locally", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify([{ id: "existing-folder" }]),
        { status: 200 },
      );
    });
    global.fetch = fetchMock;

    const exists = await mobileSyncthingIsFolderConfigured("test-key", "existing-folder");
    expect(exists).toBe(true);

    const notExists = await mobileSyncthingIsFolderConfigured("test-key", "new-folder");
    expect(notExists).toBe(false);
  });

  it("triggers an immediate folder rescan via POST /rest/db/scan", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/rest/db/scan") && init?.method === "POST") {
        return new Response("", { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });
    global.fetch = fetchMock;

    const resAll = await mobileSyncthingTriggerScan("test-key");
    expect(resAll).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/rest/db/scan"),
      expect.objectContaining({ method: "POST" }),
    );

    const resFolder = await mobileSyncthingTriggerScan("test-key", "my-vault");
    expect(resFolder).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/rest/db/scan?folder=my-vault"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

