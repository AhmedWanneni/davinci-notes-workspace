use std::fs::{self, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::time::SystemTime;
use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::capture::{CaptureState, MAX_CAPTURE_LENGTH};
use crate::capture_format::format_iso_timestamp;
use crate::capture_validation::{
  generate_unique_quick_note_path, validate_capture_filename, validate_capture_folder,
  DEFAULT_CAPTURE_FOLDER,
};
use crate::state::VaultState;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickCaptureSaveResponse {
  pub path: String,
  pub is_append: bool,
}

pub fn save_quick_capture(
  app: &AppHandle,
  text: &str,
  filename: Option<&str>,
  folder: Option<&str>,
) -> Result<QuickCaptureSaveResponse, String> {
  let trimmed = text.trim();
  if trimmed.is_empty() {
    return Err("Cannot save empty note".to_string());
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

  let (folder_path, folder_rel) = validate_capture_folder(&vault_root, folder)?;

  if !folder_path.exists() {
    if folder_rel == DEFAULT_CAPTURE_FOLDER {
      fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create default folder '{DEFAULT_CAPTURE_FOLDER}': {e}"))?;
    } else {
      return Err(format!("Destination folder does not exist: {folder_rel}"));
    }
  }

  let timestamp = format_iso_timestamp(SystemTime::now());

  if let Some(user_name) = filename.map(|s| s.trim()).filter(|s| !s.is_empty()) {
    let valid_name = validate_capture_filename(user_name)?;
    let target_file = folder_path.join(&valid_name);
    let rel_path = format!("{folder_rel}/{valid_name}");

    if target_file.exists() {
      // User explicitly picked an existing file: Pure append
      append_entry_to_disk(&target_file, trimmed, &timestamp)?;
      Ok(QuickCaptureSaveResponse {
        path: rel_path,
        is_append: true,
      })
    } else {
      // New note with specified name
      write_new_capture_file(&target_file, trimmed)?;
      Ok(QuickCaptureSaveResponse {
        path: rel_path,
        is_append: false,
      })
    }
  } else {
    // Auto-generated name with local timestamp
    let target_file = generate_unique_quick_note_path(&folder_path, SystemTime::now())?;
    let file_name = target_file
      .file_name()
      .ok_or_else(|| "Invalid target filename".to_string())?
      .to_string_lossy()
      .to_string();
    let rel_path = format!("{folder_rel}/{file_name}");

    write_new_capture_file(&target_file, trimmed)?;
    Ok(QuickCaptureSaveResponse {
      path: rel_path,
      is_append: false,
    })
  }
}

#[allow(dead_code)]
pub fn append_capture_text(app: &AppHandle, text: &str) -> Result<(), String> {
  save_quick_capture(app, text, None, None).map(|_| ())
}

fn write_new_capture_file(path: &Path, content: &str) -> Result<(), String> {
  let mut file = OpenOptions::new()
    .write(true)
    .create_new(true)
    .open(path)
    .map_err(|e| format!("Failed to create new capture note: {e}"))?;

  let mut body = content.to_string();
  if !body.ends_with('\n') {
    body.push('\n');
  }

  file.write_all(body.as_bytes()).map_err(|e| e.to_string())?;
  file.flush().map_err(|e| e.to_string())?;
  Ok(())
}

pub fn append_entry_to_disk(
  path: &Path,
  text: &str,
  timestamp: &str,
) -> Result<(), String> {
  if let Some(parent) = path.parent() {
    if !parent.exists() {
      fs::create_dir_all(parent)
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
