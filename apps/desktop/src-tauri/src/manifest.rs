use std::fs;
use std::io::{BufReader, Read};

use serde::Serialize;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{command_auth::reject_plugin_runner, fs::{collect_vault_paths, resolve_in_vault}, state::VaultState};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestFile {
  pub path: String,
  pub size: u64,
  pub mtime_ms: u64,
}

#[tauri::command]
pub fn list_manifest_files(window: WebviewWindow, app: AppHandle) -> Result<Vec<ManifestFile>, String> {
  reject_plugin_runner(&window)?;
  let vault_root = app.state::<VaultState>().get_root()?;
  collect_vault_paths(&vault_root)?.into_iter().map(|path| {
    let absolute = resolve_in_vault(&vault_root, &path)?;
    let metadata = absolute.metadata().map_err(|e| format!("Metadata failed: {e}"))?;
    let mtime_ms = metadata.modified()
      .map_err(|e| format!("mtime unavailable: {e}"))?
      .duration_since(std::time::UNIX_EPOCH)
      .map_err(|e| format!("mtime invalid: {e}"))?
      .as_millis() as u64;
    Ok(ManifestFile { path, size: metadata.len(), mtime_ms })
  }).collect()
}

#[tauri::command]
pub fn hash_manifest_file(window: WebviewWindow, app: AppHandle, path: String) -> Result<String, String> {
  reject_plugin_runner(&window)?;
  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;
  let file = fs::File::open(&absolute).map_err(|e| format!("Hash input failed: {e}"))?;
  let mut reader = BufReader::new(file);
  let mut hasher = blake3::Hasher::new();
  let mut buffer = [0_u8; 64 * 1024];
  loop {
    let count = reader.read(&mut buffer).map_err(|e| format!("Hash read failed: {e}"))?;
    if count == 0 { break; }
    hasher.update(&buffer[..count]);
  }
  Ok(hasher.finalize().to_hex().to_string())
}
