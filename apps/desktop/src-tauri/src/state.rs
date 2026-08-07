use std::path::PathBuf;
use std::sync::Mutex;

/// Active vault root on disk (absolute path).
pub struct VaultState {
  pub root: Mutex<Option<PathBuf>>,
}

impl VaultState {
  pub fn new() -> Self {
    Self {
      root: Mutex::new(None),
    }
  }

  pub fn get_root(&self) -> Result<PathBuf, String> {
    self
      .root
      .lock()
      .map_err(|_| "Vault state lock poisoned".to_string())?
      .clone()
      .ok_or_else(|| "No vault is open".to_string())
  }
}
