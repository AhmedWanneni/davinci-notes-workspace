import { describe, expect, it } from "vitest";
import {
  mobileSyncthingDetect,
  mobileSyncthingStatus,
  getSyncthingQrUrl,
  MobileSyncthingError,
} from "./mobileSyncthingClient";
import { sanitizeError } from "@app/syncthing-api";

describe("Live Syncthing Integration Scenarios", () => {
  const validKey = "nwF6b6CCKZj5nePcYqeco4ZSiTKvgum4";
  const expectedDeviceId =
    "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";

  it("Scenario 1: Detects live Syncthing daemon running on 127.0.0.1:8384", async () => {
    const detect = await mobileSyncthingDetect();
    if (!detect.running) {
      expect(detect.running).toBe(false);
      expect(detect.guiAddress).toBe("127.0.0.1:8384");
      return;
    }
    expect(detect.running).toBe(true);
    expect(detect.guiAddress).toBe("127.0.0.1:8384");
  });

  it("Scenario 2: Wrong key triggers 'bad-key' error without echoing the key", async () => {
    const detect = await mobileSyncthingDetect();
    if (!detect.running) return;
    const wrongKey = "wrong-adversarial-api-key-xyz";
    try {
      await mobileSyncthingStatus(wrongKey);
      expect.fail("Should have failed with bad-key");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(MobileSyncthingError);
      const e = err as MobileSyncthingError;
      expect(e.kind).toBe("bad-key");
      expect(e.message).toBe("Invalid or unauthorized API key");
      expect(e.message).not.toContain(wrongKey);
    }
  });

  it("Scenario 3: Valid key returns exact Device ID matching Syncthing GUI", async () => {
    const detect = await mobileSyncthingDetect();
    if (!detect.running) return;
    const status = await mobileSyncthingStatus(validKey);
    expect(status.deviceId).toBe(expectedDeviceId);
    expect(status.uptime).toBeGreaterThan(0);
  });

  it("Scenario 4: QR URL returns valid PNG image bytes for Device ID", async () => {
    const qrUrl = getSyncthingQrUrl(expectedDeviceId);
    expect(qrUrl).toBe(
      `http://127.0.0.1:8384/qr/?text=${encodeURIComponent(expectedDeviceId)}`,
    );

    const detect = await mobileSyncthingDetect();
    if (!detect.running) return;

    const res = await fetch(qrUrl);
    expect(res.ok).toBe(true);
    expect(res.headers.get("content-type")).toBe("image/png");

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Check PNG header bytes: 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50); // P
    expect(bytes[2]).toBe(0x4e); // N
    expect(bytes[3]).toBe(0x47); // G
    expect(bytes[4]).toBe(0x0d);
    expect(bytes[5]).toBe(0x0a);
    expect(bytes[6]).toBe(0x1a);
    expect(bytes[7]).toBe(0x0a);
  });

  it("Scenario 5: Redaction ensures API key is stripped from errors and logs", () => {
    const rawError = `Failed to connect with key ${validKey} on 127.0.0.1:8384`;
    const sanitized = sanitizeError(rawError, validKey);
    expect(sanitized).toBe(
      "Failed to connect with key [REDACTED] on 127.0.0.1:8384",
    );
    expect(sanitized).not.toContain(validKey);
  });
});
