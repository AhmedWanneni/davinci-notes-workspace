#[cfg(test)]
mod tests {
  use std::fs;
  use std::path::PathBuf;
  use std::sync::atomic::{AtomicU64, Ordering};
  use std::time::{SystemTime, UNIX_EPOCH};

  use crate::capture_validation::{
    generate_unique_quick_note_path, validate_capture_filename, validate_capture_folder,
    DEFAULT_CAPTURE_FOLDER,
  };

  static TEST_DIR_COUNTER: AtomicU64 = AtomicU64::new(0);

  fn make_test_vault() -> PathBuf {
    let seq = TEST_DIR_COUNTER.fetch_add(1, Ordering::SeqCst);
    let now = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let dir = std::env::temp_dir().join(format!(
      "davinci_opt_test_{}_{}_{}",
      std::process::id(),
      now,
      seq
    ));
    fs::create_dir_all(&dir).expect("create test vault");
    dir
  }

  #[test]
  fn test_filename_validation_accepts_valid_names() {
    assert_eq!(validate_capture_filename("My Note").unwrap(), "My Note.md");
    assert_eq!(validate_capture_filename("project-plan.md").unwrap(), "project-plan.md");
    assert_eq!(validate_capture_filename("Note 1.md").unwrap(), "Note 1.md");
    assert_eq!(validate_capture_filename("🦀 Rust & 測試").unwrap(), "🦀 Rust & 測試.md");
    assert_eq!(validate_capture_filename("ملاحظة").unwrap(), "ملاحظة.md");
    // .md is never doubled
    assert_eq!(validate_capture_filename("test.md").unwrap(), "test.md");
  }

  #[test]
  fn test_filename_validation_rejects_hostile_inputs() {
    assert!(validate_capture_filename("").is_err());
    assert!(validate_capture_filename("   ").is_err());

    // Path separators
    assert!(validate_capture_filename("a/b").is_err());
    assert!(validate_capture_filename("a\\b").is_err());
    assert!(validate_capture_filename("../../x").is_err());
    assert!(validate_capture_filename("/etc/x").is_err());

    // Leading dot & traversal
    assert!(validate_capture_filename(".hidden").is_err());
    assert!(validate_capture_filename("..").is_err());

    // Trailing space / dot
    assert!(validate_capture_filename("note ").is_err());
    assert!(validate_capture_filename("note.").is_err());
    assert!(validate_capture_filename("note..md").is_err());

    // Null bytes & control characters
    assert!(validate_capture_filename("note\0").is_err());
    assert!(validate_capture_filename("note\nline").is_err());
    assert!(validate_capture_filename("note\rline").is_err());

    // Reserved characters
    assert!(validate_capture_filename("x:y").is_err());
    assert!(validate_capture_filename("x*y").is_err());
    assert!(validate_capture_filename("x?y").is_err());
    assert!(validate_capture_filename("x\"y").is_err());
    assert!(validate_capture_filename("x<y").is_err());
    assert!(validate_capture_filename("x>y").is_err());
    assert!(validate_capture_filename("x|y").is_err());

    // Windows reserved names
    assert!(validate_capture_filename("CON").is_err());
    assert!(validate_capture_filename("con.md").is_err());
    assert!(validate_capture_filename("prn").is_err());
    assert!(validate_capture_filename("aux").is_err());
    assert!(validate_capture_filename("nul").is_err());
    assert!(validate_capture_filename("com1").is_err());
    assert!(validate_capture_filename("LPT9").is_err());

    // Cap length
    let long_name = "a".repeat(500);
    assert!(validate_capture_filename(&long_name).is_err());
  }

  #[test]
  fn test_folder_validation_defaults_and_custom() {
    let vault = make_test_vault();

    // Default folder
    let (def_path, def_rel) = validate_capture_folder(&vault, None).unwrap();
    assert_eq!(def_rel, DEFAULT_CAPTURE_FOLDER);
    assert_eq!(def_path, vault.join(DEFAULT_CAPTURE_FOLDER));

    let (empty_path, empty_rel) = validate_capture_folder(&vault, Some("")).unwrap();
    assert_eq!(empty_rel, DEFAULT_CAPTURE_FOLDER);
    assert_eq!(empty_path, vault.join(DEFAULT_CAPTURE_FOLDER));

    // Existing custom folder
    let custom = vault.join("work/projects");
    fs::create_dir_all(&custom).unwrap();
    let (c_path, c_rel) = validate_capture_folder(&vault, Some("work/projects")).unwrap();
    assert_eq!(c_rel, "work/projects");
    assert_eq!(c_path.canonicalize().unwrap(), custom.canonicalize().unwrap());

    // Non-existent custom folder
    assert!(validate_capture_folder(&vault, Some("nonexistent/folder")).is_err());

    // Traversal and absolute paths
    assert!(validate_capture_folder(&vault, Some("../outside")).is_err());
    assert!(validate_capture_folder(&vault, Some("/etc/vault")).is_err());
    assert!(validate_capture_folder(&vault, Some("work/../../outside")).is_err());

    // Hidden folders
    let hidden = vault.join(".git");
    fs::create_dir_all(&hidden).unwrap();
    assert!(validate_capture_folder(&vault, Some(".git")).is_err());

    let _ = fs::remove_dir_all(&vault);
  }

  #[test]
  fn test_folder_validation_rejects_symlink_escape() {
    let vault = make_test_vault();
    let outside = make_test_vault();

    // Create a symlink inside the vault pointing outside
    let link_path = vault.join("symlink_outside");
    #[cfg(unix)]
    {
      use std::os::unix::fs::symlink;
      let _ = symlink(&outside, &link_path);
      if link_path.exists() {
        assert!(validate_capture_folder(&vault, Some("symlink_outside")).is_err());
      }
    }

    let _ = fs::remove_dir_all(&vault);
    let _ = fs::remove_dir_all(&outside);
  }

  #[test]
  fn test_twenty_captures_in_same_second_create_unique_files() {
    let vault = make_test_vault();
    let folder = vault.join("Quick Notes");
    fs::create_dir_all(&folder).unwrap();

    let fixed_time = SystemTime::now();
    let mut created_paths = Vec::new();

    for i in 0..20 {
      let candidate = generate_unique_quick_note_path(&folder, fixed_time).unwrap();
      assert!(!candidate.exists(), "candidate must not exist before create #{i}");
      fs::write(&candidate, format!("Note content #{i}\n")).unwrap();
      created_paths.push(candidate);
    }

    // Verify 20 distinct files
    assert_eq!(created_paths.len(), 20);
    created_paths.sort();
    created_paths.dedup();
    assert_eq!(created_paths.len(), 20, "Must be 20 distinct paths");

    let _ = fs::remove_dir_all(&vault);
  }

  #[test]
  fn test_existing_chosen_name_appends_losslessly() {
    use crate::capture_writer::append_entry_to_disk;

    let vault = make_test_vault();
    let target = vault.join("Project.md");
    let original_content = "# Project Tracker\n\nInitial notes.\n";
    fs::write(&target, original_content).unwrap();

    let timestamp = "2026-10-12 11:00:00";
    append_entry_to_disk(&target, "Follow-up thought", timestamp).unwrap();

    let after_content = fs::read_to_string(&target).unwrap();
    assert!(after_content.starts_with(original_content), "Original content must be fully preserved");
    assert!(after_content.contains("- [2026-10-12 11:00:00] Follow-up thought"));
    assert_eq!(
      after_content,
      format!("{original_content}- [2026-10-12 11:00:00] Follow-up thought\n")
    );

    let _ = fs::remove_dir_all(&vault);
  }
}
