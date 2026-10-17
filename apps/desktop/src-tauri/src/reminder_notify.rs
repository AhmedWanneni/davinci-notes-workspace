use crate::reminder_db::PendingReminder;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

pub fn send_reminder_notification(app: &AppHandle, reminders: &[PendingReminder]) {
  if reminders.is_empty() {
    return;
  }

  let (title, body) = if reminders.len() == 1 {
    let r = &reminders[0];
    (
      format!("Reminder: {}", r.note_path),
      r.text.clone(),
    )
  } else {
    let count = reminders.len();
    let mut lines = Vec::new();
    for r in reminders.iter().take(3) {
      lines.push(format!("• {}", r.text));
    }
    if count > 3 {
      lines.push(format!("... and {} more", count - 3));
    }
    (
      format!("{} reminders due", count),
      lines.join("\n"),
    )
  };

  if let Err(e) = app.notification().builder().title(title).body(body).show() {
    log::error!("Failed to show reminder notification: {}", e);
  }
}

pub fn send_missed_notification(app: &AppHandle, missed: &[PendingReminder]) {
  if missed.is_empty() {
    return;
  }

  let (title, body) = if missed.len() == 1 {
    let r = &missed[0];
    (
      "Missed Reminder".to_string(),
      format!("{}: {}", r.note_path, r.text),
    )
  } else {
    let count = missed.len();
    let mut lines = Vec::new();
    for r in missed.iter().take(3) {
      lines.push(format!("• {}", r.text));
    }
    if count > 3 {
      lines.push(format!("... and {} more", count - 3));
    }
    (
      format!("{} missed reminders", count),
      lines.join("\n"),
    )
  };

  if let Err(e) = app.notification().builder().title(title).body(body).show() {
    log::error!("Failed to show missed notification: {}", e);
  }
}
