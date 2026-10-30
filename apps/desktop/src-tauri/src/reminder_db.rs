use rusqlite::{params, Connection, Result};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PendingReminder {
  pub id: i64,
  pub reminder_key: String,
  pub note_path: String,
  pub line: i64,
  pub due_at_utc: String,
  pub tz: String,
  pub text: String,
  pub done: bool,
}

pub fn compute_reminder_key(note_path: &str, due_at_utc: &str, text: &str) -> String {
  let mut hasher = blake3::Hasher::new();
  hasher.update(note_path.as_bytes());
  hasher.update(b"|");
  hasher.update(due_at_utc.as_bytes());
  hasher.update(b"|");
  hasher.update(text.as_bytes());
  hasher.finalize().to_hex().to_string()
}

pub fn get_db_path(app: &AppHandle) -> Option<PathBuf> {
  app.path().app_data_dir().ok().map(|d| d.join("vault-index.db"))
}

pub fn open_connection(path: &Path) -> Result<Connection> {
  let conn = Connection::open(path)?;
  conn.execute_batch(
    "PRAGMA busy_timeout = 10000;
     PRAGMA foreign_keys = ON;",
  )?;
  Ok(conn)
}

pub fn query_due_reminders(conn: &Connection, now_utc_iso: &str) -> Result<Vec<PendingReminder>> {
  let mut stmt = conn.prepare(
    "SELECT r.id, r.note_path, r.line, r.due_at_utc, r.tz, r.text, r.done
     FROM reminders r
     LEFT JOIN reminder_local_state s
       ON s.note_path = r.note_path
      AND s.due_at_utc = r.due_at_utc
      AND s.text = r.text
     WHERE r.done = 0
       AND (
         (s.status IS NULL AND r.due_at_utc <= ?1)
         OR (s.status = 'snoozed' AND s.snooze_until_utc IS NOT NULL AND s.snooze_until_utc <= ?1)
       )
     ORDER BY r.due_at_utc ASC",
  )?;

  let rows = stmt.query_map(params![now_utc_iso], |row| {
    let note_path: String = row.get(1)?;
    let due_at_utc: String = row.get(3)?;
    let text: String = row.get(5)?;
    let reminder_key = compute_reminder_key(&note_path, &due_at_utc, &text);
    let done_int: i64 = row.get(6)?;

    Ok(PendingReminder {
      id: row.get(0)?,
      reminder_key,
      note_path,
      line: row.get(2)?,
      due_at_utc,
      tz: row.get(4)?,
      text,
      done: done_int != 0,
    })
  })?;

  let mut results = Vec::new();
  for reminder in rows {
    results.push(reminder?);
  }
  Ok(results)
}

pub fn query_earliest_future_due(
  conn: &Connection,
  now_utc_iso: &str,
) -> Result<Option<String>> {
  let mut stmt = conn.prepare(
    "SELECT MIN(next_time) FROM (
       SELECT r.due_at_utc AS next_time
       FROM reminders r
       LEFT JOIN reminder_local_state s
         ON s.note_path = r.note_path
        AND s.due_at_utc = r.due_at_utc
        AND s.text = r.text
       WHERE r.done = 0
         AND s.status IS NULL
         AND r.due_at_utc > ?1
       UNION ALL
       SELECT s.snooze_until_utc AS next_time
       FROM reminders r
       INNER JOIN reminder_local_state s
         ON s.note_path = r.note_path
        AND s.due_at_utc = r.due_at_utc
        AND s.text = r.text
       WHERE r.done = 0
         AND s.status = 'snoozed'
         AND s.snooze_until_utc IS NOT NULL
         AND s.snooze_until_utc > ?1
     )",
  )?;

  let res: Option<String> = stmt.query_row(params![now_utc_iso], |row| row.get(0))?;
  Ok(res)
}

pub fn record_reminder_status(
  conn: &mut Connection,
  reminders: &[PendingReminder],
  status: &str,
  now_ms: i64,
) -> Result<()> {
  let tx = conn.transaction()?;
  {
    let mut stmt = tx.prepare(
      "INSERT INTO reminder_local_state (
         reminder_key, note_path, due_at_utc, text, status, notified_at, snooze_until_utc, updated_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7)
       ON CONFLICT(reminder_key) DO UPDATE SET
         status = excluded.status,
         notified_at = excluded.notified_at,
         snooze_until_utc = NULL,
         updated_at = excluded.updated_at",
    )?;

    for r in reminders {
      stmt.execute(params![
        r.reminder_key,
        r.note_path,
        r.due_at_utc,
        r.text,
        status,
        now_ms,
        now_ms
      ])?;
    }
  }
  tx.commit()?;
  Ok(())
}

pub fn snooze_reminder_db(
  conn: &Connection,
  reminder_key: &str,
  note_path: Option<&str>,
  due_at_utc: Option<&str>,
  text: Option<&str>,
  snooze_until_utc: &str,
  now_ms: i64,
) -> Result<bool> {
  let count = conn.execute(
    "UPDATE reminder_local_state
     SET status = 'snoozed',
         snooze_until_utc = ?1,
         updated_at = ?2
     WHERE reminder_key = ?3",
    params![snooze_until_utc, now_ms, reminder_key],
  )?;
  if count > 0 {
    return Ok(true);
  }

  let np = note_path.unwrap_or("");
  let due = due_at_utc.unwrap_or("");
  let txt = text.unwrap_or("");
  conn.execute(
    "INSERT INTO reminder_local_state (
       reminder_key, note_path, due_at_utc, text, status, notified_at, snooze_until_utc, updated_at
     ) VALUES (?1, ?2, ?3, ?4, 'snoozed', ?5, ?6, ?5)
     ON CONFLICT(reminder_key) DO UPDATE SET
       status = 'snoozed',
       snooze_until_utc = excluded.snooze_until_utc,
       updated_at = excluded.updated_at",
    params![reminder_key, np, due, txt, now_ms, snooze_until_utc],
  )?;
  Ok(true)
}

pub fn dismiss_reminder_db(
  conn: &Connection,
  reminder_key: &str,
  now_ms: i64,
) -> Result<bool> {
  let count = conn.execute(
    "UPDATE reminder_local_state
     SET status = 'dismissed',
         updated_at = ?1
     WHERE reminder_key = ?2",
    params![now_ms, reminder_key],
  )?;
  Ok(count > 0)
}

pub fn catchup_missed_reminders_db(
  conn: &mut Connection,
  now_utc_iso: &str,
  now_ms: i64,
) -> Result<Vec<PendingReminder>> {
  let due = query_due_reminders(conn, now_utc_iso)?;
  if !due.is_empty() {
    record_reminder_status(conn, &due, "missed", now_ms)?;
  }
  Ok(due)
}
