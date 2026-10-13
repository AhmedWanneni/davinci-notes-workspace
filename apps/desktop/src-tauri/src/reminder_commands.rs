use crate::reminder_db::{
  dismiss_reminder_db, get_db_path, open_connection, snooze_reminder_db,
};
use crate::reminder_scheduler::ReminderScheduler;
use chrono::Utc;
use std::sync::Arc;
use tauri::{command, AppHandle, State};

pub type SchedulerState = Arc<ReminderScheduler>;

#[command]
pub async fn reschedule_reminders(
  scheduler: State<'_, SchedulerState>,
) -> Result<(), String> {
  scheduler.reschedule();
  Ok(())
}

#[command]
pub async fn snooze_reminder(
  app: AppHandle,
  scheduler: State<'_, SchedulerState>,
  reminder_key: String,
  snooze_until_utc: String,
) -> Result<bool, String> {
  let db_path = get_db_path(&app).ok_or_else(|| "Failed to resolve db path".to_string())?;
  let conn = open_connection(&db_path).map_err(|e| e.to_string())?;
  let now_ms = Utc::now().timestamp_millis();

  let ok = snooze_reminder_db(&conn, &reminder_key, &snooze_until_utc, now_ms)
    .map_err(|e| e.to_string())?;
  if ok {
    scheduler.reschedule();
  }
  Ok(ok)
}

#[command]
pub async fn dismiss_reminder(
  app: AppHandle,
  scheduler: State<'_, SchedulerState>,
  reminder_key: String,
) -> Result<bool, String> {
  let db_path = get_db_path(&app).ok_or_else(|| "Failed to resolve db path".to_string())?;
  let conn = open_connection(&db_path).map_err(|e| e.to_string())?;
  let now_ms = Utc::now().timestamp_millis();

  let ok = dismiss_reminder_db(&conn, &reminder_key, now_ms)
    .map_err(|e| e.to_string())?;
  if ok {
    scheduler.reschedule();
  }
  Ok(ok)
}
