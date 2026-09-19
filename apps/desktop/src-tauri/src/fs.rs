use std::fs;
use std::path::{Component, Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;

use crate::state::VaultState;
use crate::watcher::VaultWatcher;

const SUPPORTED_EXTENSIONS: &[&str] = &[
  "md", "canvas",
  // Images
  "png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "avif",
  // Videos
  "mp4", "webm", "ogg", "ogv", "mov", "mkv", "m4v",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileTreeNode {
  pub name: String,
  /// Vault-relative path for supported vault files; `None` for folders.
  pub path: Option<String>,
  pub children: Vec<FileTreeNode>,
}

fn is_safe_relative_path(relative: &str) -> bool {
  let path = Path::new(relative);
  path.is_relative()
    && path
      .components()
      .all(|c| matches!(c, Component::Normal(_)))
}

pub(crate) fn resolve_in_vault(vault_root: &Path, relative: &str) -> Result<PathBuf, String> {
  if !is_safe_relative_path(relative) {
    return Err(format!("Invalid vault-relative path: {relative}"));
  }

  let vault_canonical = vault_root
    .canonicalize()
    .map_err(|e| format!("Vault root unreadable: {e}"))?;

  let joined = vault_root.join(relative);
  if joined.exists() {
    let canonical = joined
      .canonicalize()
      .map_err(|e| format!("Path not found: {relative} ({e})"))?;

    if !canonical.starts_with(&vault_canonical) {
      return Err(format!("Path escapes vault: {relative}"));
    }
    Ok(canonical)
  } else {
    // For new files about to be created, verify existing parent directory doesn't escape
    let mut cur = joined.as_path();
    while let Some(parent) = cur.parent() {
      if parent.exists() {
        let parent_canonical = parent
          .canonicalize()
          .map_err(|e| format!("Parent unreadable: {e}"))?;
        if !parent_canonical.starts_with(&vault_canonical) {
          return Err(format!("Path escapes vault: {relative}"));
        }
        break;
      }
      cur = parent;
    }
    Ok(joined)
  }
}

fn vault_relative(vault_root: &Path, absolute: &Path) -> Option<String> {
  absolute
    .strip_prefix(vault_root)
    .ok()
    .map(|p| p.to_string_lossy().replace('\\', "/"))
}

pub(crate) fn collect_vault_paths(vault_root: &Path) -> Result<Vec<String>, String> {
  let mut paths = Vec::new();

  for entry in WalkDir::new(vault_root)
    .follow_links(false)
    .into_iter()
    .filter_map(|e| e.ok())
  {
    if !entry.file_type().is_file() {
      continue;
    }
    let path = entry.path();
    let ext = path
      .extension()
      .and_then(|e| e.to_str())
      .map(|e| e.to_lowercase());

    if let Some(ref ext_str) = ext {
      if !SUPPORTED_EXTENSIONS.contains(&ext_str.as_str()) {
        continue;
      }
    } else {
      continue;
    }

    if let Some(rel) = vault_relative(vault_root, path) {
      if !rel.is_empty() {
        paths.push(rel);
      }
    }
  }

  paths.sort();
  Ok(paths)
}

fn collect_vault_folders(vault_root: &Path) -> Result<Vec<String>, String> {
  let mut folders = Vec::new();

  for entry in WalkDir::new(vault_root)
    .follow_links(false)
    .min_depth(1)
    .into_iter()
    .filter_map(|e| e.ok())
  {
    if !entry.file_type().is_dir() {
      continue;
    }
    if let Some(rel) = vault_relative(vault_root, entry.path()) {
      if !rel.is_empty() {
        folders.push(rel);
      }
    }
  }

  folders.sort();
  folders.dedup();
  Ok(folders)
}

fn insert_into_tree(nodes: &mut Vec<FileTreeNode>, rel_path: &str) {
  let parts: Vec<&str> = rel_path.split('/').collect();
  let mut level = nodes;

  for (index, segment) in parts.iter().enumerate() {
    let is_file = index == parts.len() - 1;
    let pos = level.iter().position(|n| n.name == *segment);

    if let Some(existing) = pos {
      if is_file {
        level[existing].path = Some(rel_path.to_string());
      } else {
        level = &mut level[existing].children;
      }
    } else {
      let node = FileTreeNode {
        name: segment.to_string(),
        path: if is_file {
          Some(rel_path.to_string())
        } else {
          None
        },
        children: Vec::new(),
      };
      level.push(node);
      let last = level.len() - 1;
      if is_file {
        level.sort_by(|a, b| a.name.cmp(&b.name));
        return;
      }
      level = &mut level[last].children;
    }
  }

  level.sort_by(|a, b| a.name.cmp(&b.name));
}

fn build_file_tree(paths: &[String]) -> Vec<FileTreeNode> {
  let mut roots = Vec::new();
  for path in paths {
    insert_into_tree(&mut roots, path);
  }
  roots.sort_by(|a, b| a.name.cmp(&b.name));
  roots
}

#[tauri::command]
pub fn open_vault(app: AppHandle, path: String) -> Result<String, String> {
  if path.is_empty() {
    return Err("Vault path is required".to_string());
  }

  let chosen = PathBuf::from(path);

  if !chosen.is_dir() {
    return Err("Selected path is not a directory".to_string());
  }

  let canonical = chosen
    .canonicalize()
    .map_err(|e| format!("Cannot open vault: {e}"))?;

  {
    let state = app.state::<VaultState>();
    let mut guard = state
      .root
      .lock()
      .map_err(|_| "Vault state lock poisoned".to_string())?;
    *guard = Some(canonical.clone());
  }

  Ok(canonical.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn start_vault_watcher(app: AppHandle) -> Result<(), String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  app.state::<VaultWatcher>().start(app.clone(), vault_root)
}

#[tauri::command]
pub fn set_vault_watcher_paused(app: AppHandle, paused: bool) {
  app.state::<VaultWatcher>().set_paused(paused);
}

#[tauri::command]
pub fn list_notes(app: AppHandle) -> Result<Vec<String>, String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  collect_vault_paths(&vault_root)
}

#[tauri::command]
pub fn get_file_tree(app: AppHandle) -> Result<Vec<FileTreeNode>, String> {
  let paths = list_notes(app)?;
  Ok(build_file_tree(&paths))
}

#[tauri::command]
pub fn read_note(app: AppHandle, path: String) -> Result<NotePayload, String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;

  let content = fs::read_to_string(&absolute).map_err(|e| format!("Read failed: {e}"))?;
  let mtime = absolute
    .metadata()
    .map_err(|e| format!("Metadata failed: {e}"))?
    .modified()
    .map_err(|e| format!("mtime unavailable: {e}"))?
    .duration_since(std::time::UNIX_EPOCH)
    .map_err(|e| format!("mtime invalid: {e}"))?
    .as_millis() as i64;

  Ok(NotePayload {
    path,
    content,
    mtime,
  })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotePayload {
  pub path: String,
  pub content: String,
  pub mtime: i64,
}

#[tauri::command]
pub fn write_note(app: AppHandle, path: String, content: String) -> Result<(), String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;

  if let Some(parent) = absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Create parent dirs failed: {e}"))?;
  }

  fs::write(&absolute, content.as_bytes()).map_err(|e| format!("Write failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn write_binary_file(app: AppHandle, path: String, data: Vec<u8>) -> Result<(), String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;

  if let Some(parent) = absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Create parent dirs failed: {e}"))?;
  }

  fs::write(&absolute, &data).map_err(|e| format!("Write binary failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn list_folders(app: AppHandle) -> Result<Vec<String>, String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  collect_vault_folders(&vault_root)
}

#[tauri::command]
pub fn create_folder(app: AppHandle, path: String) -> Result<(), String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;

  if absolute.exists() {
    return Err(format!("Folder already exists: {path}"));
  }

  fs::create_dir_all(&absolute).map_err(|e| format!("Create folder failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn rename_folder(
  app: AppHandle,
  from_path: String,
  to_path: String,
) -> Result<(), String> {
  if from_path == to_path {
    return Ok(());
  }

  let vault_root = app.state::<VaultState>().get_root()?;
  let from_absolute = resolve_in_vault(&vault_root, &from_path)?;
  let to_absolute = resolve_in_vault(&vault_root, &to_path)?;

  if !from_absolute.is_dir() {
    return Err(format!("Source folder not found: {from_path}"));
  }

  if to_absolute.exists() {
    return Err(format!("Destination already exists: {to_path}"));
  }

  if let Some(parent) = to_absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Create parent dirs failed: {e}"))?;
  }

  fs::rename(&from_absolute, &to_absolute).map_err(|e| format!("Rename folder failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn rename_note(
  app: AppHandle,
  from_path: String,
  to_path: String,
) -> Result<(), String> {
  if from_path == to_path {
    return Ok(());
  }

  let vault_root = app.state::<VaultState>().get_root()?;
  let from_absolute = resolve_in_vault(&vault_root, &from_path)?;
  let to_absolute = resolve_in_vault(&vault_root, &to_path)?;

  if !from_absolute.is_file() {
    return Err(format!("Source file not found: {from_path}"));
  }

  if to_absolute.exists() {
    return Err(format!("Destination already exists: {to_path}"));
  }

  if let Some(parent) = to_absolute.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Create parent dirs failed: {e}"))?;
  }

  fs::rename(&from_absolute, &to_absolute).map_err(|e| format!("Rename failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn delete_note(app: AppHandle, path: String) -> Result<(), String> {
  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;

  if !absolute.is_file() {
    return Err(format!("Source file not found: {path}"));
  }

  fs::remove_file(&absolute).map_err(|e| format!("Delete failed: {e}"))?;
  Ok(())
}

#[tauri::command]
pub fn delete_folder(app: AppHandle, path: String) -> Result<(), String> {
  if path.is_empty() || path == "." || path == "/" {
    return Err("Cannot delete vault root".to_string());
  }

  let vault_root = app.state::<VaultState>().get_root()?;
  let absolute = resolve_in_vault(&vault_root, &path)?;

  if absolute == vault_root {
    return Err("Cannot delete vault root".to_string());
  }

  if !absolute.is_dir() {
    return Err(format!("Source folder not found: {path}"));
  }

  fs::remove_dir_all(&absolute).map_err(|e| format!("Delete folder failed: {e}"))?;
  Ok(())
}
