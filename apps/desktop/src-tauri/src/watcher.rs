use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use notify::event::{CreateKind, EventKind, ModifyKind, RemoveKind};
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

        let Ok(events) = result else {
          return;
        };

        let mut changed = HashSet::new();
        let mut removed = HashSet::new();

        for debounced in events {
          let event = debounced.event;
          for path in event.paths {
            if !path.starts_with(&vault_for_events) {
              continue;
            }
            let Some(rel) = vault_relative(&vault_for_events, &path) else {
              continue;
            };
            if !rel.ends_with(".md") && !rel.ends_with(".canvas") {
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
        };

        let _ = app.emit("vault-changed", payload);
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
    Ok(())
  }
}

/// Ignore metadata/access noise — reads during indexing must not look like edits.
pub fn classify_vault_event(kind: &EventKind) -> Option<VaultPathChange> {
  match kind {
    EventKind::Remove(RemoveKind::Any | RemoveKind::File) => Some(VaultPathChange::Removed),
    EventKind::Create(CreateKind::Any | CreateKind::File) => Some(VaultPathChange::Changed),
    EventKind::Modify(ModifyKind::Data(_)) => Some(VaultPathChange::Changed),
    _ => None,
  }
}

fn vault_relative(vault_root: &Path, absolute: &Path) -> Option<String> {
  absolute
    .strip_prefix(vault_root)
    .ok()
    .map(|p| p.to_string_lossy().replace('\\', "/"))
    .filter(|s| !s.is_empty())
}

#[cfg(test)]
mod tests {
  use super::*;
  use notify::event::{AccessKind, DataChange, ModifyKind};

  #[test]
  fn ignores_metadata_and_access_events() {
    assert_eq!(
      classify_vault_event(&EventKind::Modify(ModifyKind::Metadata(
        notify::event::MetadataKind::WriteTime
      ))),
      None
    );
    assert_eq!(
      classify_vault_event(&EventKind::Access(AccessKind::Read)),
      None
    );
  }

  #[test]
  fn treats_data_modify_and_create_as_changed() {
    assert_eq!(
      classify_vault_event(&EventKind::Modify(ModifyKind::Data(DataChange::Any))),
      Some(VaultPathChange::Changed)
    );
    assert_eq!(
      classify_vault_event(&EventKind::Create(CreateKind::File)),
      Some(VaultPathChange::Changed)
    );
  }

  #[test]
  fn treats_file_remove_as_removed() {
    assert_eq!(
      classify_vault_event(&EventKind::Remove(RemoveKind::File)),
      Some(VaultPathChange::Removed)
    );
  }
}
