use keyring::Entry;
use tauri::WebviewWindow;

use crate::command_auth::reject_plugin_runner;

const SERVICE: &str = "com.davinci.notes.ai-provider";

fn entry(provider_id: &str) -> Result<Entry, String> {
  Entry::new(SERVICE, provider_id).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_ai_key(window: WebviewWindow, provider_id: String, api_key: String) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  entry(&provider_id)?.set_password(&api_key).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_ai_key(window: WebviewWindow, provider_id: String) -> Result<Option<String>, String> {
  reject_plugin_runner(&window)?;
  match entry(&provider_id)?.get_password() {
    Ok(key) => Ok(Some(key)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
pub fn clear_ai_key(window: WebviewWindow, provider_id: String) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  match entry(&provider_id)?.delete_credential() {
    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(error.to_string()),
  }
}
