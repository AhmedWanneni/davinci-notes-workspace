import type { Note, Reminder } from "@app/core-types";
import { parseReminders } from "@app/indexer";
import type Database from "@tauri-apps/plugin-sql";

export interface ReminderRow {
  id: number;
  note_path: string;
  line: number;
  due_at_utc: string;
  tz: string;
  text: string;
  done: number;
}

async function notifyScheduler(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("reschedule_reminders");
  } catch {
    // Ignore outside Tauri runtime (e.g. tests)
  }
}

/** Clear all rows in the reminders table. */
export async function clearReminders(db: Database): Promise<void> {
  await db.execute("DELETE FROM reminders");
  void notifyScheduler();
}

/** Batch remove reminders for specified note paths. */
export async function removeRemindersBatch(
  db: Database,
  paths: readonly string[],
  batchSize = 50,
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  for (let i = 0; i < paths.length; i += batchSize) {
    const chunk = paths.slice(i, i + batchSize);
    const placeholders = chunk.map((_, idx) => `$${idx + 1}`).join(", ");
    await db.execute(
      `DELETE FROM reminders WHERE note_path IN (${placeholders})`,
      chunk,
    );
  }
  void notifyScheduler();
}

/** Batch persist reminders for notes: deletes existing rows and bulk inserts. */
export async function replaceRemindersBatch(
  db: Database,
  notes: readonly Note[],
  batchSize = 50,
): Promise<void> {
  if (notes.length === 0) {
    return;
  }

  const notePaths = notes.map((n) => n.path);
  await removeRemindersBatch(db, notePaths, batchSize);

  const allReminders: { notePath: string; reminder: Reminder }[] = [];
  for (const note of notes) {
    const reminders =
      note.reminders !== undefined
        ? note.reminders
        : parseReminders(note.content);

    for (const reminder of reminders) {
      allReminders.push({ notePath: note.path, reminder });
    }
  }

  if (allReminders.length === 0) {
    return;
  }

  for (let i = 0; i < allReminders.length; i += batchSize) {
    const chunk = allReminders.slice(i, i + batchSize);
    const clauses: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    for (const item of chunk) {
      clauses.push(
        `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5})`,
      );
      params.push(
        item.notePath,
        item.reminder.line,
        item.reminder.dueAtUtc,
        item.reminder.tz,
        item.reminder.text,
        item.reminder.done ? 1 : 0,
      );
      pIdx += 6;
    }

    await db.execute(
      `INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done)
       VALUES ${clauses.join(", ")}`,
      params,
    );
  }
  void notifyScheduler();
}

/** Query the next N upcoming (incomplete, due at or after now) reminders. */
export async function queryUpcomingReminders(
  db: Database,
  limit = 20,
  nowUtc = new Date().toISOString(),
): Promise<ReminderRow[]> {
  return db.select<ReminderRow[]>(
    `SELECT id, note_path, line, due_at_utc, tz, text, done
     FROM reminders
     WHERE done = 0 AND due_at_utc >= $1
     ORDER BY due_at_utc ASC
     LIMIT $2`,
    [nowUtc, limit],
  );
}

/** Query all overdue (incomplete, due before now) reminders. */
export async function queryOverdueReminders(
  db: Database,
  nowUtc = new Date().toISOString(),
): Promise<ReminderRow[]> {
  return db.select<ReminderRow[]>(
    `SELECT id, note_path, line, due_at_utc, tz, text, done
     FROM reminders
     WHERE done = 0 AND due_at_utc < $1
     ORDER BY due_at_utc ASC`,
    [nowUtc],
  );
}

/** Query all reminders in a specific note ordered by line number. */
export async function queryRemindersByNote(
  db: Database,
  notePath: string,
): Promise<ReminderRow[]> {
  return db.select<ReminderRow[]>(
    `SELECT id, note_path, line, due_at_utc, tz, text, done
     FROM reminders
     WHERE note_path = $1
     ORDER BY line ASC`,
    [notePath],
  );
}
