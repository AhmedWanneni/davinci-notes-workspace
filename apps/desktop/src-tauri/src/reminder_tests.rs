use crate::reminder_db::*;
use rusqlite::Connection;
use std::time::Instant;

fn setup_test_db() -> Connection {
  let conn = Connection::open_in_memory().expect("open in-memory db");
  conn
    .execute_batch(
      "CREATE TABLE notes (path TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL);
       CREATE TABLE reminders (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         note_path TEXT NOT NULL,
         line INTEGER NOT NULL,
         due_at_utc TEXT NOT NULL,
         tz TEXT NOT NULL,
         text TEXT NOT NULL,
         done INTEGER NOT NULL DEFAULT 0
       );
       CREATE INDEX idx_reminders_done_due ON reminders(done, due_at_utc);
       CREATE TABLE reminder_local_state (
         reminder_key TEXT PRIMARY KEY NOT NULL,
         note_path TEXT NOT NULL,
         due_at_utc TEXT NOT NULL,
         text TEXT NOT NULL,
         status TEXT NOT NULL,
         notified_at INTEGER NOT NULL,
         snooze_until_utc TEXT,
         updated_at INTEGER NOT NULL
       );
       CREATE INDEX idx_reminder_local_status ON reminder_local_state(status);",
    )
    .expect("create test tables");
  conn
}

#[test]
fn test_adversarial_5s_fire_once_window_closed() {
  let mut conn = setup_test_db();
  conn
    .execute(
      "INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done)
       VALUES ('Inbox.md', 1, '2026-10-13T12:00:05.000Z', 'UTC', 'Call Alice', 0)",
      [],
    )
    .unwrap();

  let before = query_due_reminders(&conn, "2026-10-13T12:00:04.000Z").unwrap();
  assert!(before.is_empty(), "Must not fire before due time");

  let due = query_due_reminders(&conn, "2026-10-13T12:00:05.000Z").unwrap();
  assert_eq!(due.len(), 1, "Must fire when due");

  record_reminder_status(&mut conn, &due, "notified", 1791892805000).unwrap();

  let after = query_due_reminders(&conn, "2026-10-13T12:00:10.000Z").unwrap();
  assert!(after.is_empty(), "Must not re-fire once notified");
}

#[test]
fn test_adversarial_quit_and_relaunch_catchup() {
  let mut conn = setup_test_db();
  conn
    .execute(
      "INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done)
       VALUES ('Inbox.md', 2, '2026-10-13T08:00:00.000Z', 'UTC', 'Missed task', 0)",
      [],
    )
    .unwrap();

  let missed = catchup_missed_reminders_db(&mut conn, "2026-10-13T09:00:00.000Z", 1791882000000).unwrap();
  assert_eq!(missed.len(), 1, "Must surface past-due reminder as missed on launch");

  let missed_again = catchup_missed_reminders_db(&mut conn, "2026-10-13T09:05:00.000Z", 1791882300000).unwrap();
  assert!(missed_again.is_empty(), "Must not re-surface missed reminder twice");
}

#[test]
fn test_adversarial_edit_pending_reminder_reschedules() {
  let conn = setup_test_db();
  conn
    .execute(
      "INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done)
       VALUES ('Inbox.md', 3, '2026-10-13T12:00:00.000Z', 'UTC', 'Move me', 0)",
      [],
    )
    .unwrap();

  let next1 = query_earliest_future_due(&conn, "2026-10-13T11:00:00.000Z").unwrap();
  assert_eq!(next1, Some("2026-10-13T12:00:00.000Z".to_string()));

  conn
    .execute(
      "UPDATE reminders SET due_at_utc = '2026-10-13T15:00:00.000Z' WHERE note_path = 'Inbox.md' AND line = 3",
      [],
    )
    .unwrap();

  let check_old = query_due_reminders(&conn, "2026-10-13T12:05:00.000Z").unwrap();
  assert!(check_old.is_empty(), "Old fire must be cancelled after edit");

  let next2 = query_earliest_future_due(&conn, "2026-10-13T11:00:00.000Z").unwrap();
  assert_eq!(next2, Some("2026-10-13T15:00:00.000Z".to_string()));
}

#[test]
fn test_adversarial_complete_task_cancels_notification() {
  let conn = setup_test_db();
  conn
    .execute(
      "INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done)
       VALUES ('Inbox.md', 4, '2026-10-13T12:00:00.000Z', 'UTC', 'Buy milk', 1)",
      [],
    )
    .unwrap();

  let due = query_due_reminders(&conn, "2026-10-13T12:05:00.000Z").unwrap();
  assert!(due.is_empty(), "Completed reminder must not fire");
}

