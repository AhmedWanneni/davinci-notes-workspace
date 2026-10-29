use keyring::Entry;
use tauri::WebviewWindow;

use crate::command_auth::reject_plugin_runner;

const SERVICE: &str = "com.sophia.notes.notification-channels";

fn validate_destination_id(destination_id: &str) -> Result<&str, String> {
  let trimmed = destination_id.trim();
  if trimmed.is_empty() || trimmed.len() > 128 {
    return Err("invalid notification destination id".to_string());
  }
  if !trimmed
    .chars()
    .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
  {
    return Err("notification destination id contains invalid characters".to_string());
  }
  Ok(trimmed)
}

fn entry(destination_id: &str) -> Result<Entry, String> {
  let valid_id = validate_destination_id(destination_id)?;
  Entry::new(SERVICE, valid_id).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_notification_secret(
  window: WebviewWindow,
  destination_id: String,
  secret_json: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  if secret_json.trim().is_empty() {
    return Err("notification secret cannot be empty".to_string());
  }
  entry(&destination_id)?
    .set_password(&secret_json)
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_notification_secret(
  window: WebviewWindow,
  destination_id: String,
) -> Result<Option<String>, String> {
  reject_plugin_runner(&window)?;
  match entry(&destination_id)?.get_password() {
    Ok(secret) => Ok(Some(secret)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
pub fn clear_notification_secret(
  window: WebviewWindow,
  destination_id: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  match entry(&destination_id)?.delete_credential() {
    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(error.to_string()),
  }
}

#[cfg(test)]
mod tests {
  use super::validate_destination_id;

  #[test]
  fn validates_destination_ids() {
    assert!(validate_destination_id("tg-main").is_ok());
    assert!(validate_destination_id("slack_team_1").is_ok());
    assert!(validate_destination_id("").is_err());
    assert!(validate_destination_id("../bad").is_err());
    assert!(validate_destination_id("bad space").is_err());
  }
}
