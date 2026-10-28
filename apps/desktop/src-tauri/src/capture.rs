use std::str::FromStr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use tauri::{AppHandle, Emitter, Manager, Rect, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::command_auth::CAPTURE_WINDOW_LABEL;
use crate::tray_config::{load_saved_capture_shortcut, load_saved_capture_target};
use crate::tray_position::{find_popover_position, resolve_tray_rect_or_fallback};

pub const MAX_CAPTURE_LENGTH: usize = 10_000;

pub struct CaptureState {
  pub write_lock: Arc<Mutex<()>>,
  pub shortcut: Mutex<String>,
  pub target: Mutex<String>,
  pub last_blur_time: Arc<AtomicU64>,
  pub last_tray_rect: Arc<Mutex<Option<Rect>>>,
}

fn current_epoch_ms() -> u64 {
  SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as u64
}

impl CaptureState {
  pub fn new(initial_shortcut: String, initial_target: String) -> Self {
    Self {
      write_lock: Arc::new(Mutex::new(())),
      shortcut: Mutex::new(initial_shortcut),
      target: Mutex::new(initial_target),
      last_blur_time: Arc::new(AtomicU64::new(0)),
      last_tray_rect: Arc::new(Mutex::new(None)),
    }
  }

  pub fn record_blur(&self) {
    self.last_blur_time.store(current_epoch_ms(), Ordering::SeqCst);
  }

  pub fn is_recently_blurred(&self) -> bool {
    let last = self.last_blur_time.load(Ordering::SeqCst);
    last != 0 && current_epoch_ms().saturating_sub(last) < 350
  }

  pub fn set_last_tray_rect(&self, rect: Rect) {
    if let Ok(mut guard) = self.last_tray_rect.lock() {
      *guard = Some(rect);
    }
  }

  pub fn get_last_tray_rect(&self) -> Option<Rect> {
    self.last_tray_rect.lock().ok().and_then(|g| *g)
  }
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
  let initial_shortcut = load_saved_capture_shortcut(app);
  let initial_target = load_saved_capture_target(app);
  app.manage(CaptureState::new(initial_shortcut.clone(), initial_target));

  if let Ok(parsed) = Shortcut::from_str(&initial_shortcut) {
    if let Err(err) = app.global_shortcut().on_shortcut(parsed, |app, _shortcut, event| {
      if event.state() == ShortcutState::Pressed {
        trigger_quick_capture(app);
      }
    }) {
      log::error!("Failed to register global shortcut '{initial_shortcut}': {err}");
    }
  } else {
    log::error!("Invalid initial capture shortcut: '{initial_shortcut}'");
  }

  Ok(())
}

pub fn trigger_quick_capture(app: &AppHandle) {
  if let Err(err) = show_or_create_capture_window(app, None) {
    log::error!("Failed to show or create capture window: {err}");
  }
}

pub fn toggle_capture_popover(app: &AppHandle, tray_rect: Option<Rect>) -> Result<(), String> {
  if let Some(state) = app.try_state::<CaptureState>() {
    if state.is_recently_blurred() {
      return Ok(());
    }
    if let Some(r) = tray_rect {
      state.set_last_tray_rect(r);
    }
  }

  if let Some(window) = app.get_webview_window(CAPTURE_WINDOW_LABEL) {
    #[cfg(target_os = "macos")]
    let visible = crate::macos_panel::is_capture_panel_visible(&window.as_ref().window());
    #[cfg(not(target_os = "macos"))]
    let visible = window.is_visible().unwrap_or(false);

    if visible {
      #[cfg(target_os = "macos")]
      let _ = crate::macos_panel::hide_capture_panel(&window.as_ref().window());
      #[cfg(not(target_os = "macos"))]
      let _ = window.hide();
      return Ok(());
    }
  }

  show_or_create_capture_window(app, tray_rect)
}

pub fn show_or_create_capture_window(app: &AppHandle, tray_rect: Option<Rect>) -> Result<(), String> {
  let last_known = app.try_state::<CaptureState>().and_then(|s| s.get_last_tray_rect());
  let target_rect = tray_rect
    .or_else(|| last_known)
    .unwrap_or_else(|| resolve_tray_rect_or_fallback(app, None));

  if let Some(window) = app.get_webview_window(CAPTURE_WINDOW_LABEL) {
    if let Some(pos) = find_popover_position(app, Some(&window), &target_rect) {
      let _ = window.set_position(tauri::Position::Physical(pos));
    }
    let _ = window.unminimize();
    display_capture_window(&window);
    let _ = window.emit("davinci-capture-focus", ());
    return Ok(());
  }

  create_and_show_capture_window(app, &target_rect)
}

fn create_and_show_capture_window(app: &AppHandle, target_rect: &Rect) -> Result<(), String> {
  let builder = WebviewWindowBuilder::new(
    app,
    CAPTURE_WINDOW_LABEL,
    WebviewUrl::App("capture.html".into()),
  )
  .title("Quick Capture")
  .inner_size(640.0, 340.0)
  .resizable(false)
  .always_on_top(true)
  .visible_on_all_workspaces(true)
  .skip_taskbar(true);

  #[cfg(target_os = "macos")]
  let builder = builder.decorations(false).transparent(true);

  #[cfg(target_os = "windows")]
  let builder = builder.decorations(false).shadow(true);

  #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
  let builder = builder.decorations(false);

  let window = builder
    .build()
    .map_err(|e| format!("Failed to create capture window: {e}"))?;

  #[cfg(target_os = "macos")]
  {
    let _ = crate::macos_panel::setup_capture_panel(&window);
  }

  // Read the real physical size and position directly anchored under the icon
  if let Some(pos) = find_popover_position(app, Some(&window), target_rect) {
    let _ = window.set_position(tauri::Position::Physical(pos));
  }

  display_capture_window(&window);
  let _ = window.emit("davinci-capture-focus", ());
  Ok(())
}

fn display_capture_window(window: &WebviewWindow) {
  #[cfg(target_os = "macos")]
  {
    let _ = crate::macos_panel::show_capture_panel(window);
  }
  #[cfg(not(target_os = "macos"))]
  {
    let _ = window.show();
    make_window_topmost(&window.as_ref().window());
  }
}

pub fn reclamp_popover(app: &AppHandle, window: &WebviewWindow) -> Result<(), String> {
  let last_known = app.try_state::<CaptureState>().and_then(|s| s.get_last_tray_rect());
  let target_rect = resolve_tray_rect_or_fallback(app, last_known);

  if let Some(pos) = find_popover_position(app, Some(window), &target_rect) {
    let _ = window.set_position(tauri::Position::Physical(pos));
  }
  Ok(())
}

pub fn make_window_topmost(window: &tauri::Window) {
  let _ = window.unminimize();
  let _ = window.show();
  let _ = window.set_always_on_top(true);
  let _ = window.set_focus();
}

#[allow(unused_imports)]
pub use crate::capture_writer::{append_capture_text, append_entry_to_disk, save_quick_capture};
