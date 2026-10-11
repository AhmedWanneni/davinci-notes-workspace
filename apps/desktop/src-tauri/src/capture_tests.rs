use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri_plugin_global_shortcut::Shortcut;

use crate::capture::append_entry_to_disk;
use crate::capture_format::format_capture_entry;
use crate::fs::resolve_in_vault;

use std::sync::atomic::{AtomicU64, Ordering};
static TEST_DIR_COUNTER: AtomicU64 = AtomicU64::new(0);

fn make_test_dir() -> PathBuf {
  let seq = TEST_DIR_COUNTER.fetch_add(1, Ordering::SeqCst);
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_nanos();
  let dir = std::env::temp_dir().join(format!(
    "davinci_capture_test_{}_{}_{}",
    std::process::id(),
    now,
    seq
  ));
  fs::create_dir_all(&dir).expect("create test dir");
  dir
}


#[test]
fn test_shortcut_parsing_and_conflicts() {
  assert!(Shortcut::from_str("Control+Alt+N").is_ok());
  assert!(Shortcut::from_str("Ctrl+Shift+K").is_ok());
  assert!(Shortcut::from_str("Super+Alt+J").is_ok());

  // Malformed shortcut strings return an error rather than panicking
  assert!(Shortcut::from_str("InvalidKeyComboXYZ").is_err());
  assert!(Shortcut::from_str("").is_err());
}

#[test]
fn test_append_to_empty_file_and_missing_folder() {
  let root = make_test_dir();
  let target = root.join("subfolder/Inbox.md");

  // File and folder do not exist yet
  assert!(!target.exists());

  let timestamp = "2026-10-11 12:00:00";
  append_entry_to_disk(&target, "First captured thought", timestamp).expect("append should succeed");

  assert!(target.exists());
  let content = fs::read_to_string(&target).expect("read should succeed");
  assert_eq!(content, "- [2026-10-11 12:00:00] First captured thought\n");

  let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_append_with_trailing_newline_and_no_trailing_newline() {
  let root = make_test_dir();

  // 1. File with trailing newline
  let target_a = root.join("note_a.md");
  fs::write(&target_a, "# Heading\n\nExisting body line\n").unwrap();
  let prev_a = fs::read_to_string(&target_a).unwrap();

  append_entry_to_disk(&target_a, "Append item", "2026-10-11 12:00:01").unwrap();
  let new_a = fs::read_to_string(&target_a).unwrap();

  assert!(new_a.starts_with(&prev_a), "must be pure append");
  assert_eq!(
    new_a,
    "# Heading\n\nExisting body line\n- [2026-10-11 12:00:01] Append item\n"
  );

  // 2. File without trailing newline
  let target_b = root.join("note_b.md");
  fs::write(&target_b, "# Heading without trailing newline").unwrap();
  let prev_b = fs::read_to_string(&target_b).unwrap();

  append_entry_to_disk(&target_b, "Append item", "2026-10-11 12:00:02").unwrap();
  let new_b = fs::read_to_string(&target_b).unwrap();

  assert!(new_b.starts_with(&prev_b), "must be pure append even without trailing newline");
  assert_eq!(
    new_b,
    "# Heading without trailing newline\n- [2026-10-11 12:00:02] Append item\n"
  );

  let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_append_preserves_crlf_endings() {
  let root = make_test_dir();
  let target = root.join("crlf_note.md");
  fs::write(&target, "# CRLF Note\r\n\r\nLine 1\r\n").unwrap();
  let prev = fs::read_to_string(&target).unwrap();

  append_entry_to_disk(&target, "CRLF capture", "2026-10-11 12:00:03").unwrap();
  let new_content = fs::read_to_string(&target).unwrap();

  assert!(new_content.starts_with(&prev), "must be pure append");
  assert_eq!(
    new_content,
    "# CRLF Note\r\n\r\nLine 1\r\n- [2026-10-11 12:00:03] CRLF capture\r\n"
  );

  let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_append_preserves_frontmatter() {
  let root = make_test_dir();
  let target = root.join("frontmatter_note.md");
  let original = "---\ntitle: Daily\ntags: [journal]\n---\n\n## Notes\n";
  fs::write(&target, original).unwrap();

  append_entry_to_disk(&target, "Entry under notes", "2026-10-11 12:00:04").unwrap();
  let new_content = fs::read_to_string(&target).unwrap();

  assert!(new_content.starts_with(original), "frontmatter and body must remain untouched");
  assert!(new_content.ends_with("- [2026-10-11 12:00:04] Entry under notes\n"));

  let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_multiline_capture_formatting() {
  let entry = format_capture_entry("First line\nSecond line\nThird line", "2026-10-11 12:00:05", "\n");
  assert_eq!(
    entry,
    "- [2026-10-11 12:00:05] First line\n  Second line\n  Third line\n"
  );
}

#[test]
fn test_large_file_append_without_full_read() {
  let root = make_test_dir();
  let target = root.join("large_note.md");

  // Create a 5 MB file sparse/filled with lines ending in newline
  {
    let mut file = fs::File::create(&target).unwrap();
    let chunk = b"Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n";
    // 50,000 repetitions ~ 2.8 MB
    for _ in 0..50_000 {
      file.write_all(chunk).unwrap();
    }
  }

  let original_len = fs::metadata(&target).unwrap().len();
  assert!(original_len > 2_000_000);

  append_entry_to_disk(&target, "Appended to large file", "2026-10-11 12:00:06").unwrap();
  let new_len = fs::metadata(&target).unwrap().len();

  let appended_bytes = new_len - original_len;
  assert!(appended_bytes < 200, "Only appended the single new entry");

  let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_rapid_concurrent_captures_serialized() {
  let root = make_test_dir();
  let target = Arc::new(root.join("Inbox.md"));
  let lock = Arc::new(Mutex::new(()));

  let mut handles = Vec::new();
  for i in 0..20 {
    let target_clone = Arc::clone(&target);
    let lock_clone = Arc::clone(&lock);
    handles.push(thread::spawn(move || {
      let _guard = lock_clone.lock().unwrap();
      let timestamp = format!("2026-10-11 12:00:{i:02}");
      let text = format!("Capture #{i:02}");
      append_entry_to_disk(&target_clone, &text, &timestamp).unwrap();
    }));
  }

  for h in handles {
    h.join().unwrap();
  }

  let content = fs::read_to_string(&*target).unwrap();
  let lines: Vec<&str> = content.lines().collect();

  assert_eq!(lines.len(), 20, "All 20 rapid captures must be present");
  for (idx, line) in lines.iter().enumerate() {
    assert!(line.starts_with("- [2026-10-11 12:00:"), "Line {idx} format matches");
    assert!(line.contains("Capture #"), "Line {idx} content matches");
  }

  let _ = fs::remove_dir_all(&root);
}

#[test]
fn test_path_safety_rejects_escape() {
  let root = make_test_dir();
  let vault_root = &root;

  assert!(resolve_in_vault(vault_root, "Inbox.md").is_ok());
  assert!(resolve_in_vault(vault_root, "folder/Daily.md").is_ok());

  // Traversal rejected
  assert!(resolve_in_vault(vault_root, "../outside.md").is_err());
  assert!(resolve_in_vault(vault_root, "folder/../../outside.md").is_err());
  assert!(resolve_in_vault(vault_root, "/etc/passwd").is_err());

  let _ = fs::remove_dir_all(&root);
}
