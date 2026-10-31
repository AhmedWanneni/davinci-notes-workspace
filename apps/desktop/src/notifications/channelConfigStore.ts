import type Database from "@tauri-apps/plugin-sql";
import {
  getVaultIndexDb,
  withDbLock,
  withDbTransaction,
} from "../vault/sqliteIndex";
import {
  DEFAULT_DESKTOP_DESTINATION,
  type ChannelDestinationMeta,
  type ChannelSecretPayload,
} from "./channelTypes";
import { redactSecrets } from "./secretRedactor";

export const CHANNELS_SETTINGS_KEY = "notification_channels_config";

const memorySecretFallback = new Map<string, string>();
let isTestMemorySecretMode = false;
const logListeners = new Set<(line: string) => void>();

export function setNotificationSecretTestMode(enabled: boolean): void {
  isTestMemorySecretMode = enabled;
  if (!enabled) {
    memorySecretFallback.clear();
  }
}

export function subscribeNotificationLogs(
  listener: (line: string) => void,
): () => void {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
}

export function emitNotificationLog(
  message: string,
  explicitSecrets: readonly string[] = [],
): void {
  const safeMessage = `[notifications] ${redactSecrets(message, explicitSecrets)}`;
  for (const listener of logListeners) {
    listener(safeMessage);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<string>("davinci:notification-log", {
        detail: safeMessage,
      }),
    );
  }
}

export async function saveChannelSecret(
  destinationId: string,
  secret: ChannelSecretPayload,
): Promise<void> {
  const serialized = JSON.stringify(secret);
  if (isTestMemorySecretMode) {
    memorySecretFallback.set(destinationId, serialized);
    return;
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_notification_secret", {
      destinationId,
      secretJson: serialized,
    });
  } catch {
    memorySecretFallback.set(destinationId, serialized);
  }
}

export async function loadChannelSecret<T extends ChannelSecretPayload>(
  destinationId: string,
): Promise<T | null> {
  let raw: string | null = null;
  if (isTestMemorySecretMode) {
    raw = memorySecretFallback.get(destinationId) ?? null;
  } else {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      raw = await invoke<string | null>("load_notification_secret", {
        destinationId,
      });
    } catch {
      raw = null;
    }
    if (!raw) {
      raw = memorySecretFallback.get(destinationId) ?? null;
    }
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearChannelSecret(destinationId: string): Promise<void> {
  memorySecretFallback.delete(destinationId);
  if (isTestMemorySecretMode) {
    return;
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("clear_notification_secret", { destinationId });
  } catch {
    // Already cleared or outside Tauri runtime
  }
}

function ensureDesktopDefault(
  list: ChannelDestinationMeta[],
): ChannelDestinationMeta[] {
  const hasDesktop = list.some((d) => d.id === DEFAULT_DESKTOP_DESTINATION.id);
  if (hasDesktop) return list;
  return [{ ...DEFAULT_DESKTOP_DESTINATION }, ...list];
}

export async function loadChannelDestinations(
  dbOverride?: Database,
): Promise<ChannelDestinationMeta[]> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const rows = await withDbLock(() =>
    db.select<Array<{ value: string }>>(
      `SELECT value FROM settings WHERE key = $1`,
      [CHANNELS_SETTINGS_KEY],
    ),
  );
  if (rows.length === 0 || !rows[0]?.value) {
    return [{ ...DEFAULT_DESKTOP_DESTINATION }];
  }
  try {
    const parsed: unknown = JSON.parse(rows[0].value);
    if (Array.isArray(parsed)) {
      return ensureDesktopDefault(parsed as ChannelDestinationMeta[]);
    }
  } catch {
    // Fallback to default on corrupted JSON
  }
  return [{ ...DEFAULT_DESKTOP_DESTINATION }];
}

export async function saveChannelDestinations(
  destinations: ChannelDestinationMeta[],
  dbOverride?: Database,
): Promise<ChannelDestinationMeta[]> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const normalized = ensureDesktopDefault(destinations).map((d) => ({
    ...d,
    lastError: d.lastError ? redactSecrets(d.lastError) : null,
  }));
  const json = JSON.stringify(normalized);

  await withDbLock(() =>
    withDbTransaction(db, () =>
      db.execute(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [CHANNELS_SETTINGS_KEY, json],
      ),
    ),
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("davinci:notification-channels-changed"));
  }
  return normalized;
}

export async function upsertChannelDestination(
  destination: ChannelDestinationMeta,
  secret?: ChannelSecretPayload,
  dbOverride?: Database,
): Promise<ChannelDestinationMeta[]> {
  if (secret) {
    await saveChannelSecret(destination.id, secret);
  }
  const current = await loadChannelDestinations(dbOverride);
  const idx = current.findIndex((d) => d.id === destination.id);
  const next =
    idx >= 0
      ? current.map((d, i) => (i === idx ? destination : d))
      : [...current, destination];
  return saveChannelDestinations(next, dbOverride);
}

export async function removeChannelDestination(
  destinationId: string,
  dbOverride?: Database,
): Promise<ChannelDestinationMeta[]> {
  if (destinationId === DEFAULT_DESKTOP_DESTINATION.id) {
    return loadChannelDestinations(dbOverride);
  }
  await clearChannelSecret(destinationId);
  const current = await loadChannelDestinations(dbOverride);
  const next = current.filter((d) => d.id !== destinationId);
  emitNotificationLog(
    `Removed notification channel destination (${destinationId})`,
  );
  return saveChannelDestinations(next, dbOverride);
}
