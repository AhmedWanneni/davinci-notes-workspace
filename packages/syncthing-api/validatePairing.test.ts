import { describe, expect, it } from "vitest";
import {
  encodePairingUri,
  toBase64Url,
  type SyncthingPairingPayload,
} from "./pairing";
import {
  sanitizeDisplayName,
  validatePairingInput,
} from "./validatePairing";

describe("validatePairing", () => {
  const validPayload: SyncthingPairingPayload = {
    v: 1,
    id: "CUNAQKL-DPXFA3V-6WCLPRY-TOB2XGN-3MAL6F7-F4KDQRB-ULCZGH4-OKMPQQT",
    name: "Ahmed's MacBook",
    folderId: "davinci-vault-12345",
    folderLabel: "Personal Vault",
    code: "482910",
  };

  it("validates a full davincinotes://pair pairing uri correctly", () => {
    const uri = encodePairingUri(validPayload);
    const result = validatePairingInput(uri);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.type).toBe("pairing");
      expect(result.payload.id).toBe(validPayload.id);
      expect(result.payload.name).toBe("Ahmeds MacBook"); // sanitized
      expect(result.payload.folderId).toBe(validPayload.folderId);
      expect(result.payload.folderLabel).toBe(validPayload.folderLabel);
      expect(result.payload.code).toBe(validPayload.code);
    }
  });

  it("rejects empty or whitespace inputs", () => {
    const res = validatePairingInput("");
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("cannot be empty");
    }
  });

  it("rejects generic web URLs with clear message", () => {
    const res = validatePairingInput("https://example.com/some/path");
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("web URL");
    }
  });

  it("rejects future or unknown pairing payload versions (e.g. v2)", () => {
    const futurePayload = { ...validPayload, v: 2 };
    const uri = `davincinotes://pair?d=${toBase64Url(JSON.stringify(futurePayload))}`;
    const res = validatePairingInput(uri);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("Unsupported pairing version (v2)");
    }
  });

  it("rejects invalid Device ID shape in pairing payload", () => {
    const badIdPayload = { ...validPayload, id: "TOO-SHORT" };
    const uri = `davincinotes://pair?d=${toBase64Url(JSON.stringify(badIdPayload))}`;
    const res = validatePairingInput(uri);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("Invalid Device ID format");
    }
  });

  it("rejects invalid 6-digit verification code", () => {
    const badCodePayload = { ...validPayload, code: "abc" };
    const uri = `davincinotes://pair?d=${toBase64Url(JSON.stringify(badCodePayload))}`;
    const res = validatePairingInput(uri);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("Invalid 6-digit");
    }
  });

  it("accepts a raw 56-character Syncthing Device ID as fallback", () => {
    const rawId = "CUNAQKL-DPXFA3V-6WCLPRY-TOB2XGN-3MAL6F7-F4KDQRB-ULCZGH4-OKMPQQT";
    const res = validatePairingInput(rawId);
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.type).toBe("raw_device");
      expect(res.payload.id).toBe(rawId);
    }
  });

  it("sanitizes dangerous characters in device and vault names", () => {
    expect(sanitizeDisplayName("<script>alert('xss')</script>")).toBe("scriptalert(xss)/script");
    expect(sanitizeDisplayName("MacBook & Pro \"Work\"")).toBe("MacBook  Pro Work");
    expect(sanitizeDisplayName("Clean Name")).toBe("Clean Name");
  });
});
