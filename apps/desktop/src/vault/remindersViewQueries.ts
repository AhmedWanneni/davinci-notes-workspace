import type Database from "@tauri-apps/plugin-sql";
import { getVaultIndexDb, withDbLock } from "./sqliteIndex";

export { getVaultIndexDb as getIndexDb };

export type ReminderCategory = "missed" | "today" | "upcoming" | "done";

export interface ReminderViewItem {
  id: number;
  reminderKey: string;
  notePath: string;
  line: number;
  dueAtUtc: string;
  tz: string;
  text: string;
  done: boolean;
  status: string | null;
  snoozeUntilUtc: string | null;
  effectiveDueUtc: string;
  category: ReminderCategory;
  channels: string[] | null;
  deliveryError: string | null;
}

export interface RemindersViewResult {
  missed: ReminderViewItem[];
  today: ReminderViewItem[];
  upcoming: ReminderViewItem[];
  done: ReminderViewItem[];
  all: ReminderViewItem[];
}

interface ReminderJoinRow {
  id: number;
  note_path: string;
  line: number;
  due_at_utc: string;
  tz: string;
  text: string;
  done: number;
  local_key: string | null;
  status: string | null;
  snooze_until_utc: string | null;
  channels_json?: string | null;
  delivery_error?: string | null;
}

/**
 * Categorizes an effective UTC due instant relative to current time and local today.
 */
export function categorizeReminderDue(
  effectiveDueUtc: string,
  now = new Date(),
): "missed" | "today" | "upcoming" {
  const dueTime = new Date(effectiveDueUtc).getTime();
  const nowTime = now.getTime();

  if (dueTime < nowTime) {
    return "missed";
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();

  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

  if (dueTime >= startOfToday && dueTime <= endOfToday) {
    return "today";
  }

  return "upcoming";
}

function parseChannelsJson(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed;
    }
  } catch {
    // Ignore malformed JSON
  }
  return null;
}

/**
 * Queries all reminders (active and done) joined with local device state and categorizes them.
 * Strictly serialized through `withDbLock` per ADR-0168.
 */
export async function queryRemindersForView(
  dbOverride?: Database,
  now = new Date(),
): Promise<RemindersViewResult> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const rows = await withDbLock(() =>
    db.select<ReminderJoinRow[]>(
      `SELECT r.id, r.note_path, r.line, r.due_at_utc, r.tz, r.text, r.done,
              s.reminder_key AS local_key, s.status, s.snooze_until_utc,
              s.channels_json, s.delivery_error
       FROM reminders r
       LEFT JOIN reminder_local_state s
         ON s.note_path = r.note_path
        AND s.due_at_utc = r.due_at_utc
        AND s.text = r.text
       ORDER BY r.done ASC, COALESCE(s.snooze_until_utc, r.due_at_utc) ASC`,
    ),
  );

  const missed: ReminderViewItem[] = [];
  const today: ReminderViewItem[] = [];
  const upcoming: ReminderViewItem[] = [];
  const done: ReminderViewItem[] = [];
  const all: ReminderViewItem[] = [];

  for (const row of rows) {
    const isDone = row.done !== 0;
    const effectiveDueUtc = row.snooze_until_utc || row.due_at_utc;
    const category: ReminderCategory = isDone
      ? "done"
      : categorizeReminderDue(effectiveDueUtc, now);
    const reminderKey =
      row.local_key || `${row.note_path}|${row.due_at_utc}|${row.text}`;

    const item: ReminderViewItem = {
      id: row.id,
      reminderKey,
      notePath: row.note_path,
      line: row.line,
      dueAtUtc: row.due_at_utc,
      tz: row.tz,
      text: row.text,
      done: isDone,
      status: row.status,
      snoozeUntilUtc: row.snooze_until_utc,
      effectiveDueUtc,
      category,
      channels: parseChannelsJson(row.channels_json),
      deliveryError: row.delivery_error ?? null,
    };

    if (isDone) {
      done.push(item);
    } else {
      all.push(item);
      if (category === "missed") {
        missed.push(item);
      } else if (category === "today") {
        today.push(item);
      } else {
        upcoming.push(item);
      }
    }
  }

  return { missed, today, upcoming, done, all };
}

/**
 * Saves per-reminder channel destination overrides or delivery errors in `reminder_local_state`.
 */
export async function upsertReminderChannelState(
  dbOverride: Database | null | undefined,
  params: {
    reminderKey: string;
    notePath: string;
    dueAtUtc: string;
    text: string;
    channels?: string[] | null;
    deliveryError?: string | null;
  },
): Promise<void> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const nowMs = Date.now();
  const channelsJson =
    params.channels === undefined
      ? undefined
      : params.channels === null
        ? null
        : JSON.stringify(params.channels);

  await withDbLock(async () => {
    await db.execute(
      `INSERT INTO reminder_local_state (
         reminder_key, note_path, due_at_utc, text, status, notified_at,
         snooze_until_utc, updated_at, channels_json, delivery_error
       ) VALUES ($1, $2, $3, $4, 'pending', 0, NULL, $5, $6, $7)
       ON CONFLICT(reminder_key) DO UPDATE SET
         updated_at = excluded.updated_at,
         channels_json = CASE WHEN $8 = 1 THEN excluded.channels_json ELSE reminder_local_state.channels_json END,
         delivery_error = CASE WHEN $9 = 1 THEN excluded.delivery_error ELSE reminder_local_state.delivery_error END`,
      [
        params.reminderKey,
        params.notePath,
        params.dueAtUtc,
        params.text,
        nowMs,
        channelsJson ?? null,
        params.deliveryError ?? null,
        params.channels !== undefined ? 1 : 0,
        params.deliveryError !== undefined ? 1 : 0,
      ],
    );
  });
}
