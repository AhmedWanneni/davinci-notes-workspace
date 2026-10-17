import { getVaultIndexDb, withDbLock } from "./sqliteIndex";

export type SnoozePreset = "10m" | "1h" | "tomorrow";

/**
 * Computes the target ISO UTC timestamp for a snooze preset.
 * - '10m': +10 minutes from now
 * - '1h': +1 hour from now
 * - 'tomorrow': 9:00 AM local time tomorrow, formatted as UTC ISO
 */
export function computeSnoozeTime(
  preset: SnoozePreset,
  now: Date = new Date(),
): string {
  if (preset === "10m") {
    return new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  }
  if (preset === "1h") {
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  }

  // Tomorrow morning (09:00 local time)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.toISOString();
}

export interface SnoozeTarget {
  reminderKey?: string;
  notePath: string;
  dueAtUtc: string;
  text: string;
}

/**
 * Snoozes a reminder until the specified UTC instant.
 * Writes ONLY to local device state (`reminder_local_state`), NEVER to markdown.
 */
export async function snoozeReminderAction(
  target: SnoozeTarget,
  snoozeUntilUtc: string,
): Promise<void> {
  // 1. Try Tauri invoke if in desktop runtime
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("snooze_reminder", {
      reminderKey: target.reminderKey,
      notePath: target.notePath,
      dueAtUtc: target.dueAtUtc,
      text: target.text,
      snoozeUntilUtc,
    });
    return;
  } catch {
    // Fall back to direct SQLite query (e.g. in test environment)
  }

  // 2. Direct SQLite fallback
  try {
    const db = await getVaultIndexDb();
    const key =
      target.reminderKey ||
      `${target.notePath}|${target.dueAtUtc}|${target.text}`;
    const nowMs = Date.now();

    await withDbLock(async () => {
      await db.execute(
        `INSERT INTO reminder_local_state (
           reminder_key, note_path, due_at_utc, text, status, notified_at, snooze_until_utc, updated_at
         ) VALUES ($1, $2, $3, $4, 'snoozed', $5, $6, $5)
         ON CONFLICT(reminder_key) DO UPDATE SET
           status = 'snoozed',
           snooze_until_utc = excluded.snooze_until_utc,
           updated_at = excluded.updated_at`,
        [
          key,
          target.notePath,
          target.dueAtUtc,
          target.text,
          nowMs,
          snoozeUntilUtc,
        ],
      );
    });
  } catch (err) {
    console.error("Failed to update reminder_local_state for snooze:", err);
  }
}
