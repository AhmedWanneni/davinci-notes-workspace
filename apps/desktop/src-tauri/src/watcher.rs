use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use notify::event::{CreateKind, EventKind, ModifyKind, RemoveKind, RenameMode};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use notify::{RecommendedWatcher, RecursiveMode};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Batch window for sync-client bursts (see PERFORMANCE.md).
pub const DEBOUNCE_MS: u64 = 400;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultChangeBatch {
  pub changed: Vec<String>,
  pub removed: Vec<String>,
  pub renamed: Vec<VaultPathRename>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultPathRename {
  pub from: String,
  pub to: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VaultPathChange {
  Changed,
  Removed,
}

pub struct VaultWatcher {
  debouncer: Mutex<Option<Debouncer<RecommendedWatcher, RecommendedCache>>>,
  paused: Arc<AtomicBool>,
}

impl VaultWatcher {
  pub fn new() -> Self {
    Self {
      debouncer: Mutex::new(None),
      paused: Arc::new(AtomicBool::new(false)),
    }
  }

  pub fn set_paused(&self, paused: bool) {
    self.paused.store(paused, Ordering::SeqCst);
  }

  #[allow(dead_code)]
  pub fn is_paused(&self) -> bool {
    self.paused.load(Ordering::SeqCst)
  }

  pub fn stop(&self) {
    if let Ok(mut guard) = self.debouncer.lock() {
      *guard = None;
    }
  }

  pub fn start(&self, app: AppHandle, vault_root: PathBuf) -> Result<(), String> {
    self.stop();

    let vault_for_events = vault_root.clone();
    let paused = Arc::clone(&self.paused);
    let mut debouncer = new_debouncer(
      Duration::from_millis(DEBOUNCE_MS),
      None,
      move |result: DebounceEventResult| {
        if paused.load(Ordering::SeqCst) {
          return;
        }

        let events = match result {
          Ok(events) => events,
          Err(errors) => {
            log::warn!("Vault watcher reported {} event error(s): {:?}", errors.len(), errors);
            return;
          }
        };

        let mut changed = HashSet::new();
        let mut removed = HashSet::new();
        let mut renamed = Vec::new();

        for debounced in events {
          let event = debounced.event;
          if let Some((from, to)) = rename_paths(&vault_for_events, &event) {
            removed.insert(from.clone());
            changed.insert(to.clone());
            renamed.push(VaultPathRename { from, to });
            continue;
          }
          for path in event.paths {
            if !path.starts_with(&vault_for_events) {
              continue;
            }
            let Some(rel) = vault_relative(&vault_for_events, &path) else {
              continue;
            };
            if !is_supported_vault_file(&rel) {
              continue;
            }

            match classify_vault_event(&event.kind) {
              Some(VaultPathChange::Removed) => {
                changed.remove(&rel);
                removed.insert(rel);
              }
              Some(VaultPathChange::Changed) => {
                if !removed.contains(&rel) {
                  changed.insert(rel);
                }
              }
              None => {}
            }
          }
        }

        if changed.is_empty() && removed.is_empty() {
          return;
        }

        let payload = VaultChangeBatch {
          changed: changed.into_iter().collect(),
          removed: removed.into_iter().collect(),
          renamed,
        };

        log::info!(
          "Vault watcher emitting {} changed, {} removed, {} renamed path(s)",
          payload.changed.len(), payload.removed.len(), payload.renamed.len()
        );
        if let Err(error) = app.emit("vault-changed", payload) {
          log::warn!("Vault watcher could not emit vault-changed: {error}");
        }
      },
    )
    .map_err(|e| format!("Watcher init failed: {e}"))?;

    debouncer
      .watch(&vault_root, RecursiveMode::Recursive)
      .map_err(|e| format!("Watcher start failed: {e}"))?;

    let mut guard = self
      .debouncer
      .lock()
      .map_err(|_| "Watcher lock poisoned".to_string())?;
    *guard = Some(debouncer);
    log::info!("Vault watcher started for {}", vault_root.display());
    Ok(())
  }
}

fn rename_paths(vault_root: &Path, event: &notify::Event) -> Option<(String, String)> {
  if !matches!(event.kind, EventKind::Modify(ModifyKind::Name(RenameMode::Both | RenameMode::Any))) {
    return None;
  }
  let [from, to] = event.paths.as_slice() else {
    return None;
  };
  let from = vault_relative(vault_root, from)?;
  let to = vault_relative(vault_root, to)?;
  if !is_supported_vault_file(&from) || !is_supported_vault_file(&to) {
    return None;
  }
  Some((from, to))
}

fn is_supported_vault_file(relative: &str) -> bool {
  let file_name = Path::new(relative).file_name().and_then(|n| n.to_str()).unwrap_or("");
  if file_name.starts_with(".syncthing.") && file_name.ends_with(".tmp") {
    return false;
  }
  matches!(
    Path::new(relative).extension().and_then(|ext| ext.to_str()).map(|ext| ext.to_ascii_lowercase()).as_deref(),
    Some("md" | "canvas" | "png" | "jpg" | "jpeg" | "gif" | "svg" | "webp" | "bmp" | "ico" | "avif"
      | "mp4" | "webm" | "ogg" | "ogv" | "mov" | "mkv" | "m4v" | "mp3" | "wav" | "m4a" | "pdf")
  )
}

/// Ignore metadata/access noise — reads during indexing must not look like edits.
pub fn classify_vault_event(kind: &EventKind) -> Option<VaultPathChange> {
  match kind {
    EventKind::Remove(RemoveKind::Any | RemoveKind::File) => Some(VaultPathChange::Removed),
    EventKind::Create(CreateKind::Any | CreateKind::File) => Some(VaultPathChange::Changed),
    EventKind::Modify(ModifyKind::Any | ModifyKind::Data(_) | ModifyKind::Metadata(_)) => Some(VaultPathChange::Changed),
    _ => None,
  }
}

fn vault_relative(vault_root: &Path, absolute: &Path) -> Option<String> {
  absolute.strip_prefix(vault_root).ok().map(|p| p.to_string_lossy().replace('\\', "/")).filter(|s| !s.is_empty())
}

#[cfg(test)]
mod tests {
  use super::*;
  use notify::event::{AccessKind, DataChange, ModifyKind};

  #[test]
  fn ignores_access_events_but_treats_write_metadata_as_changed() {
    assert_eq!(classify_vault_event(&EventKind::Modify(ModifyKind::Metadata(notify::event::MetadataKind::WriteTime))), Some(VaultPathChange::Changed));
    assert_eq!(classify_vault_event(&EventKind::Access(AccessKind::Read)), None);
  }

  #[test]
  fn treats_data_modify_and_create_as_changed() {
    assert_eq!(classify_vault_event(&EventKind::Modify(ModifyKind::Data(DataChange::Any))), Some(VaultPathChange::Changed));
    assert_eq!(classify_vault_event(&EventKind::Modify(ModifyKind::Any)), Some(VaultPathChange::Changed));
    assert_eq!(classify_vault_event(&EventKind::Create(CreateKind::File)), Some(VaultPathChange::Changed));
  }

  #[test]
  fn treats_file_remove_as_removed() {
    assert_eq!(classify_vault_event(&EventKind::Remove(RemoveKind::File)), Some(VaultPathChange::Removed));
  }

  #[test]
  fn recognizes_supported_file_renames() {
    let root = Path::new("/vault");
    let event = notify::Event::new(EventKind::Modify(ModifyKind::Name(RenameMode::Both)))
      .add_path("/vault/old.md".into()).add_path("/vault/new.md".into());
    assert_eq!(rename_paths(root, &event), Some(("old.md".into(), "new.md".into())));
  }

  #[test]
  fn watches_supported_attachments_and_ignores_syncthing_tmp() {
    assert!(is_supported_vault_file("attachments/photo.PNG"));
    assert!(is_supported_vault_file("attachments/manual.pdf"));
    assert!(!is_supported_vault_file(".syncthing.note.md.tmp"));
    assert!(!is_supported_vault_file("sub/.syncthing.file.png.tmp"));
    assert!(!is_supported_vault_file("attachments/archive.zip"));
    assert!(!is_supported_vault_file("README"));
  }
}
