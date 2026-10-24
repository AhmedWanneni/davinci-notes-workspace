import type { StorageArea } from "../storage/storageArea";

/**
 * Pairing with the desktop app (ADR-0173, ADR-0180).
 *
 * Phase 0 chose **manual pairing**: the user copies the port and the per-install
 * token out of the app's Web Clipper settings into here. There is no handshake
 * and no discovery — the extension knows where to knock only because it was
 * told, which keeps the loopback endpoint reachable by nothing else.
 */
export const PAIRING_KEY = "clipper.pairing";

/** Must match the app's preferred port (`CLIPPER_DEFAULT_PORT`); a fallback is reported. */
export const DEFAULT_CLIPPER_PORT = 47912;

/** What the extension needs to reach the app's loopback listener. */
export interface ClipperPairing {
  port: number;
  token: string;
}

const MAX_PORT = 65_535;

/**
 * Normalise an untrusted pairing record, or `undefined` when it is unusable.
 *
 * Storage is shared with every other extension surface and can be hand-edited
 * from the browser's own DevTools, so a half-written entry is treated as absent
 * rather than repaired: a guessed token would only produce a 401 later.
 */
export function pairingFromStorageValue(
  value: unknown,
): ClipperPairing | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as { port?: unknown; token?: unknown };
  const port = candidate.port;
  const token = candidate.token;
  if (typeof token !== "string") return undefined;
  const trimmed = token.trim();
  if (trimmed.length === 0) return undefined;
  if (typeof port !== "number" || !Number.isInteger(port)) return undefined;
  if (port < 1 || port > MAX_PORT) return undefined;
  return { port, token: trimmed };
}

/**
 * Read the port a user typed, or `undefined` when it is not a usable port.
 *
 * The pairing field is free text, so an empty or out-of-range entry has to be
 * distinguishable from a deliberate `0`.
 */
export function parsePort(text: string): number | undefined {
  const trimmed = text.trim();
  if (!/^[0-9]{1,5}$/.test(trimmed)) return undefined;
  const port = Number(trimmed);
  return port >= 1 && port <= MAX_PORT ? port : undefined;
}

export async function loadPairing(
  area: StorageArea,
): Promise<ClipperPairing | undefined> {
  const stored = await area.get(PAIRING_KEY);
  return pairingFromStorageValue(stored[PAIRING_KEY]);
}

export async function savePairing(
  area: StorageArea,
  pairing: ClipperPairing,
): Promise<void> {
  const clean = pairingFromStorageValue(pairing);
  if (clean === undefined) return;
  await area.set({ [PAIRING_KEY]: clean });
}

/**
 * Forget the pairing.
 *
 * The seam only needs `get`/`set`, so the key is set to `null` rather than
 * removed; a null value is indistinguishable from an absent one to the reader.
 */
export async function clearPairing(area: StorageArea): Promise<void> {
  await area.set({ [PAIRING_KEY]: null });
}
