use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use crate::command_auth::reject_plugin_runner;
use crate::tray_config::{load_saved_keep_in_tray, save_keep_in_tray_to_disk};
use crate::watcher::VaultWatcher;
#[cfg(target_os = "macos")]
use tauri::{
  image::Image,
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::TrayIconBuilder,
  ActivationPolicy,
};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow, Window};

pub const MAIN_WINDOW: &str = "main";
pub const TRAY_NEW_NOTE_EVENT: &str = "davinci-tray-new-note";
#[allow(dead_code)]
pub const TRAY_QUIT_EVENT: &str = "davinci-tray-quit";
pub const CLEAN_QUIT_EVENT: &str = "davinci-clean-quit";
pub const WINDOW_HIDDEN_EVENT: &str = "davinci-window-hidden";

#[derive(Default)]
pub struct TraySettingsState {
  pub keep_in_tray: Arc<AtomicBool>,
  pub is_quitting: Arc<AtomicBool>,
}

impl TraySettingsState {
  pub fn new(default_keep_in_tray: bool) -> Self {
    Self {
      keep_in_tray: Arc::new(AtomicBool::new(default_keep_in_tray)),
      is_quitting: Arc::new(AtomicBool::new(false)),
    }
  }
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
  let initial_setting = load_saved_keep_in_tray(app);
  app.manage(TraySettingsState::new(initial_setting));

  #[cfg(target_os = "macos")]
  setup_macos_tray(app)?;
  #[cfg(not(target_os = "macos"))]
  let _ = app;
  Ok(())
}

#[cfg(target_os = "macos")]
fn setup_macos_tray(app: &AppHandle) -> tauri::Result<()> {
  let show_hide = MenuItem::with_id(app, "tray-show-hide", "Show/Hide window", true, None::<&str>)?;
  let new_note = MenuItem::with_id(app, "tray-new-note", "New note", true, None::<&str>)?;
  let quit = MenuItem::with_id(app, "tray-quit", "Quit", true, None::<&str>)?;
  let separator = PredefinedMenuItem::separator(app)?;
  let menu = Menu::with_items(app, &[&show_hide, &new_note, &separator, &quit])?;
  let icon = Image::new(include_bytes!("../icons/tray-icon@2x.rgba"), 44, 44);

  TrayIconBuilder::with_id("davinci-tray")
    .icon(icon)
    .icon_as_template(true)
    .tooltip("DaVinci Notes")
    .menu(&menu)
    .show_menu_on_left_click(true)
    .on_menu_event(|app, event| match event.id.as_ref() {
      "tray-show-hide" => toggle_main_window(app),
      "tray-new-note" => new_note_from_tray(app),
      "tray-quit" => trigger_clean_quit(app),
      _ => {}
    })
    .build(app)?;

  Ok(())
}

pub fn show_main_window(window: &WebviewWindow) {
  #[cfg(target_os = "macos")]
  {
    let app = window.app_handle();
    let _ = app.set_activation_policy(ActivationPolicy::Regular);
  }
  let _ = window.unminimize();
  let _ = window.show();
  let _ = window.set_focus();
}

pub fn hide_window(window: &Window) {
  let _ = window.emit(WINDOW_HIDDEN_EVENT, ());
  let _ = window.hide();
  #[cfg(target_os = "macos")]
  {
    let app = window.app_handle();
    let _ = app.set_activation_policy(ActivationPolicy::Accessory);
  }
}

pub fn toggle_main_window(app: &AppHandle) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
    return;
  };
  let minimized = window.is_minimized().unwrap_or(false);
  let visible = window.is_visible().unwrap_or(false);
  if visible && !minimized {
    let _ = window.emit(WINDOW_HIDDEN_EVENT, ());
    let _ = window.hide();
    #[cfg(target_os = "macos")]
    {
      let _ = app.set_activation_policy(ActivationPolicy::Accessory);
    }
    return;
  }
  show_main_window(&window);
}

pub fn handle_window_close_requested(window: &Window) -> bool {
  let app = window.app_handle();
  let Some(tray_state) = app.try_state::<TraySettingsState>() else {
    return false;
  };

  if tray_state.is_quitting.load(Ordering::SeqCst) {
    return false;
  }

  if tray_state.keep_in_tray.load(Ordering::SeqCst) {
    hide_window(window);
    true
  } else {
    trigger_clean_quit(app);
    true
  }
}

fn new_note_from_tray(app: &AppHandle) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
    return;
  };
  show_main_window(&window);
  let _ = window.emit(TRAY_NEW_NOTE_EVENT, ());
}

pub fn trigger_clean_quit(app: &AppHandle) {
  let Some(tray_state) = app.try_state::<TraySettingsState>() else {
    app.exit(0);
    return;
  };

  if tray_state.is_quitting.swap(true, Ordering::SeqCst) {
    return;
  }

  if let Some(watcher) = app.try_state::<VaultWatcher>() {
    watcher.stop();
  }

  if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
    if let Err(e) = window.emit(CLEAN_QUIT_EVENT, ()) {
      log::warn!("Failed to emit clean quit event: {e}");
      app.exit(0);
    } else {
      let app_clone = app.clone();
      std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(2000));
        log::info!("Clean quit fallback timeout reached, exiting");
        app_clone.exit(0);
      });
    }
  } else {
    app.exit(0);
  }
}

#[tauri::command]
pub fn get_keep_in_tray(window: WebviewWindow, app: AppHandle) -> Result<bool, String> {
  reject_plugin_runner(&window)?;
  let state = app.try_state::<TraySettingsState>()
    .ok_or_else(|| "Tray settings state not found".to_string())?;
  Ok(state.keep_in_tray.load(Ordering::SeqCst))
}

#[tauri::command]
pub fn set_keep_in_tray(window: WebviewWindow, app: AppHandle, enabled: bool) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  let state = app.try_state::<TraySettingsState>()
    .ok_or_else(|| "Tray settings state not found".to_string())?;
  state.keep_in_tray.store(enabled, Ordering::SeqCst);
  save_keep_in_tray_to_disk(&app, enabled);
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
