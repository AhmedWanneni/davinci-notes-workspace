use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::command_auth::reject_plugin_runner;
use crate::tray::{TrayDynamicState, TraySettingsState};
use crate::tray_config::save_keep_in_tray_to_disk;
use crate::tray_menu::RecentNoteItem;
#[cfg(target_os = "macos")]
use crate::tray_menu::build_tray_menu;
use crate::watcher::VaultWatcher;

#[tauri::command]
pub fn get_keep_in_tray(window: WebviewWindow, app: AppHandle) -> Result<bool, String> {
  reject_plugin_runner(&window)?;
  let state = app
    .try_state::<TraySettingsState>()
    .ok_or_else(|| "Tray settings state not found".to_string())?;
  Ok(state.keep_in_tray.load(Ordering::SeqCst))
}

#[tauri::command]
pub fn set_keep_in_tray(window: WebviewWindow, app: AppHandle, enabled: bool) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  let state = app
    .try_state::<TraySettingsState>()
    .ok_or_else(|| "Tray settings state not found".to_string())?;
  state.keep_in_tray.store(enabled, Ordering::SeqCst);
  save_keep_in_tray_to_disk(&app, enabled);
  Ok(())
}

#[derive(serde::Serialize)]
pub struct TrayClickActionResponse {
  pub action: String,
  pub supported: bool,
}

#[tauri::command]
pub fn get_tray_click_action(window: WebviewWindow, app: AppHandle) -> Result<TrayClickActionResponse, String> {
  reject_plugin_runner(&window)?;
  let supported = cfg!(any(target_os = "macos", windows));
  let action = crate::tray::get_tray_click_action_from_state_or_disk(&app);
  Ok(TrayClickActionResponse { action, supported })
}

#[tauri::command]
pub fn set_tray_click_action(
  window: WebviewWindow,
  app: AppHandle,
  action: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  if action != "capture" && action != "menu" {
    return Err("Invalid tray click action: must be 'capture' or 'menu'".into());
  }
  let state = app
    .try_state::<TraySettingsState>()
    .ok_or_else(|| "Tray settings state not found".to_string())?;

  if let Ok(mut guard) = state.left_click_action.lock() {
    *guard = action.clone();
  }
  crate::tray_config::save_tray_click_action_to_disk(&app, &action);

  #[cfg(any(target_os = "macos", windows))]
  {
    if let Some(tray) = app.tray_by_id("davinci-tray") {
      let _ = tray.set_show_menu_on_left_click(action == "menu");
    }
  }

  Ok(())
}


#[tauri::command]
pub fn update_tray_recent_notes(
  window: WebviewWindow,
  app: AppHandle,
  recent_notes: Vec<RecentNoteItem>,
  has_vault: bool,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;

  let upcoming_reminders = if let Some(dynamic_state) = app.try_state::<TrayDynamicState>() {
    if let Ok(mut guard) = dynamic_state.recent_notes.lock() {
      *guard = recent_notes.clone();
    }
    dynamic_state.upcoming_reminders.lock().map(|g| g.clone()).unwrap_or_default()
  } else {
    Vec::new()
  };

  #[cfg(target_os = "macos")]
  {
    if let Some(tray) = app.tray_by_id("davinci-tray") {
      if let Ok(menu) = build_tray_menu(&app, has_vault, &recent_notes, &upcoming_reminders) {
        let _ = tray.set_menu(Some(menu));
      }
    }
  }

  #[cfg(not(target_os = "macos"))]
  let _ = (has_vault, &recent_notes, &upcoming_reminders);

  Ok(())
}

#[tauri::command]
pub fn update_tray_reminders(
  window: WebviewWindow,
  app: AppHandle,
  upcoming_reminders: Vec<crate::tray_menu::TrayReminderItem>,
  has_vault: bool,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;

  let recent_notes = if let Some(dynamic_state) = app.try_state::<TrayDynamicState>() {
    if let Ok(mut guard) = dynamic_state.upcoming_reminders.lock() {
      *guard = upcoming_reminders.clone();
    }
    dynamic_state.recent_notes.lock().map(|g| g.clone()).unwrap_or_default()
  } else {
    Vec::new()
  };

  #[cfg(target_os = "macos")]
  {
    if let Some(tray) = app.tray_by_id("davinci-tray") {
      if let Ok(menu) = build_tray_menu(&app, has_vault, &recent_notes, &upcoming_reminders) {
        let _ = tray.set_menu(Some(menu));
      }
    }
  }

  #[cfg(not(target_os = "macos"))]
  let _ = (has_vault, &recent_notes, &upcoming_reminders);

  Ok(())
}


#[tauri::command]
pub fn request_app_exit(window: WebviewWindow, app: AppHandle) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  if let Some(tray_state) = app.try_state::<TraySettingsState>() {
    tray_state.is_quitting.store(true, Ordering::SeqCst);
  }
  if let Some(watcher) = app.try_state::<VaultWatcher>() {
    watcher.stop();
  }
  app.exit(0);
  Ok(())
}
