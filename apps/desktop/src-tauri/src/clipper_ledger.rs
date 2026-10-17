//! Desktop dedupe ledger for Web Clipper (Phase 7, ADR-0178).
//!
//! Maintains a persisted, bounded ring buffer of recent clips in `app_config_dir`
//! to ensure idempotency across retries, re-clips, and network drops.

use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::command_auth::reject_plugin_runner;

pub const CLIPPER_LEDGER_FILE: &str = "davinci-clipper-ledger.json";
pub const MAX_LEDGER_ENTRIES: usize = 500;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ClipperLedgerEntry {
  pub clip_id: String,
  pub content_hash: String,
  pub relative_path: String,
  pub written_at: i64,
}

pub fn get_ledger_file_path(app: &AppHandle) -> Option<PathBuf> {
  app.path().app_config_dir().ok().map(|dir| dir.join(CLIPPER_LEDGER_FILE))
}

pub fn read_ledger_from_disk(app: &AppHandle) -> Vec<ClipperLedgerEntry> {
  let Some(path) = get_ledger_file_path(app) else {
    return Vec::new();
  };
  let Ok(content) = std::fs::read_to_string(path) else {
    return Vec::new();
  };
  serde_json::from_str::<Vec<ClipperLedgerEntry>>(&content).unwrap_or_default()
}

pub fn write_ledger_to_disk(app: &AppHandle, entries: &[ClipperLedgerEntry]) {
  let Some(path) = get_ledger_file_path(app) else {
    return;
  };
  if let Some(parent) = path.parent() {
    let _ = std::fs::create_dir_all(parent);
  }
  let truncated: &[ClipperLedgerEntry] = if entries.len() > MAX_LEDGER_ENTRIES {
    &entries[..MAX_LEDGER_ENTRIES]
  } else {
    entries
  };
  if let Ok(json) = serde_json::to_string(truncated) {
    let _ = std::fs::write(path, json);
  }
}

pub fn find_duplicate(
  entries: &[ClipperLedgerEntry],
  clip_id: &str,
  content_hash: &str,
  relative_path: &str,
) -> Option<String> {
  for entry in entries {
    if entry.clip_id == clip_id
      || (entry.content_hash == content_hash && entry.relative_path == relative_path)
    {
      return Some(entry.relative_path.clone());
    }
  }
  None
}

/// Checks if a clip with this id or (content_hash, relative_path) was already written.
#[tauri::command]
pub fn clipper_check_duplicate(
  app: AppHandle,
  window: WebviewWindow,
  clip_id: String,
  content_hash: String,
  relative_path: String,
) -> Result<Option<String>, String> {
  reject_plugin_runner(&window)?;
  let entries = read_ledger_from_disk(&app);
  Ok(find_duplicate(&entries, &clip_id, &content_hash, &relative_path))
}

/// Records a successfully written clip in the ledger.
#[tauri::command]
pub fn clipper_record_written(
  app: AppHandle,
  window: WebviewWindow,
  clip_id: String,
  content_hash: String,
  relative_path: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  let mut entries = read_ledger_from_disk(&app);
  let now = chrono::Utc::now().timestamp_millis();
  // Remove any pre-existing entry with the same clip_id to prevent duplicate keys in ring buffer
  entries.retain(|e| e.clip_id != clip_id);
  entries.insert(
    0,
    ClipperLedgerEntry {
      clip_id,
      content_hash,
      relative_path,
      written_at: now,
    },
  );
  if entries.len() > MAX_LEDGER_ENTRIES {
    entries.truncate(MAX_LEDGER_ENTRIES);
  }
  write_ledger_to_disk(&app, &entries);
  Ok(())
}
