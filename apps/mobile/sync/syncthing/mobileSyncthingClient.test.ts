import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  mobileSyncthingDetect,
  mobileSyncthingStatus,
  getSyncthingQrUrl,
  MobileSyncthingError,
} from "./mobileSyncthingClient";

describe("mobileSyncthingClient", () => {
  const secretKey = "super-secret-syncthing-key-999";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("detects running syncthing when /rest/noauth/health returns 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h: string) => (h === "x-syncthing-version" ? "v2.1.6" : null),
      },
    });

    const res = await mobileSyncthingDetect();
    expect(res.running).toBe(true);
    expect(res.version).toBe("v2.1.6");
    expect(res.guiAddress).toBe("127.0.0.1:8384");
  });

  it("reports not running when health check fails or throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await mobileSyncthingDetect();
    expect(res.running).toBe(false);
    expect(res.version).toBe("");
  });

  it("throws bad-key error when no API key is provided", async () => {
    await expect(mobileSyncthingStatus("")).rejects.toThrow(
      MobileSyncthingError,
    );
    await expect(mobileSyncthingStatus("")).rejects.toThrow(
      "Syncthing API key is not configured",
    );
  });

  it("throws bad-key error when Syncthing responds with 403 Forbidden", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    await expect(mobileSyncthingStatus("invalid-key")).rejects.toThrow(
      MobileSyncthingError,
    );
    await expect(mobileSyncthingStatus("invalid-key")).rejects.toThrow(
      "Invalid or unauthorized API key",
    );
  });

  it("never echoes secret key in unexpected network errors", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error(`Failed with ${secretKey} at 127.0.0.1`));

    try {
      await mobileSyncthingStatus(secretKey);
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).not.toContain(secretKey);
      expect(msg).toContain("[REDACTED]");
    }
  });

  it("returns deviceId and uptime when authenticated successfully", async () => {
    const rawId =
      "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        myID: rawId,
        urVersion: "My Phone",
        uptime: 12345,
      }),
    });

    const res = await mobileSyncthingStatus(secretKey);
    expect(res.deviceId).toBe(rawId);
    expect(res.deviceName).toBe("My Phone");
    expect(res.uptime).toBe(12345);
  });

  it("generates correct QR image URL for deviceId", () => {
    const id = "ABC-123";
    const url = getSyncthingQrUrl(id);
    expect(url).toBe("http://127.0.0.1:8384/qr/?text=ABC-123");
  });

  it("formats raw java.net.ConnectException to a friendly message", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "fetch failed java.net.ConnectException: Failed to connect /127.0.0.1:8384",
        ),
      );

    await expect(mobileSyncthingStatus("test-key")).rejects.toThrow(
      "Syncthing is stopped or unreachable on localhost. Start Syncthing to continue.",
    );
  });
});
