use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use crate::tray_config::{load_saved_keep_in_tray, load_saved_tray_click_action};
use crate::tray_menu::{build_tray_menu, validate_recent_note_path, RecentNoteItem};
use crate::watcher::VaultWatcher;
#[cfg(target_os = "macos")]
use tauri::{image::Image, tray::TrayIconBuilder, ActivationPolicy};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow, Window};

pub const MAIN_WINDOW: &str = "main";
pub const TRAY_NEW_NOTE_EVENT: &str = "davinci-tray-new-note";
pub const TRAY_DAILY_NOTE_EVENT: &str = "davinci-tray-daily-note";
pub const TRAY_OPEN_NOTE_EVENT: &str = "davinci-tray-open-note";
pub const TRAY_OPEN_VAULT_EVENT: &str = "davinci-tray-open-vault";
#[allow(dead_code)]
pub const TRAY_QUIT_EVENT: &str = "davinci-tray-quit";
pub const CLEAN_QUIT_EVENT: &str = "davinci-clean-quit";
pub const WINDOW_HIDDEN_EVENT: &str = "davinci-window-hidden";
pub const TRAY_OPEN_REMINDERS_EVENT: &str = "davinci-tray-open-reminders";

#[derive(Default)]
pub struct TraySettingsState {
  pub keep_in_tray: Arc<AtomicBool>,
  pub is_quitting: Arc<AtomicBool>,
  pub left_click_action: Arc<Mutex<String>>,
}

#[derive(Default)]
pub struct TrayDynamicState {
  pub recent_notes: Mutex<Vec<RecentNoteItem>>,
  pub upcoming_reminders: Mutex<Vec<crate::tray_menu::TrayReminderItem>>,
}

impl TraySettingsState {
  pub fn new(default_keep_in_tray: bool, default_left_click_action: String) -> Self {
    Self {
      keep_in_tray: Arc::new(AtomicBool::new(default_keep_in_tray)),
      is_quitting: Arc::new(AtomicBool::new(false)),
      left_click_action: Arc::new(Mutex::new(default_left_click_action)),
    }
  }
}

pub fn get_tray_click_action_from_state_or_disk(app: &AppHandle) -> String {
  if let Some(state) = app.try_state::<TraySettingsState>() {
    if let Ok(guard) = state.left_click_action.lock() {
      return guard.clone();
    }
  }
  load_saved_tray_click_action(app)
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
  let initial_keep = load_saved_keep_in_tray(app);
  let initial_action = load_saved_tray_click_action(app);
  app.manage(TraySettingsState::new(initial_keep, initial_action));
  app.manage(TrayDynamicState::default());

  #[cfg(target_os = "macos")]
  setup_macos_tray(app)?;
  #[cfg(not(target_os = "macos"))]
  let _ = app;
  Ok(())
}

#[cfg(target_os = "macos")]
fn setup_macos_tray(app: &AppHandle) -> tauri::Result<()> {
  let menu = build_tray_menu(app, false, &[], &[])?;
  let icon = Image::new(include_bytes!("../icons/tray-icon@2x.rgba"), 44, 44);
  let initial_action = get_tray_click_action_from_state_or_disk(app);
  let show_menu_on_left = initial_action == "menu";

  TrayIconBuilder::with_id("davinci-tray")
    .icon(icon)
    .icon_as_template(true)
    .tooltip("DaVinci Notes")
    .menu(&menu)
    .show_menu_on_left_click(show_menu_on_left)
    .on_tray_icon_event(|tray, event| {
      match event {
        tauri::tray::TrayIconEvent::Click {
          button: tauri::tray::MouseButton::Left,
          button_state: tauri::tray::MouseButtonState::Up,
          rect,
          ..
        } => {
          let app = tray.app_handle();
          let action = get_tray_click_action_from_state_or_disk(app);
          if action == "capture" {
            let _ = crate::capture::toggle_capture_popover(app, Some(rect));
          }
        }
        _ => {}
      }
    })
    .on_menu_event(|app, event| {
      let id = event.id.as_ref();
      match id {
        "tray-show-hide" => toggle_main_window(app),
        "tray-quick-capture" => crate::capture::trigger_quick_capture(app),
        "tray-new-note" => emit_tray_action(app, TRAY_NEW_NOTE_EVENT, None),
        "tray-daily-note" => emit_tray_action(app, TRAY_DAILY_NOTE_EVENT, None),
        "tray-open-reminders" => emit_tray_action(app, TRAY_OPEN_REMINDERS_EVENT, None),
        "tray-open-vault" => emit_tray_action(app, TRAY_OPEN_VAULT_EVENT, None),
        "tray-quit" => trigger_clean_quit(app),
        _ => if let Some(rest) = id.strip_prefix("tray-recent:") {
          if let Ok(idx) = rest.parse::<usize>() {
            open_recent_note_from_tray(app, idx);
          }
        } else if let Some(rest) = id.strip_prefix("tray-reminder:") {
          if let Ok(idx) = rest.parse::<usize>() {
            open_reminder_from_tray(app, idx);
          }
        },
      }
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

pub fn hide_main_window(app: &AppHandle) {
  if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
    let _ = window.emit(WINDOW_HIDDEN_EVENT, ());
    let _ = window.hide();
    #[cfg(target_os = "macos")]
    {
      let _ = app.set_activation_policy(ActivationPolicy::Accessory);
    }
  }
}

pub fn toggle_main_window(app: &AppHandle) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
    return;
  };
  let minimized = window.is_minimized().unwrap_or(false);
  let visible = window.is_visible().unwrap_or(false);
  if visible && !minimized {
    hide_main_window(app);
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
    hide_main_window(app);
    true
  } else {
    trigger_clean_quit(app);
    true
  }
}

fn emit_tray_action(app: &AppHandle, event: &str, payload: Option<serde_json::Value>) {
  if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
    show_main_window(&window);
    match payload {
      Some(p) => {
        let _ = window.emit(event, p);
      }
      None => {
        let _ = window.emit(event, ());
      }
    }
  }
}

fn open_recent_note_from_tray(app: &AppHandle, idx: usize) {
  let item = app
    .try_state::<TrayDynamicState>()
    .and_then(|s| s.recent_notes.lock().ok()?.get(idx).cloned());
  let Some(item) = item else {
    return;
  };

  let vault_root = app
    .try_state::<crate::state::VaultState>()
    .and_then(|vs| vs.get_root().ok());

  if !validate_recent_note_path(&item.path, vault_root.as_deref()) {
    log::warn!("Rejected unsafe recent note path: {}", item.path);
    return;
  }

  emit_tray_action(
    app,
    TRAY_OPEN_NOTE_EVENT,
    Some(serde_json::json!({ "path": item.path })),
  );
}

fn open_reminder_from_tray(app: &AppHandle, idx: usize) {
  let item = app
    .try_state::<TrayDynamicState>()
    .and_then(|s| s.upcoming_reminders.lock().ok()?.get(idx).cloned());
  if let Some(item) = item {
    emit_tray_action(app, TRAY_OPEN_NOTE_EVENT, Some(serde_json::json!({ "path": item.note_path, "line": item.line })));
  }
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
    if window.emit(CLEAN_QUIT_EVENT, ()).is_err() {
      app.exit(0);
      return;
    }
    let app_clone = app.clone();
    std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_millis(2000));
      log::info!("Clean quit fallback timeout reached, exiting");
      app_clone.exit(0);
    });
  } else {
    app.exit(0);
  }
}
