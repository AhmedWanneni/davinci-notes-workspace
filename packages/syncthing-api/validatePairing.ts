import type { SyncthingPairingPayload } from "./pairing";
import { fromBase64Url } from "./pairing";


export function sanitizeDisplayName(str: string): string {
  if (!str) return "";
  return str
    .replace(/[<>'"&]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 100);
}

export type ValidatedPairingResult =
  | {
      valid: true;
      type: "pairing";
      payload: SyncthingPairingPayload;
    }
  | {
      valid: true;
      type: "raw_device";
      deviceId: string;
      payload: SyncthingPairingPayload;
    }
  | {
      valid: false;
      error: string;
    };

export function validatePairingInput(raw: string): ValidatedPairingResult {
  const trimmed = raw ? raw.trim() : "";
  if (!trimmed) {
    return { valid: false, error: "Input cannot be empty." };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      valid: false,
      error: "Scanned QR code is a web URL, not a DaVinci Notes pairing code.",
    };
  }

  const isPairingUri =
    trimmed.includes("://pair") ||
    trimmed.includes("?d=") ||
    trimmed.startsWith("davincinotes://") ||
    trimmed.startsWith("sophia://") ||
    trimmed.startsWith("davinci://");

  if (isPairingUri) {
    let b64 = "";
    if (trimmed.includes("?d=")) {
      b64 = trimmed.split("?d=")[1].split("&")[0];
    } else {
      const qIndex = trimmed.indexOf("?");
      if (qIndex !== -1) {
        const params = new URLSearchParams(trimmed.slice(qIndex));
        b64 = params.get("d") || "";
      }
    }

    if (!b64) {
      return { valid: false, error: "Missing pairing payload data." };
    }

    let parsedObj: Record<string, unknown>;
    try {
      const jsonStr = fromBase64Url(b64);
      parsedObj = JSON.parse(jsonStr);
    } catch {
      return {
        valid: false,
        error: "Corrupted pairing code (failed to decode payload).",
      };
    }

    if (typeof parsedObj.v === "number" && parsedObj.v !== 1) {
      return {
        valid: false,
        error: `Unsupported pairing version (v${parsedObj.v}). Please update DaVinci Notes.`,
      };
    }
    if (parsedObj.v !== 1) {
      return { valid: false, error: "Invalid pairing payload: missing version." };
    }

    if (typeof parsedObj.id !== "string" || !parsedObj.id.trim()) {
      return { valid: false, error: "Missing Device ID in pairing code." };
    }
    const cleanId = parsedObj.id.trim().toUpperCase().replace(/[\s-]/g, "");
    if (cleanId.length !== 56 || !/^[A-Z0-9]{56}$/.test(cleanId)) {
      return {
        valid: false,
        error: "Invalid Device ID format in pairing code (expected 56 characters).",
      };
    }

    if (typeof parsedObj.name !== "string" || !parsedObj.name.trim() || parsedObj.name.length > 100) {
      return {
        valid: false,
        error: "Invalid device name in pairing code (must be 1 to 100 characters).",
      };
    }
    if (typeof parsedObj.folderId !== "string" || !parsedObj.folderId.trim() || parsedObj.folderId.length > 100) {
      return {
        valid: false,
        error: "Invalid vault folder ID in pairing code (must be 1 to 100 characters).",
      };
    }
    if (typeof parsedObj.folderLabel !== "string" || !parsedObj.folderLabel.trim() || parsedObj.folderLabel.length > 100) {
      return {
        valid: false,
        error: "Invalid vault name in pairing code (must be 1 to 100 characters).",
      };
    }
    if (typeof parsedObj.code !== "string" || !/^\d{6}$/.test(parsedObj.code)) {
      return {
        valid: false,
        error: "Invalid 6-digit verification code in pairing code.",
      };
    }

    return {
      valid: true,
      type: "pairing",
      payload: {
        v: 1,
        id: parsedObj.id.trim(),
        name: sanitizeDisplayName(parsedObj.name),
        folderId: parsedObj.folderId.trim(),
        folderLabel: sanitizeDisplayName(parsedObj.folderLabel),
        code: parsedObj.code,
      },
    };
  }

  // Not a pairing scheme - check if raw Device ID or syncthing URI
  let devText = trimmed;
  if (devText.toLowerCase().startsWith("syncthing://")) {
    devText = devText.slice(12);
  } else if (devText.toLowerCase().startsWith("syncthing:")) {
    devText = devText.slice(10);
  }
  if (devText.includes("?id=")) {
    devText = devText.split("?id=")[1].split("&")[0];
  } else if (devText.includes("?")) {
    devText = devText.split("?")[0];
  }

  const cleanDevice = devText.toUpperCase().replace(/[\s-]/g, "");
  if (cleanDevice.length === 56 && /^[A-Z0-9]{56}$/.test(cleanDevice)) {
    return {
      valid: true,
      type: "raw_device",
      deviceId: devText,
      payload: {
        v: 1,
        id: devText,
        name: "Desktop",
        folderId: "davinci-default",
        folderLabel: "Vault",
        code: "",
      },
    };
  }

  return {
    valid: false,
    error: "Scanned QR is neither a valid DaVinci Notes pairing code nor a Syncthing Device ID.",
  };
}
