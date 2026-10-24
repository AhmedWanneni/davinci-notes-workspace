import type {
  SyncthingDetectResult,
  SyncthingStatusResult,
} from "@app/syncthing-api";
import { sanitizeError } from "@app/syncthing-api";
import { EmbeddedSyncthingBridge } from "./embeddedSyncthingBridge";

const SYNCTHING_BASE_URL = "http://127.0.0.1:8384";
const TIMEOUT_MS = 3000;

export interface MobileHttpResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

export async function mobileSyncthingFetch(
  apiKey: string,
  path: string,
  options: RequestInit = {},
): Promise<MobileHttpResponse> {
  if (EmbeddedSyncthingBridge.isAvailable()) {
    try {
      const method = options.method || "GET";
      const body = options.body;
      const resRaw = await EmbeddedSyncthingBridge.request<string>(
        method,
        path,
        body,
      );
      return {
        ok: true,
        status: 200,
        json: async () =>
          typeof resRaw === "string" ? JSON.parse(resRaw) : resRaw,
        text: async () =>
          typeof resRaw === "string" ? resRaw : JSON.stringify(resRaw),
      };
    } catch (err: unknown) {
      const safeMsg = sanitizeError(err, apiKey || "");
      throw new MobileSyncthingError(
        "unreachable",
        `Embedded Syncthing error: ${safeMsg}`,
      );
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${SYNCTHING_BASE_URL}${path}`, {
      ...options,
      headers: {
        "X-API-Key": apiKey.trim(),
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    const safeMsg = sanitizeError(err, apiKey);
    const isConnRefused =
      safeMsg.includes("ConnectException") ||
      safeMsg.includes("ECONNREFUSED") ||
      safeMsg.includes("Failed to connect");
    const friendlyMsg = isConnRefused
      ? "Syncthing is stopped or unreachable on localhost. Start Syncthing to continue."
      : safeMsg;
    throw new MobileSyncthingError(
      "unreachable",
      `Syncthing unreachable: ${friendlyMsg}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

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
  if (EmbeddedSyncthingBridge.isAvailable()) {
    try {
      const stat = await EmbeddedSyncthingBridge.getStatus();
      return {
        running: stat.status === "running",
        version: "v2.1.6",
        guiAddress: stat.port > 0 ? `127.0.0.1:${stat.port}` : "127.0.0.1",
      };
    } catch {
      return {
        running: false,
        version: "",
        guiAddress: "127.0.0.1",
      };
    }
  }

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
  apiKey: string = "",
): Promise<SyncthingStatusResult> {
  const isEmb = EmbeddedSyncthingBridge.isAvailable();
  if (!isEmb && (!apiKey || apiKey.trim().length === 0)) {
    throw new MobileSyncthingError(
      "bad-key",
      "Syncthing API key is not configured",
    );
  }

  try {
    const res = await mobileSyncthingFetch(apiKey, "/rest/system/status");
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new MobileSyncthingError(
          "bad-key",
          "Invalid or unauthorized API key",
        );
      }
      throw new MobileSyncthingError(
        "unexpected-response",
        `Syncthing returned HTTP status ${res.status}`,
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    const devId = isEmb
      ? await EmbeddedSyncthingBridge.getDeviceId().catch(() => "")
      : "";
    const deviceId = devId || (typeof data.myID === "string" ? data.myID : "");
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
  }
}

/**
 * Returns the URL for Syncthing's device QR code image.
 */
export function getSyncthingQrUrl(deviceId: string, port = 8384): string {
  return `http://127.0.0.1:${port}/qr/?text=${encodeURIComponent(deviceId)}`;
}

export async function getMobileSyncthingQrUri(
  text: string,
  port = 8384,
): Promise<string> {
  if (EmbeddedSyncthingBridge.isAvailable()) {
    const dataUri = await EmbeddedSyncthingBridge.getQrDataUri(text);
    if (dataUri) return dataUri;
  }
  return getSyncthingQrUrl(text, port);
}
