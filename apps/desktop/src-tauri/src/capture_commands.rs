use std::path::Path;
use std::str::FromStr;
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::capture::{append_capture_text, trigger_quick_capture, CaptureState};
use crate::command_auth::{authorize_capture_window, reject_plugin_runner};
use crate::tray_config::{
  load_saved_capture_shortcut, load_saved_capture_target, save_capture_shortcut_to_disk,
  save_capture_target_to_disk,
};

#[tauri::command]
pub fn quick_capture_save(
  window: WebviewWindow,
  app: AppHandle,
  text: String,
) -> Result<(), String> {
  authorize_capture_window(&window)?;
  append_capture_text(&app, &text)?;
  let _ = window.hide();
  Ok(())
}

#[tauri::command]
pub fn quick_capture_dismiss(window: WebviewWindow) -> Result<(), String> {
  authorize_capture_window(&window)?;
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

  // Reject known conflicting shortcuts
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
    // Restore previous shortcut
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
