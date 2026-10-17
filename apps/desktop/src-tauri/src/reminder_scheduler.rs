use crate::reminder_db::{
  catchup_missed_reminders_db, open_connection, query_due_reminders, query_earliest_future_due,
  record_reminder_status,
};
use crate::reminder_notify::{send_missed_notification, send_reminder_notification};
use chrono::{DateTime, Utc};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Notify;
use tokio::{select, time::sleep};

pub struct ReminderScheduler {
  notify: Arc<Notify>,
  db_path: PathBuf,
  app: AppHandle,
}

impl ReminderScheduler {
  pub fn new(app: AppHandle, db_path: PathBuf) -> Self {
    Self {
      notify: Arc::new(Notify::new()),
      db_path,
      app,
    }
  }

  pub fn reschedule(&self) {
    self.notify.notify_waiters();
  }

  pub fn start(self: Arc<Self>) {
    tauri::async_runtime::spawn(async move {
      self.run().await;
    });
  }

  async fn run(&self) {
    let now = Utc::now();
    let now_iso = now.to_rfc3339();
    let now_ms = now.timestamp_millis();

    if let Ok(mut conn) = open_connection(&self.db_path) {
      if let Ok(missed) = catchup_missed_reminders_db(&mut conn, &now_iso, now_ms) {
        if !missed.is_empty() {
          send_missed_notification(&self.app, &missed);
          let _ = self.app.emit("davinci-reminders-missed", &missed);
        }
      }
    }

    loop {
      let sleep_duration = self.process_due_and_get_sleep();

      match sleep_duration {
        Some(dur) => {
          select! {
            _ = self.notify.notified() => {
              log::debug!("ReminderScheduler woken up by reschedule signal");
            }
            _ = sleep(dur) => {
              log::debug!("ReminderScheduler timer expired");
            }
          }
        }
        None => {
          self.notify.notified().await;
        }
      }
    }
  }

  pub fn process_due_and_get_sleep(&self) -> Option<Duration> {
    let mut conn = open_connection(&self.db_path).ok()?;
    let now = Utc::now();
    let now_iso = now.to_rfc3339();
    let now_ms = now.timestamp_millis();

    if let Ok(due) = query_due_reminders(&conn, &now_iso) {
      if !due.is_empty() {
        send_reminder_notification(&self.app, &due);
        let _ = self.app.emit("davinci-reminders-due", &due);
        let _ = record_reminder_status(&mut conn, &due, "notified", now_ms);
      }
    }


    let next_due_iso = query_earliest_future_due(&conn, &now_iso).ok()??;
    let next_time = DateTime::parse_from_rfc3339(&next_due_iso).ok()?.with_timezone(&Utc);

    let diff = next_time.signed_duration_since(Utc::now());
    if diff.num_milliseconds() <= 0 {
      Some(Duration::from_millis(0))
    } else {
      Some(Duration::from_millis(diff.num_milliseconds() as u64))
    }
  }
}
