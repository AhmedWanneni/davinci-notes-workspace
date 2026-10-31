import { describe, expect, it } from "vitest";
import {
  formatDeviceIdGroups,
  isValidDeviceIdFormat,
  normalizeDeviceId,
  parseScannedDeviceId,
} from "./deviceId";

describe("deviceId utilities", () => {
  const rawId =
    "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
  const cleanId = "C4BPTD3DOYDMY2BMYU2JIXZSA2JHB7FJJTGWEO6WA3XGIYHVFC2O5BQE";

  it("normalizes device ID by removing hyphens and spaces and making uppercase", () => {
    expect(normalizeDeviceId(rawId)).toBe(cleanId);
    expect(normalizeDeviceId("  c4bptd3-doydmy2  ")).toBe("C4BPTD3DOYDMY2");
  });

  it("validates 56-character alphanumeric device IDs", () => {
    expect(isValidDeviceIdFormat(rawId)).toBe(true);
    expect(isValidDeviceIdFormat(cleanId)).toBe(true);
    expect(isValidDeviceIdFormat("SHORT-ID")).toBe(false);
    expect(isValidDeviceIdFormat(rawId + "X")).toBe(false);
    expect(isValidDeviceIdFormat("INVALID_CHARS!-" + cleanId.slice(15))).toBe(
      false,
    );
  });

  it("formats normalized ID into 7-character groups", () => {
    expect(formatDeviceIdGroups(cleanId)).toBe(rawId);
    expect(formatDeviceIdGroups(rawId)).toBe(rawId);
    expect(formatDeviceIdGroups("ABCDEFG1234567")).toBe("ABCDEFG-1234567");
    expect(formatDeviceIdGroups("")).toBe("");
  });

  it("parses scanned QR payloads with plain IDs or schemes", () => {
    const res1 = parseScannedDeviceId(rawId);
    expect(res1.valid).toBe(true);
    expect(res1.deviceId).toBe(rawId);

    const res2 = parseScannedDeviceId(`syncthing://${cleanId}`);
    expect(res2.valid).toBe(true);
    expect(res2.deviceId).toBe(rawId);

    const res3 = parseScannedDeviceId(`syncthing:device?id=${rawId}&name=Desktop`);
    expect(res3.valid).toBe(true);
    expect(res3.deviceId).toBe(rawId);

    const res4 = parseScannedDeviceId("random invalid text here");
    expect(res4.valid).toBe(false);
    expect(res4.error).toContain("Invalid Syncthing Device ID format");

    const res5 = parseScannedDeviceId("");
    expect(res5.valid).toBe(false);

    // Pairing URI support (e.g. davincinotes://pair?d=... or sophia://pair?d=...)
    const compactJson = JSON.stringify({
      v: 1,
      id: rawId,
      name: "Ahmed's MacBook Pro",
      folderId: "davinci-c130e8cee8",
      folderLabel: "Obsidian Vault",
      code: "123456",
    });
    const b64 = Buffer.from(compactJson).toString("base64url");
    const resPair = parseScannedDeviceId(`davincinotes://pair?d=${b64}`);
    expect(resPair.valid).toBe(true);
    expect(resPair.deviceId).toBe(rawId);
    expect(resPair.deviceName).toBe("Ahmed's MacBook Pro");
    expect(resPair.folderLabel).toBe("Obsidian Vault");

    const resJson = parseScannedDeviceId(compactJson);
    expect(resJson.valid).toBe(true);
    expect(resJson.deviceId).toBe(rawId);
    expect(resJson.deviceName).toBe("Ahmed's MacBook Pro");
  });
});
