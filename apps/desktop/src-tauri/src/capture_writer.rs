use std::fs::OpenOptions;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::time::SystemTime;
use tauri::{AppHandle, Manager};

use crate::capture::{CaptureState, MAX_CAPTURE_LENGTH};
use crate::capture_format::format_iso_timestamp;
use crate::fs::resolve_in_vault;
use crate::state::VaultState;

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
