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

pub fn load_stored_ai_key(provider_id: &str) -> Option<String> {
  entry(provider_id)
    .ok()
    .and_then(|e| e.get_password().ok())
    .map(|k| k.trim().to_string())
    .filter(|k| !k.is_empty())
}

pub fn resolve_whisper_api_key(explicit_key: &str) -> Option<String> {
  let trimmed = explicit_key.trim();
  if !trimmed.is_empty() {
    return Some(trimmed.to_string());
  }

  let candidate_ids = [
    "ai-transcription:groq",
    "groq",
    "ai-listening:groq",
    "whisper",
    "openai-compatible",
    "openai",
  ];
  for id in candidate_ids {
    if let Some(key) = load_stored_ai_key(id) {
      return Some(key);
    }
  }

  for env_name in ["GROQ_API_KEY", "OPENAI_API_KEY"] {
    if let Ok(val) = std::env::var(env_name) {
      let clean = val.trim().to_string();
      if !clean.is_empty() {
        return Some(clean);
      }
    }
  }

  None
}
