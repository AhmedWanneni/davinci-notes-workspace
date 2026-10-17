import type Database from "@tauri-apps/plugin-sql";

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
  category: "missed" | "today" | "upcoming";
}

export interface RemindersViewResult {
  missed: ReminderViewItem[];
  today: ReminderViewItem[];
  upcoming: ReminderViewItem[];
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

/**
 * Queries all incomplete reminders joined with local device state and categorizes them.
 */
export async function queryRemindersForView(
  db: Database,
  now = new Date(),
): Promise<RemindersViewResult> {
  const rows = await db.select<ReminderJoinRow[]>(
    `SELECT r.id, r.note_path, r.line, r.due_at_utc, r.tz, r.text, r.done,
            s.reminder_key AS local_key, s.status, s.snooze_until_utc
     FROM reminders r
     LEFT JOIN reminder_local_state s
       ON s.note_path = r.note_path
      AND s.due_at_utc = r.due_at_utc
      AND s.text = r.text
     WHERE r.done = 0
     ORDER BY COALESCE(s.snooze_until_utc, r.due_at_utc) ASC`,
  );

  const missed: ReminderViewItem[] = [];
  const today: ReminderViewItem[] = [];
  const upcoming: ReminderViewItem[] = [];
  const all: ReminderViewItem[] = [];

  for (const row of rows) {
    const effectiveDueUtc = row.snooze_until_utc || row.due_at_utc;
    const category = categorizeReminderDue(effectiveDueUtc, now);
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
      done: row.done !== 0,
      status: row.status,
      snoozeUntilUtc: row.snooze_until_utc,
      effectiveDueUtc,
      category,
    };

    all.push(item);
    if (category === "missed") {
      missed.push(item);
    } else if (category === "today") {
      today.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { missed, today, upcoming, all };
}
