#[cfg(test)]
mod tests {
  use std::fs;
  use std::time::{SystemTime, UNIX_EPOCH};
  use crate::fs::resolve_in_vault;

  fn make_test_dir() -> std::path::PathBuf {
    let now = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let dir = std::env::temp_dir().join(format!("davinci_test_{}_{}", std::process::id(), now));
    fs::create_dir_all(&dir).expect("create test dir");
    dir
  }

  #[test]
  fn test_resolve_in_vault_prevents_escape() {
    let root = make_test_dir();

    assert!(resolve_in_vault(&root, "notes/a.md").is_ok());
    assert!(resolve_in_vault(&root, "../secret.txt").is_err());
    assert!(resolve_in_vault(&root, "notes/../../secret.txt").is_err());

    let _ = fs::remove_dir_all(&root);
  }

  #[test]
  fn test_atomic_write_replacement() {
    let root = make_test_dir();
    let note_path = root.join("test.md");

    fs::write(&note_path, "original content").expect("write initial");
    assert_eq!(fs::read_to_string(&note_path).unwrap(), "original content");

    let tmp_path = note_path.with_extension(format!("tmp.{}", std::process::id()));
    fs::write(&tmp_path, "updated content").expect("write tmp");
    fs::rename(&tmp_path, &note_path).expect("atomic rename");

    assert_eq!(fs::read_to_string(&note_path).unwrap(), "updated content");
    assert!(!tmp_path.exists());

    let _ = fs::remove_dir_all(&root);
  }
}
