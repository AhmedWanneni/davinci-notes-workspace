export interface SyncthingPairingPayload {
  v: 1;
  id: string;
  name: string;
  folderId: string;
  folderLabel: string;
  code: string;
}

export function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = "";
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binString);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(b64url: string): string {
  let base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function generatePairingCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

export function encodePairingUri(payload: SyncthingPairingPayload): string {
  const compactJson = JSON.stringify({
    v: 1,
    id: payload.id,
    name: payload.name,
    folderId: payload.folderId,
    folderLabel: payload.folderLabel,
    code: payload.code,
  });
  return `davincinotes://pair?d=${toBase64Url(compactJson)}`;
}

export function decodePairingUri(input: string): SyncthingPairingPayload | null {
  const trimmed = input.trim();
  let rawBase64 = "";

  if (trimmed.includes("://pair?d=") || trimmed.includes("://pair/?d=")) {
    rawBase64 = trimmed.split("?d=")[1].split("&")[0];
  } else if (trimmed.startsWith("davincinotes://pair?d=")) {
    rawBase64 = trimmed.slice("davincinotes://pair?d=".length);
  } else if (trimmed.includes("://pair?") || trimmed.includes("://pair/?")) {
    const qIndex = trimmed.indexOf("?");
    const params = new URLSearchParams(trimmed.slice(qIndex));
    rawBase64 = params.get("d") || "";
  } else if (trimmed.includes("?d=")) {
    rawBase64 = trimmed.split("?d=")[1].split("&")[0];
  } else {
    rawBase64 = trimmed;
  }

  if (!rawBase64) return null;

  try {
    const jsonStr = fromBase64Url(rawBase64);
    const obj = JSON.parse(jsonStr);
    if (
      obj &&
      obj.v === 1 &&
      typeof obj.id === "string" &&
      typeof obj.name === "string" &&
      typeof obj.folderId === "string" &&
      typeof obj.folderLabel === "string" &&
      typeof obj.code === "string"
    ) {
      return {
        v: 1,
        id: obj.id,
        name: obj.name,
        folderId: obj.folderId,
        folderLabel: obj.folderLabel,
        code: obj.code,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function checkDeviceNameHasCode(
  deviceName: string | null | undefined,
  code: string,
): boolean {
  if (!deviceName || !code) return false;
  return deviceName.includes(code);
}


