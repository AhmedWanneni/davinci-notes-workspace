use crate::reminder_db::PendingReminder;
use tauri::AppHandle;

fn get_notification_icon() -> Option<String> {
  let dev_p = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
    .join("icons")
    .join("128x128.png");
  if dev_p.exists() {
    return Some(dev_p.to_string_lossy().into_owned());
  }
  None
}

pub fn dispatch_native_notification(
  #[allow(unused)] app: Option<&AppHandle>,
  title: &str,
  body: &str,
) -> Result<(), String> {
  #[cfg(target_os = "macos")]
  {
    crate::macos_panel::setup_notification_identity();

    let mut notif = mac_notification_sys::Notification::new();
    notif.title(title);
    notif.message(body);
    let icon = get_notification_icon();
    if let Some(ref icon_path) = icon {
      notif.content_image(icon_path);
    }
    notif.send().map_err(|e| e.to_string())?;
    Ok(())
  }

  #[cfg(not(target_os = "macos"))]
  {
    use tauri_plugin_notification::NotificationExt;
    if let Some(app) = app {
      let mut builder = app.notification().builder().title(title).body(body);
      if let Some(icon) = get_notification_icon() {
        builder = builder.icon(icon);
      }
      builder.show().map_err(|e| e.to_string())
    } else {
      Err("Missing app handle for non-macOS notification".to_string())
    }
  }
}

pub fn send_reminder_notification(app: &AppHandle, reminders: &[PendingReminder]) {
  if reminders.is_empty() {
    return;
  }

  let (title, body) = if reminders.len() == 1 {
    let r = &reminders[0];
    (
      format!("🦉 Reminder: {}", r.note_path),
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
      format!("🦉 {} reminders due", count),
      lines.join("\n"),
    )
  };

  if let Err(e) = dispatch_native_notification(Some(app), &title, &body) {
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
      "🦉 Missed Reminder".to_string(),
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
      format!("🦉 {} missed reminders", count),
      lines.join("\n"),
    )
  };

  if let Err(e) = dispatch_native_notification(Some(app), &title, &body) {
    log::error!("Failed to show missed notification: {}", e);
  }
}

#[tauri::command]
pub fn send_desktop_notification_command(
  app: AppHandle,
  title: String,
  body: String,
) -> Result<(), String> {
  dispatch_native_notification(Some(&app), &title, &body)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  #[cfg(target_os = "macos")]
  fn test_macos_dispatch() {
    let res = dispatch_native_notification(
      None,
      "Sophia Test",
      "Testing Sophia owl notification logo",
    );
    assert!(res.is_ok());
  }
}
