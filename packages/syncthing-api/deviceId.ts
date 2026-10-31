import { decodePairingUri } from "./pairing";

/**
 * Normalizes a Device ID by stripping spaces, hyphens, and uppercase converting.
 */
export function normalizeDeviceId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

/**
 * Validates whether a device ID conforms to the standard 56-character
 * alphanumeric format (8 groups of 7 characters).
 */
export function isValidDeviceIdFormat(raw: string): boolean {
  const clean = normalizeDeviceId(raw);
  return clean.length === 56 && /^[A-Z0-9]{56}$/.test(clean);
}

/**
 * Formats a raw device ID into hyphen-separated 7-character groups
 * (e.g. AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG-HHHHHHH).
 */
export function formatDeviceIdGroups(raw: string): string {
  const clean = normalizeDeviceId(raw);
  if (clean.length === 0) return raw.trim();
  const groups: string[] = [];
  for (let i = 0; i < clean.length && i < 56; i += 7) {
    groups.push(clean.slice(i, i + 7));
  }
  return groups.join("-");
}

export interface ParseScannedIdResult {
  valid: boolean;
  deviceId: string;
  deviceName?: string;
  folderId?: string;
  folderLabel?: string;
  code?: string;
  error?: string;
}

/**
 * Parses and validates text scanned from a QR code or pasted from clipboard.
 * Accepts raw 56-char IDs, hyphenated IDs, syncthing:// schemes, or Sophia/DaVinci pairing URIs.
 */
export function parseScannedDeviceId(raw: string): ParseScannedIdResult {
  if (!raw || raw.trim().length === 0) {
    return { valid: false, deviceId: "", error: "Device ID is empty" };
  }

  const trimmed = raw.trim();

  // 1. Try decoding as pairing URI (e.g. davincinotes://pair?d=..., sophia://pair?d=...)
  const pairing = decodePairingUri(trimmed);
  if (pairing && isValidDeviceIdFormat(pairing.id)) {
    return {
      valid: true,
      deviceId: formatDeviceIdGroups(pairing.id),
      deviceName: pairing.name,
      folderId: pairing.folderId,
      folderLabel: pairing.folderLabel,
      code: pairing.code,
    };
  }

  // 2. Try parsing as raw JSON with id field
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.id === "string" && isValidDeviceIdFormat(obj.id)) {
        return {
          valid: true,
          deviceId: formatDeviceIdGroups(obj.id),
          deviceName: typeof obj.name === "string" ? obj.name : undefined,
          folderId: typeof obj.folderId === "string" ? obj.folderId : undefined,
          folderLabel:
            typeof obj.folderLabel === "string" ? obj.folderLabel : undefined,
          code: typeof obj.code === "string" ? obj.code : undefined,
        };
      }
    } catch {
      // not valid JSON, fall through
    }
  }

  let text = trimmed;
  // 3. Strip syncthing:// or syncthing: URI schemes if present
  if (text.toLowerCase().startsWith("syncthing://")) {
    text = text.slice(12);
  } else if (text.toLowerCase().startsWith("syncthing:")) {
    text = text.slice(10);
  }

  // Remove any query params like ?id=... or &...
  if (text.includes("?id=")) {
    text = text.split("?id=")[1].split("&")[0];
  } else if (text.includes("?")) {
    text = text.split("?")[0];
  }

  const clean = normalizeDeviceId(text);
  if (!isValidDeviceIdFormat(clean)) {
    return {
      valid: false,
      deviceId: "",
      error: `Invalid Syncthing Device ID format (${clean.length}/56 characters). Expected 8 groups of 7 characters.`,
    };
  }

  return {
    valid: true,
    deviceId: formatDeviceIdGroups(clean),
  };
}

