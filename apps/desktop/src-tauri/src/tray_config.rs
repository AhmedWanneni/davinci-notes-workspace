use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const SETTINGS_FILE_NAME: &str = "davinci-tray-settings.json";

pub fn get_settings_path(app: &AppHandle) -> Option<PathBuf> {
  app.path().app_config_dir().ok().map(|dir| dir.join(SETTINGS_FILE_NAME))
}

pub fn load_saved_keep_in_tray(app: &AppHandle) -> bool {
  let default_val = cfg!(target_os = "macos");
  let Some(path) = get_settings_path(app) else {
    return default_val;
  };
  let Ok(content) = std::fs::read_to_string(path) else {
    return default_val;
  };
  let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) else {
    return default_val;
  };
  parsed.get("keepInTray").and_then(|v| v.as_bool()).unwrap_or(default_val)
}

pub fn save_keep_in_tray_to_disk(app: &AppHandle, enabled: bool) {
  let Some(path) = get_settings_path(app) else {
    return;
  };
  if let Some(parent) = path.parent() {
    let _ = std::fs::create_dir_all(parent);
  }
  let json = serde_json::json!({ "keepInTray": enabled });
  let _ = std::fs::write(path, json.to_string());
}
