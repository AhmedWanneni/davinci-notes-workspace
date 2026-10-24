import { describe, expect, it } from "vitest";
import {
  checkDeviceNameHasCode,
  decodePairingUri,
  encodePairingUri,
  fromBase64Url,
  generatePairingCode,
  toBase64Url,
  type SyncthingPairingPayload,
} from "./pairing";

describe("syncthing pairing payload", () => {
  it("encodes and decodes base64url correctly without padding", () => {
    const raw = "Hello World! @#$?_";
    const encoded = toBase64Url(raw);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    const decoded = fromBase64Url(encoded);
    expect(decoded).toBe(raw);
  });

  it("generates a 6-digit random code", () => {
    const code = generatePairingCode();
    expect(code).toMatch(/^\d{6}$/);
    const code2 = generatePairingCode();
    expect(code2).toMatch(/^\d{6}$/);
  });

  it("encodes and decodes a pairing payload in davincinotes://pair?d= URI", () => {
    const payload: SyncthingPairingPayload = {
      v: 1,
      id: "CUNAQKL-DPXFA3V-6WCLPRY-TOB2XGN-3MAL6F7-F4KDQRB-ULCZGH4-OKMPQQT",
      name: "Ahmed's MacBook",
      folderId: "davinci-1234567890",
      folderLabel: "Personal Vault",
      code: "582910",
    };

    const uri = encodePairingUri(payload);
    expect(uri.startsWith("davincinotes://pair?d=")).toBe(true);

    const parsed = decodePairingUri(uri);
    expect(parsed).toEqual(payload);
  });

  it("returns null for malformed or corrupted URIs", () => {
    expect(decodePairingUri("")).toBeNull();
    expect(decodePairingUri("invalid-uri")).toBeNull();
    expect(decodePairingUri("davincinotes://pair?d=not-json")).toBeNull();
    expect(
      decodePairingUri(
        "davincinotes://pair?d=" + toBase64Url(JSON.stringify({ v: 2 })),
      ),
    ).toBeNull();
    expect(
      decodePairingUri(
        "davincinotes://pair?d=" +
          toBase64Url(JSON.stringify({ v: 1, id: 123 })),
      ),
    ).toBeNull();
  });

  it("checks whether a device name carries the pairing code", () => {
    const code = "582910";
    expect(checkDeviceNameHasCode("Pixel 8 (582910)", code)).toBe(true);
    expect(checkDeviceNameHasCode("Pixel-8-582910", code)).toBe(true);
    expect(checkDeviceNameHasCode("Pixel 8 [582910]", code)).toBe(true);
    expect(checkDeviceNameHasCode("Pixel 8", code)).toBe(false);
    expect(checkDeviceNameHasCode("Pixel 8 (999999)", code)).toBe(false);
    expect(checkDeviceNameHasCode(null, code)).toBe(false);
    expect(checkDeviceNameHasCode("", code)).toBe(false);
  });
});
