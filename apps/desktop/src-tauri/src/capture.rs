use std::str::FromStr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::command_auth::CAPTURE_WINDOW_LABEL;

use crate::tray_config::{
  load_saved_capture_shortcut, load_saved_capture_target,
};

pub const MAX_CAPTURE_LENGTH: usize = 10_000;

pub struct CaptureState {
  pub write_lock: Arc<Mutex<()>>,
  pub shortcut: Mutex<String>,
  pub target: Mutex<String>,
  pub last_blur_time: Arc<AtomicU64>,
}

impl CaptureState {
  pub fn new(initial_shortcut: String, initial_target: String) -> Self {
    Self {
      write_lock: Arc::new(Mutex::new(())),
      shortcut: Mutex::new(initial_shortcut),
      target: Mutex::new(initial_target),
      last_blur_time: Arc::new(AtomicU64::new(0)),
    }
  }

  pub fn record_blur(&self) {
    let now = SystemTime::now()
      .duration_since(SystemTime::UNIX_EPOCH)
      .unwrap_or_default()
      .as_millis() as u64;
    self.last_blur_time.store(now, Ordering::SeqCst);
  }

  pub fn is_recently_blurred(&self) -> bool {
    let last = self.last_blur_time.load(Ordering::SeqCst);
    if last == 0 {
      return false;
    }
    let now = SystemTime::now()
      .duration_since(SystemTime::UNIX_EPOCH)
      .unwrap_or_default()
      .as_millis() as u64;
    now.saturating_sub(last) < 350
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
  if let Err(err) = show_or_create_capture_window(app) {
    log::error!("Failed to show or create capture window: {err}");
  }
}

pub fn toggle_capture_popover(app: &AppHandle, tray_rect: Option<tauri::Rect>) -> Result<(), String> {
  if let Some(state) = app.try_state::<CaptureState>() {
    if state.is_recently_blurred() {
      return Ok(());
    }
  }

  if let Some(window) = app.get_webview_window(CAPTURE_WINDOW_LABEL) {
    if window.is_visible().unwrap_or(false) {
      let _ = window.hide();
      return Ok(());
    }
    if let Some(ref rect) = tray_rect {
      if let Some(pos) = crate::tray_position::find_popover_position(app, Some(&window), rect) {
        let _ = window.set_position(tauri::Position::Physical(pos));
      }
    }
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
    let _ = window.emit("davinci-capture-focus", ());
    return Ok(());
  }

  let initial_pos = tray_rect.as_ref().and_then(|r| crate::tray_position::find_popover_position(app, None, r));
  create_and_show_capture_window(app, initial_pos)
}

pub fn show_or_create_capture_window(app: &AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window(CAPTURE_WINDOW_LABEL) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
    let _ = window.emit("davinci-capture-focus", ());
    return Ok(());
  }

  create_and_show_capture_window(app, None)
}

fn create_and_show_capture_window(
  app: &AppHandle,
  pos: Option<tauri::PhysicalPosition<i32>>,
) -> Result<(), String> {
  let builder = WebviewWindowBuilder::new(
    app,
    CAPTURE_WINDOW_LABEL,
    WebviewUrl::App("capture.html".into()),
  )
  .title("Quick Capture")
  .inner_size(520.0, 160.0)
  .resizable(false)
  .always_on_top(true)
  .skip_taskbar(true);

  let builder = match pos {
    Some(p) => builder.position(p.x as f64, p.y as f64),
    None => builder.center(),
  };

  #[cfg(target_os = "macos")]
  let builder = builder.decorations(false).transparent(true);

  #[cfg(target_os = "windows")]
  let builder = builder.decorations(false).shadow(true);

  #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
  let builder = builder.decorations(false);

  let window = builder
    .build()
    .map_err(|e| format!("Failed to create capture window: {e}"))?;

  let _ = window.set_focus();
  let _ = window.emit("davinci-capture-focus", ());
  Ok(())
}

#[allow(unused_imports)]
pub use crate::capture_writer::{append_capture_text, append_entry_to_disk};


