import type {
  SyncthingDetectResult,
  SyncthingStatusResult,
} from "@app/syncthing-api";
import { sanitizeError } from "@app/syncthing-api";

const SYNCTHING_BASE_URL = "http://127.0.0.1:8384";
const TIMEOUT_MS = 3000;

export class MobileSyncthingError extends Error {
  constructor(
    public readonly kind:
      "not-running" | "bad-key" | "unreachable" | "unexpected-response",
    message: string,
  ) {
    super(message);
    this.name = "MobileSyncthingError";
  }
}

/**
 * Checks if local Syncthing-Fork instance is responding on localhost.
 * Uses public /rest/noauth/health which requires no API key.
 */
export async function mobileSyncthingDetect(): Promise<SyncthingDetectResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${SYNCTHING_BASE_URL}/rest/noauth/health`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        running: false,
        version: "",
        guiAddress: "127.0.0.1:8384",
      };
    }

    const versionHeader = res.headers.get("x-syncthing-version") ?? "";
    return {
      running: true,
      version: versionHeader,
      guiAddress: "127.0.0.1:8384",
    };
  } catch {
    return {
      running: false,
      version: "",
      guiAddress: "127.0.0.1:8384",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches status including Device ID and system information.
 * Ensures the API key is passed in headers only and NEVER logged or leaked.
 */
export async function mobileSyncthingStatus(
  apiKey: string,
): Promise<SyncthingStatusResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new MobileSyncthingError(
      "bad-key",
      "Syncthing API key is not configured",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${SYNCTHING_BASE_URL}/rest/system/status`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey.trim(),
      },
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      throw new MobileSyncthingError(
        "bad-key",
        "Invalid or unauthorized API key",
      );
    }

    if (!res.ok) {
      throw new MobileSyncthingError(
        "unexpected-response",
        `Syncthing returned HTTP status ${res.status}`,
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    const deviceId = typeof data.myID === "string" ? data.myID : "";
    const uptime = typeof data.uptime === "number" ? data.uptime : 0;
    const deviceName =
      typeof data.urVersion === "string"
        ? data.urVersion
        : typeof data.myID === "string"
          ? data.myID.slice(0, 7)
          : "Syncthing";

    return {
      deviceId,
      deviceName,
      uptime,
    };
  } catch (err: unknown) {
    if (err instanceof MobileSyncthingError) {
      throw err;
    }
    const cleanMsg = sanitizeError(err, apiKey);
    throw new MobileSyncthingError(
      "unreachable",
      `Syncthing unreachable: ${cleanMsg}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns the URL for Syncthing's device QR code image.
 */
export function getSyncthingQrUrl(deviceId: string): string {
  return `${SYNCTHING_BASE_URL}/qr/?text=${encodeURIComponent(deviceId)}`;
}