#[test]
fn test_adversarial_clock_jumps_and_timezone_invariance() {
  let mut conn = setup_test_db();
  conn
    .execute(
      "INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done)
       VALUES ('Inbox.md', 5, '2026-10-13T14:00:00.000Z', 'Europe/London', 'Sync call', 0)",
      [],
    )
    .unwrap();

  let forward_due = query_due_reminders(&conn, "2026-10-13T14:30:00.000Z").unwrap();
  assert_eq!(forward_due.len(), 1, "Clock forward jump detects due reminder");
  record_reminder_status(&mut conn, &forward_due, "notified", 1791901800000).unwrap();

  let backward_due = query_due_reminders(&conn, "2026-10-13T10:00:00.000Z").unwrap();
  assert!(backward_due.is_empty(), "Clock backward jump does not re-fire");
}

#[test]
fn test_adversarial_spring_forward_and_fall_back_dst() {
  let conn = setup_test_db();
  conn
    .execute(
      "INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done) VALUES
       ('Spring.md', 1, '2026-03-29T01:30:00.000Z', 'Europe/London', 'Spring task', 0),
       ('Fall.md', 1, '2026-10-25T01:30:00.000Z', 'Europe/London', 'Fall task', 0)",
      [],
    )
    .unwrap();

  let due1 = query_due_reminders(&conn, "2026-03-29T02:00:00.000Z").unwrap();
  assert_eq!(due1.len(), 1);
  assert_eq!(due1[0].note_path, "Spring.md");

  let due2 = query_due_reminders(&conn, "2026-10-25T02:00:00.000Z").unwrap();
  assert_eq!(due2.len(), 2);
}

#[test]
fn test_adversarial_500_simultaneous_reminders_grouped() {
  let mut conn = setup_test_db();
  let t0 = Instant::now();
  let tx = conn.transaction().unwrap();
  {
    let mut stmt = tx
      .prepare("INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done) VALUES (?1, ?2, '2026-10-13T12:00:00.000Z', 'UTC', ?3, 0)")
      .unwrap();
    for i in 0..500 {
      stmt.execute(rusqlite::params![format!("Note_{}.md", i), i, format!("Task {}", i)]).unwrap();
    }
  }
  tx.commit().unwrap();

  let query_start = Instant::now();
  let due = query_due_reminders(&conn, "2026-10-13T12:00:00.000Z").unwrap();
  let query_elapsed = query_start.elapsed();
  assert_eq!(due.len(), 500, "Must return all 500 due reminders");
  assert!(query_elapsed.as_millis() < 50, "Querying 500 reminders must take <50ms (took {:?})", query_elapsed);

  let record_start = Instant::now();
  record_reminder_status(&mut conn, &due, "notified", 1791892800000).unwrap();
  let record_elapsed = record_start.elapsed();
  assert!(record_elapsed.as_millis() < 100, "Recording 500 reminders status must take <100ms (took {:?})", record_elapsed);

  println!("[test] 500 reminders: query={:?}, record={:?}, total={:?}", query_elapsed, record_elapsed, t0.elapsed());
}

#[test]
fn test_adversarial_idle_wakeups_1000_future_reminders() {
  let mut conn = setup_test_db();
  let tx = conn.transaction().unwrap();
  {
    let mut stmt = tx
      .prepare("INSERT INTO reminders (note_path, line, due_at_utc, tz, text, done) VALUES (?1, ?2, ?3, 'UTC', ?4, 0)")
      .unwrap();
    for i in 0..1000 {
      let future_iso = format!("2026-10-14T{:02}:{:02}:00.000Z", (i / 60) % 24, i % 60);
      stmt.execute(rusqlite::params![format!("Future_{}.md", i), i, future_iso, format!("Future Task {}", i)]).unwrap();
    }
  }
  tx.commit().unwrap();

  let t0 = Instant::now();
  let next = query_earliest_future_due(&conn, "2026-10-13T12:00:00.000Z").unwrap();
  let elapsed = t0.elapsed();
  assert!(next.is_some());
  assert!(elapsed.as_millis() < 20, "Querying next of 1,000 future reminders must take <20ms (took {:?})", elapsed);

  println!("[test] 1,000 future reminders: query next took {:?}", elapsed);
}
