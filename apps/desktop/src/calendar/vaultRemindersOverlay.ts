import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { getVaultIndexDb, withDbLock } from "../vault/sqliteIndex";

export interface VaultReminderRow {
  id: number;
  note_path: string;
  line: number;
  due_at_utc: string;
  tz: string;
  text: string;
  done: number;
}

export interface ReminderQueryDb {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
}

export function reminderRowToCalendarEvent(row: VaultReminderRow): NormalizedCalendarEvent {
  const startDt = new Date(row.due_at_utc);
  const validStart = isNaN(startDt.getTime()) ? new Date() : startDt;
  const endDt = new Date(validStart.getTime() + 30 * 60_000);

  return {
    id: `reminder_${row.id}`,
    calendarId: "vault_reminders",
    title: `🔔 ${row.text}`,
    description: `Note: ${row.note_path} (line ${row.line})`,
    location: row.note_path,
    startIso: validStart.toISOString(),
    endIso: endDt.toISOString(),
    isAllDay: false,
    status: "confirmed",
    htmlLink: "",
    attendees: [],
    syncStatus: "synced",
    updatedAt: validStart.toISOString(),
  };
}

export async function getVaultRemindersOverlayEvents(
  fromIso: string,
  toIso: string,
  dbOverride?: ReminderQueryDb
): Promise<NormalizedCalendarEvent[]> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const rows = await withDbLock(() =>
    db.select<VaultReminderRow[]>(
      `SELECT id, note_path, line, due_at_utc, tz, text, done
       FROM reminders
       WHERE done = 0 AND due_at_utc >= $1 AND due_at_utc <= $2
       ORDER BY due_at_utc ASC`,
      [fromIso, toIso]
    )
  );
  return rows.map(reminderRowToCalendarEvent);
}
