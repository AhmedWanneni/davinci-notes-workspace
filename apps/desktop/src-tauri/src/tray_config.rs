use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const SETTINGS_FILE_NAME: &str = "davinci-tray-settings.json";
pub const DEFAULT_CAPTURE_SHORTCUT: &str = "Control+Alt+N";
pub const DEFAULT_CAPTURE_TARGET: &str = "Inbox.md";

pub fn get_settings_path(app: &AppHandle) -> Option<PathBuf> {
  app.path().app_config_dir().ok().map(|dir| dir.join(SETTINGS_FILE_NAME))
}

fn read_settings_json(app: &AppHandle) -> serde_json::Value {
  let Some(path) = get_settings_path(app) else {
    return serde_json::json!({});
  };
  let Ok(content) = std::fs::read_to_string(path) else {
    return serde_json::json!({});
  };
  serde_json::from_str::<serde_json::Value>(&content).unwrap_or_else(|_| serde_json::json!({}))
}

fn write_settings_json<F: FnOnce(&mut serde_json::Value)>(app: &AppHandle, mutate: F) {
  let Some(path) = get_settings_path(app) else {
    return;
  };
  if let Some(parent) = path.parent() {
    let _ = std::fs::create_dir_all(parent);
  }
  let mut current = read_settings_json(app);
  if !current.is_object() {
    current = serde_json::json!({});
  }
  mutate(&mut current);
  let _ = std::fs::write(path, current.to_string());
}

pub fn load_saved_keep_in_tray(app: &AppHandle) -> bool {
  let default_val = cfg!(target_os = "macos");
  let json = read_settings_json(app);
  json.get("keepInTray").and_then(|v| v.as_bool()).unwrap_or(default_val)
}

pub fn save_keep_in_tray_to_disk(app: &AppHandle, enabled: bool) {
  write_settings_json(app, |obj| {
    if let Some(map) = obj.as_object_mut() {
      map.insert("keepInTray".to_string(), serde_json::json!(enabled));
    }
  });
}

pub fn load_saved_capture_shortcut(app: &AppHandle) -> String {
  let json = read_settings_json(app);
  json
    .get("captureShortcut")
    .and_then(|v| v.as_str())
    .unwrap_or(DEFAULT_CAPTURE_SHORTCUT)
    .to_string()
}

pub fn save_capture_shortcut_to_disk(app: &AppHandle, shortcut: &str) {
  write_settings_json(app, |obj| {
    if let Some(map) = obj.as_object_mut() {
      map.insert("captureShortcut".to_string(), serde_json::json!(shortcut));
    }
  });
}

pub fn load_saved_capture_target(app: &AppHandle) -> String {
  let json = read_settings_json(app);
  json
    .get("captureTarget")
    .and_then(|v| v.as_str())
    .unwrap_or(DEFAULT_CAPTURE_TARGET)
    .to_string()
}

pub fn save_capture_target_to_disk(app: &AppHandle, target: &str) {
  write_settings_json(app, |obj| {
    if let Some(map) = obj.as_object_mut() {
      map.insert("captureTarget".to_string(), serde_json::json!(target));
    }
  });
}

pub const DEFAULT_TRAY_CLICK_ACTION_NEW: &str = "capture";
pub const DEFAULT_TRAY_CLICK_ACTION_EXISTING: &str = "menu";

pub fn load_saved_tray_click_action(app: &AppHandle) -> String {
  let json = read_settings_json(app);
  if let Some(val) = json.get("trayLeftClickAction").and_then(|v| v.as_str()) {
    if val == "menu" || val == "capture" {
      return val.to_string();
    }
  }
  if let Some(path) = get_settings_path(app) {
    if path.exists() {
      return DEFAULT_TRAY_CLICK_ACTION_EXISTING.to_string();
    }
  }
  DEFAULT_TRAY_CLICK_ACTION_NEW.to_string()
}

pub fn save_tray_click_action_to_disk(app: &AppHandle, action: &str) {
  write_settings_json(app, |obj| {
    if let Some(map) = obj.as_object_mut() {
      map.insert("trayLeftClickAction".to_string(), serde_json::json!(action));
    }
  });
}


