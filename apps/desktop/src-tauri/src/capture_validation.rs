use std::fs;
use std::path::{Component, Path, PathBuf};
use std::time::SystemTime;
use unicode_normalization::UnicodeNormalization;

use crate::fs::resolve_in_vault;

const WINDOWS_RESERVED_NAMES: &[&str] = &[
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

const MAX_FILENAME_LENGTH: usize = 128;

pub const DEFAULT_CAPTURE_FOLDER: &str = "Quick Notes";

/// Validates and normalizes user-provided note filename according to strict cross-platform rules.
/// Returns the normalized filename with `.md` extension.
pub fn validate_capture_filename(raw_name: &str) -> Result<String, String> {
  if raw_name.is_empty() || raw_name.trim().is_empty() {
    return Err("Filename cannot be empty".to_string());
  }

  if raw_name.ends_with(' ') || raw_name.ends_with('\t') {
    return Err("Filename cannot have trailing whitespace".to_string());
  }

  // Unicode NFC normalization
  let normalized: String = raw_name.nfc().collect();

  // Strip .md if provided to validate the underlying stem
  let stem = if normalized.to_ascii_lowercase().ends_with(".md") {
    &normalized[..normalized.len() - 3]
  } else {
    &normalized
  };

  if stem.is_empty() {
    return Err("Filename cannot be empty".to_string());
  }

  if stem.chars().count() > MAX_FILENAME_LENGTH {
    return Err(format!("Filename exceeds maximum length of {MAX_FILENAME_LENGTH} characters"));
  }

  if stem.contains('/') || stem.contains('\\') {
    return Err("Filename cannot contain path separators ('/' or '\\')".to_string());
  }

  if stem.contains("..") {
    return Err("Filename cannot contain '..'".to_string());
  }

  if stem.starts_with('.') {
    return Err("Filename cannot start with a dot".to_string());
  }

  if stem.ends_with('.') || stem.ends_with(' ') {
    return Err("Filename cannot end with spaces or dots".to_string());
  }

  if stem.contains('\0') {
    return Err("Filename cannot contain null bytes".to_string());
  }

  if stem.chars().any(|c| c.is_control()) {
    return Err("Filename cannot contain control characters".to_string());
  }

  const ILLEGAL_CHARS: &[char] = &[':', '*', '?', '"', '<', '>', '|'];
  if let Some(ch) = stem.chars().find(|c| ILLEGAL_CHARS.contains(c)) {
    return Err(format!("Filename cannot contain reserved character '{ch}'"));
  }

  let upper_stem = stem.to_ascii_uppercase();
  let base_stem = upper_stem.split('.').next().unwrap_or(&upper_stem);
  if WINDOWS_RESERVED_NAMES.contains(&base_stem) {
    return Err(format!("Filename cannot use Windows reserved name '{base_stem}'"));
  }

  Ok(format!("{stem}.md"))
}

/// Validates folder destination. Default `Quick Notes` folder is allowed to be created on demand;
/// custom folders MUST already exist inside the vault and cannot escape or be hidden.
pub fn validate_capture_folder(
  vault_root: &Path,
  raw_folder: Option<&str>,
) -> Result<(PathBuf, String), String> {
  let folder_str = match raw_folder {
    Some(s) if !s.trim().is_empty() && s.trim() != "." && s.trim() != "/" => s.trim(),
    _ => return Ok((vault_root.join(DEFAULT_CAPTURE_FOLDER), DEFAULT_CAPTURE_FOLDER.to_string())),
  };

  let clean_str = folder_str.replace('\\', "/");
  let folder_path = Path::new(&clean_str);

  if folder_path.is_absolute() {
    return Err("Folder must be a vault-relative path".to_string());
  }

  for comp in folder_path.components() {
    match comp {
      Component::Normal(os_str) => {
        let name = os_str.to_string_lossy();
        if name.starts_with('.') {
          return Err(format!("Hidden or system folder not allowed: {clean_str}"));
        }
      }
      _ => return Err("Folder contains invalid path components".to_string()),
    }
  }

  reject_symlink_components(vault_root, &clean_str)?;

  let resolved = resolve_in_vault(vault_root, &clean_str)?;
  if !resolved.exists() {
    return Err(format!("Folder does not exist in vault: {clean_str}"));
  }
  if !resolved.is_dir() {
    return Err(format!("Target is not a directory: {clean_str}"));
  }

  Ok((resolved, clean_str))
}

fn reject_symlink_components(vault_root: &Path, relative: &str) -> Result<(), String> {
  let mut candidate = vault_root.to_path_buf();
  for component in Path::new(relative).components() {
    let Component::Normal(segment) = component else {
      continue;
    };
    candidate.push(segment);
    if candidate.exists()
      && fs::symlink_metadata(&candidate)
        .map_err(|e| format!("Failed to read folder metadata: {e}"))?
        .file_type()
        .is_symlink()
    {
      return Err(format!("Symlink folders are not allowed: {relative}"));
    }
  }
  Ok(())
}

/// Generates a unique note path: `Quick note YYYY-MM-DD HH-mm-ss.md`.
/// If identical-second collisions occur, appends unique numeric suffix (` 1`, ` 2`, etc.).
pub fn generate_unique_quick_note_path(folder_path: &Path, now: SystemTime) -> Result<PathBuf, String> {
  let date_str = format_local_timestamp_no_colons(now);
  let base_name = format!("Quick note {date_str}.md");
  let first_candidate = folder_path.join(&base_name);

  if !first_candidate.exists() {
    return Ok(first_candidate);
  }

  let mut suffix = 1;
  loop {
    let candidate_name = format!("Quick note {date_str} {suffix}.md");
    let candidate = folder_path.join(&candidate_name);
    if !candidate.exists() {
      return Ok(candidate);
    }
    suffix += 1;
  }
}

/// Formats date/time as `YYYY-MM-DD HH-mm-ss` without colons (safe for macOS, Windows, Linux, and sync).
pub fn format_local_timestamp_no_colons(now: SystemTime) -> String {
  let secs = now.duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default().as_secs();
  let sec = secs % 60;
  let mins = secs / 60;
  let min = mins % 60;
  let hours = mins / 60;
  let hour = hours % 24;
  let mut days = hours / 24;

  let mut year = 1970;
  loop {
    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let days_in_year = if leap { 366 } else { 365 };
    if days >= days_in_year {
      days -= days_in_year;
      year += 1;
    } else {
      break;
    }
  }
  let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
  let days_in_months = [31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let mut month = 1;
  for &dim in &days_in_months {
    if days >= dim {
      days -= dim;
      month += 1;
    } else {
      break;
    }
  }
  let day = days + 1;
  format!("{year:04}-{month:02}-{day:02} {hour:02}-{min:02}-{sec:02}")
}
