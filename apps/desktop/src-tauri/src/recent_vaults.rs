use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::command_auth::reject_plugin_runner;
use crate::watcher::VaultWatcher;

const RECENT_VAULTS_FILE: &str = "davinci-recent-vaults.json";
pub const MAX_RECENT_VAULTS: usize = 20;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RecentVaultEntry {
  pub path: String,
  pub name: String,
  #[serde(rename = "lastOpenedAt")]
  pub last_opened_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RecentVaultSummary {
  pub path: String,
  pub name: String,
  #[serde(rename = "lastOpenedAt")]
  pub last_opened_at: i64,
  pub exists: bool,
}

pub fn get_recent_vaults_file_path(app: &AppHandle) -> Option<PathBuf> {
  app.path().app_config_dir().ok().map(|dir| dir.join(RECENT_VAULTS_FILE))
}

pub fn read_recent_vaults_from_disk(app: &AppHandle) -> Vec<RecentVaultEntry> {
  let Some(path) = get_recent_vaults_file_path(app) else {
    return Vec::new();
  };
  let Ok(content) = std::fs::read_to_string(path) else {
    return Vec::new();
  };
  serde_json::from_str::<Vec<RecentVaultEntry>>(&content).unwrap_or_default()
}

pub fn write_recent_vaults_to_disk(app: &AppHandle, entries: &[RecentVaultEntry]) {
  let Some(path) = get_recent_vaults_file_path(app) else {
    return;
  };
  if let Some(parent) = path.parent() {
    let _ = std::fs::create_dir_all(parent);
  }
  if let Ok(json) = serde_json::to_string_pretty(entries) {
    let _ = std::fs::write(path, json);
  }
}

pub fn canonicalize_path_string(path_str: &str) -> String {
  let p = Path::new(path_str);
  if let Ok(canonical) = p.canonicalize() {
    canonical.to_string_lossy().into_owned()
  } else {
    path_str.to_string()
  }
}

pub fn derive_vault_name(path_str: &str) -> String {
  let p = Path::new(path_str);
  if let Some(file_name) = p.file_name() {
    let name_str = file_name.to_string_lossy().into_owned();
    if !name_str.is_empty() {
      return name_str;
    }
  }
  path_str.to_string()
}

pub fn check_directory_exists(path_str: &str) -> bool {
  let p = Path::new(path_str);
  p.is_dir()
}

pub fn add_or_update_recent_vault(
  entries: &mut Vec<RecentVaultEntry>,
  raw_path: &str,
  now_ms: i64,
) {
  let canonical = canonicalize_path_string(raw_path);
  let name = derive_vault_name(&canonical);

  // Remove any entry with matching path (either raw or canonical)
  entries.retain(|e| {
    let existing_canonical = canonicalize_path_string(&e.path);
    existing_canonical != canonical && e.path != raw_path
  });

  // Insert new entry at the front
  entries.insert(
    0,
    RecentVaultEntry {
      path: canonical,
      name,
      last_opened_at: now_ms,
    },
  );

  // Cap at MAX_RECENT_VAULTS
  if entries.len() > MAX_RECENT_VAULTS {
    entries.truncate(MAX_RECENT_VAULTS);
  }
}

pub fn remove_recent_vault_by_path(
  entries: &mut Vec<RecentVaultEntry>,
  target_path: &str,
) {
  let target_canonical = canonicalize_path_string(target_path);
  entries.retain(|e| {
    let existing_canonical = canonicalize_path_string(&e.path);
    existing_canonical != target_canonical && e.path != target_path
  });
}

pub fn build_summaries(entries: &[RecentVaultEntry]) -> Vec<RecentVaultSummary> {
  let mut sorted = entries.to_vec();
  sorted.sort_by(|a, b| b.last_opened_at.cmp(&a.last_opened_at));

  sorted
    .into_iter()
    .map(|e| {
      let exists = check_directory_exists(&e.path);
      RecentVaultSummary {
        path: e.path,
        name: e.name,
        last_opened_at: e.last_opened_at,
        exists,
      }
    })
    .collect()
}

#[tauri::command]
pub fn get_recent_vaults(
  window: WebviewWindow,
  app: AppHandle,
) -> Result<Vec<RecentVaultSummary>, String> {
  reject_plugin_runner(&window)?;
  let entries = read_recent_vaults_from_disk(&app);
  Ok(build_summaries(&entries))
}

#[tauri::command]
pub fn record_recent_vault(
  window: WebviewWindow,
  app: AppHandle,
  path: String,
) -> Result<Vec<RecentVaultSummary>, String> {
  reject_plugin_runner(&window)?;
  let mut entries = read_recent_vaults_from_disk(&app);
  let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or(0);

  add_or_update_recent_vault(&mut entries, &path, now);
  write_recent_vaults_to_disk(&app, &entries);
  Ok(build_summaries(&entries))
}

#[tauri::command]
pub fn remove_recent_vault(
  window: WebviewWindow,
  app: AppHandle,
  path: String,
) -> Result<Vec<RecentVaultSummary>, String> {
  reject_plugin_runner(&window)?;
  let mut entries = read_recent_vaults_from_disk(&app);
  remove_recent_vault_by_path(&mut entries, &path);
  write_recent_vaults_to_disk(&app, &entries);
  Ok(build_summaries(&entries))
}

#[tauri::command]
pub fn check_vault_exists(window: WebviewWindow, path: String) -> Result<bool, String> {
  reject_plugin_runner(&window)?;
  Ok(check_directory_exists(&path))
}

#[tauri::command]
pub fn stop_vault_watcher(window: WebviewWindow, app: AppHandle) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  app.state::<VaultWatcher>().stop();
  Ok(())
}

