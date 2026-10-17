use std::path::Path;
use std::str::FromStr;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use walkdir::WalkDir;

use crate::capture::{trigger_quick_capture, CaptureState};
use crate::capture_writer::{save_quick_capture, QuickCaptureSaveResponse};
use crate::command_auth::{authorize_capture_window, reject_plugin_runner};
use crate::state::VaultState;
use crate::tray_config::{
  load_saved_capture_shortcut, load_saved_capture_target, save_capture_shortcut_to_disk,
  save_capture_target_to_disk,
};

#[tauri::command]
pub fn quick_capture_save(
  window: WebviewWindow,
  app: AppHandle,
  text: String,
  filename: Option<String>,
  folder: Option<String>,
) -> Result<QuickCaptureSaveResponse, String> {
  authorize_capture_window(&window)?;
  let result = save_quick_capture(&app, &text, filename.as_deref(), folder.as_deref())?;
  Ok(result)
}

#[tauri::command]
pub fn quick_capture_dismiss(window: WebviewWindow) -> Result<(), String> {
  authorize_capture_window(&window)?;
  let _ = window.hide();
  Ok(())
}

#[tauri::command]
pub fn reclamp_capture_popover(window: WebviewWindow, app: AppHandle) -> Result<(), String> {
  authorize_capture_window(&window)?;
  crate::capture::reclamp_popover(&app, &window)
}

#[tauri::command]
pub fn list_vault_folders_for_capture(
  window: WebviewWindow,
  app: AppHandle,
) -> Result<Vec<String>, String> {
  authorize_capture_window(&window)?;

  let vault_root = app
    .try_state::<VaultState>()
    .ok_or_else(|| "Vault state not found".to_string())?
    .get_root()
    .map_err(|_| "No vault is open".to_string())?;

  let mut folders = Vec::new();
  const MAX_FOLDERS: usize = 500;

  for entry in WalkDir::new(&vault_root)
    .follow_links(false)
    .min_depth(1)
    .max_depth(20)
    .into_iter()
    .filter_entry(|e| !e.file_name().to_string_lossy().starts_with('.'))
    .filter_map(|e| e.ok())
  {
    if !entry.file_type().is_dir() {
      continue;
    }
    if let Ok(rel) = entry.path().strip_prefix(&vault_root) {
      let rel_str = rel.to_string_lossy().replace('\\', "/");
      if !rel_str.is_empty() {
        folders.push(rel_str);
        if folders.len() >= MAX_FOLDERS {
          break;
        }
      }
    }
  }

  folders.sort();
  folders.dedup();
  Ok(folders)
}

#[tauri::command]
pub fn open_note_from_capture(
  window: WebviewWindow,
  app: AppHandle,
  path: String,
) -> Result<(), String> {
  authorize_capture_window(&window)?;
  let vault_root = app
    .try_state::<VaultState>()
    .and_then(|vs| vs.get_root().ok());

  if !crate::tray_menu::validate_recent_note_path(&path, vault_root.as_deref()) {
    return Err(format!("Invalid or unsafe note path: {path}"));
  }

  if let Some(main_window) = app.get_webview_window(crate::tray::MAIN_WINDOW) {
    crate::tray::show_main_window(&main_window);
    let _ = main_window.emit(
      crate::tray::TRAY_OPEN_NOTE_EVENT,
      serde_json::json!({ "path": path }),
    );
  }
  let _ = window.hide();
  Ok(())
}

#[tauri::command]
pub fn get_capture_shortcut(app: AppHandle, window: WebviewWindow) -> Result<String, String> {
  reject_plugin_runner(&window)?;
  if let Some(state) = app.try_state::<CaptureState>() {
    state.shortcut.lock().map(|s| s.clone()).map_err(|e| e.to_string())
  } else {
    Ok(load_saved_capture_shortcut(&app))
  }
}

#[tauri::command]
pub fn set_capture_shortcut(
  app: AppHandle,
  window: WebviewWindow,
  shortcut: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  let trimmed = shortcut.trim();
  if trimmed.is_empty() {
    return Err("Shortcut cannot be empty".to_string());
  }

  if trimmed.eq_ignore_ascii_case("Alt+Space")
    || trimmed.eq_ignore_ascii_case("Option+Space")
    || trimmed.eq_ignore_ascii_case("Command+Shift+C")
    || trimmed.eq_ignore_ascii_case("Cmd+Shift+C")
  {
    return Err(format!("Shortcut '{trimmed}' conflicts with system or launcher shortcuts"));
  }

  let parsed = Shortcut::from_str(trimmed)
    .map_err(|e| format!("Invalid shortcut format '{trimmed}': {e}"))?;

  let state = app
    .try_state::<CaptureState>()
    .ok_or_else(|| "Capture state not found".to_string())?;

  let current_shortcut = state
    .shortcut
    .lock()
    .map_err(|e| e.to_string())?
    .clone();

  if let Ok(old) = Shortcut::from_str(&current_shortcut) {
    let _ = app.global_shortcut().unregister(old);
  }

  if let Err(err) = app
    .global_shortcut()
    .on_shortcut(parsed, |app, _sc, event| {
      if event.state() == ShortcutState::Pressed {
        trigger_quick_capture(app);
      }
    })
  {
    if let Ok(old) = Shortcut::from_str(&current_shortcut) {
      let _ = app.global_shortcut().on_shortcut(old, |app, _sc, event| {
        if event.state() == ShortcutState::Pressed {
          trigger_quick_capture(app);
        }
      });
    }
    return Err(format!("Could not register shortcut '{trimmed}': {err}"));
  }

  save_capture_shortcut_to_disk(&app, trimmed);
  *state.shortcut.lock().map_err(|e| e.to_string())? = trimmed.to_string();
  Ok(())
}

#[tauri::command]
pub fn get_capture_target(app: AppHandle, window: WebviewWindow) -> Result<String, String> {
  reject_plugin_runner(&window)?;
  if let Some(state) = app.try_state::<CaptureState>() {
    state.target.lock().map(|s| s.clone()).map_err(|e| e.to_string())
  } else {
    Ok(load_saved_capture_target(&app))
  }
}

#[tauri::command]
pub fn set_capture_target(
  app: AppHandle,
  window: WebviewWindow,
  target: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  let trimmed = target.trim();
  if trimmed.is_empty() {
    return Err("Target note name cannot be empty".to_string());
  }

  let note_name = if trimmed.ends_with(".md") {
    trimmed.to_string()
  } else {
    format!("{trimmed}.md")
  };

  let p = Path::new(&note_name);
  if !p.is_relative() || p.components().any(|c| !matches!(c, std::path::Component::Normal(_))) {
    return Err("Target note must be a safe vault-relative path".to_string());
  }

  let state = app
    .try_state::<CaptureState>()
    .ok_or_else(|| "Capture state not found".to_string())?;

  save_capture_target_to_disk(&app, &note_name);
  *state.target.lock().map_err(|e| e.to_string())? = note_name;
  Ok(())
}

#[tauri::command]
pub fn quick_capture_bring_to_front(window: WebviewWindow) -> Result<(), String> {
  authorize_capture_window(&window)?;
  crate::capture::make_window_topmost(&window.as_ref().window());
  Ok(())
}
