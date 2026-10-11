use std::fs::OpenOptions;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::capture_format::format_iso_timestamp;
use crate::command_auth::CAPTURE_WINDOW_LABEL;
use crate::fs::resolve_in_vault;
use crate::state::VaultState;
use crate::tray_config::{
  load_saved_capture_shortcut, load_saved_capture_target,
};


pub const MAX_CAPTURE_LENGTH: usize = 10_000;

pub struct CaptureState {
  pub write_lock: Arc<Mutex<()>>,
  pub shortcut: Mutex<String>,
  pub target: Mutex<String>,
}

impl CaptureState {
  pub fn new(initial_shortcut: String, initial_target: String) -> Self {
    Self {
      write_lock: Arc::new(Mutex::new(())),
      shortcut: Mutex::new(initial_shortcut),
      target: Mutex::new(initial_target),
    }
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

pub fn show_or_create_capture_window(app: &AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window(CAPTURE_WINDOW_LABEL) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
    let _ = window.emit("davinci-capture-focus", ());
    return Ok(());
  }

  let window = WebviewWindowBuilder::new(
    app,
    CAPTURE_WINDOW_LABEL,
    WebviewUrl::App("capture.html".into()),
  )
  .title("Quick Capture")
  .inner_size(520.0, 160.0)
  .resizable(false)
  .always_on_top(true)
  .skip_taskbar(true)
  .center();

  #[cfg(target_os = "macos")]
  let window = window.decorations(false).transparent(true);

  #[cfg(target_os = "windows")]
  let window = window.decorations(false).shadow(true);

  #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
  let window = window.decorations(false);

  window
    .build()
    .map(|_| ())
    .map_err(|e| format!("Failed to create capture window: {e}"))
}

pub fn append_capture_text(
  app: &AppHandle,
  text: &str,
) -> Result<(), String> {
  let trimmed = text.trim();
  if trimmed.is_empty() {
    return Ok(());
  }
  if text.len() > MAX_CAPTURE_LENGTH {
    return Err(format!(
      "Capture text exceeds maximum length of {MAX_CAPTURE_LENGTH} characters"
    ));
  }

  let capture_state = app
    .try_state::<CaptureState>()
    .ok_or_else(|| "Capture state not found".to_string())?;

  let _lock = capture_state
    .write_lock
    .lock()
    .map_err(|_| "Capture write lock poisoned".to_string())?;

  let vault_root = app
    .try_state::<VaultState>()
    .ok_or_else(|| "Vault state not found".to_string())?
    .get_root()
    .map_err(|_| "No vault is open. Please open a vault before using Quick Capture.".to_string())?;

  let target_rel = capture_state
    .target
    .lock()
    .map_err(|_| "Target note lock poisoned".to_string())?
    .clone();

  let target_path = resolve_in_vault(&vault_root, &target_rel)?;
  let timestamp = format_iso_timestamp(SystemTime::now());

  append_entry_to_disk(&target_path, trimmed, &timestamp)
}

pub fn append_entry_to_disk(
  path: &Path,
  text: &str,
  timestamp: &str,
) -> Result<(), String> {
  if let Some(parent) = path.parent() {
    if !parent.exists() {
      std::fs::create_dir_all(parent)
        .map_err(|e| format!("Failed to create target folder: {e}"))?;
    }
  }

  let mut file = OpenOptions::new()
    .read(true)
    .write(true)
    .create(true)
    .open(path)
    .map_err(|e| format!("Failed to open capture note: {e}"))?;

  let len = file.metadata().map_err(|e| e.to_string())?.len();

  let (leading_sep, eol) = if len == 0 {
    ("", "\n")
  } else {
    let read_start = len.saturating_sub(4);
    file.seek(SeekFrom::Start(read_start)).map_err(|e| e.to_string())?;
    let mut tail_buf = Vec::new();
    file.read_to_end(&mut tail_buf).map_err(|e| e.to_string())?;

    let is_crlf = tail_buf.windows(2).any(|w| w == b"\r\n");
    let target_eol = if is_crlf { "\r\n" } else { "\n" };

    let ends_with_eol = if is_crlf {
      tail_buf.ends_with(b"\r\n") || tail_buf.ends_with(b"\n")
    } else {
      tail_buf.ends_with(b"\n")
    };

    let leading = if ends_with_eol { "" } else { target_eol };
    (leading, target_eol)
  };

  let entry = crate::capture_format::format_capture_entry(text, timestamp, eol);

  file.seek(SeekFrom::End(0)).map_err(|e| e.to_string())?;

  if !leading_sep.is_empty() {
    file.write_all(leading_sep.as_bytes()).map_err(|e| e.to_string())?;
  }
  file.write_all(entry.as_bytes()).map_err(|e| e.to_string())?;
  file.flush().map_err(|e| e.to_string())?;

  Ok(())
}

