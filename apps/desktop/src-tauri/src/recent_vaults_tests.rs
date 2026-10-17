#[cfg(test)]
mod tests {
  use crate::recent_vaults::{
    add_or_update_recent_vault, build_summaries, derive_vault_name,
    remove_recent_vault_by_path, RecentVaultEntry, MAX_RECENT_VAULTS,
  };

  #[test]
  fn test_derive_vault_name() {
    assert_eq!(derive_vault_name("/Users/test/Documents/MyVault"), "MyVault");
    assert_eq!(derive_vault_name("/tmp/notes"), "notes");
  }

  #[test]
  fn test_add_or_update_and_dedupe() {
    let mut entries = Vec::new();
    add_or_update_recent_vault(&mut entries, "/tmp/vault1", 1000);
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].last_opened_at, 1000);

    // Update existing with newer timestamp
    add_or_update_recent_vault(&mut entries, "/tmp/vault1", 2000);
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].last_opened_at, 2000);

    // Add second vault
    add_or_update_recent_vault(&mut entries, "/tmp/vault2", 3000);
    assert_eq!(entries.len(), 2);
    assert_eq!(entries[0].path, "/tmp/vault2");
    assert_eq!(entries[1].path, "/tmp/vault1");
  }

  #[test]
  fn test_cap_at_twenty() {
    let mut entries = Vec::new();
    for i in 0..25 {
      add_or_update_recent_vault(&mut entries, &format!("/tmp/vault_{i}"), i as i64 * 100);
    }
    assert_eq!(entries.len(), MAX_RECENT_VAULTS);
    assert_eq!(entries[0].path, "/tmp/vault_24");
  }

  #[test]
  fn test_remove_by_path() {
    let mut entries = vec![
      RecentVaultEntry {
        path: "/tmp/vault1".to_string(),
        name: "vault1".to_string(),
        last_opened_at: 1000,
      },
      RecentVaultEntry {
        path: "/tmp/vault2".to_string(),
        name: "vault2".to_string(),
        last_opened_at: 2000,
      },
    ];

    remove_recent_vault_by_path(&mut entries, "/tmp/vault1");
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].path, "/tmp/vault2");
  }

  #[test]
  fn test_build_summaries_marks_existence() {
    let temp_dir = std::env::temp_dir();
    let real_dir = temp_dir.to_string_lossy().to_string();
    let missing_dir = "/path/that/definitely/does/not/exist_12345".to_string();

    let entries = vec![
      RecentVaultEntry {
        path: real_dir.clone(),
        name: "temp".to_string(),
        last_opened_at: 2000,
      },
      RecentVaultEntry {
        path: missing_dir.clone(),
        name: "missing".to_string(),
        last_opened_at: 1000,
      },
    ];

    let summaries = build_summaries(&entries);
    assert_eq!(summaries.len(), 2);
    assert!(summaries[0].exists);
    assert!(!summaries[1].exists);
  }
}
