use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use davinci_cli::capture::{capture_note, CaptureTarget};
use davinci_cli::fs_atomic::TempFileGuard;

fn create_temp_vault(prefix: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("dn_{prefix}_{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn test_unrelated_working_dir_capture() {
    let vault = create_temp_vault("unrelated");
    let result = capture_note(&vault, CaptureTarget::QuickNotes, "note from anywhere");
    assert!(result.is_ok());

    let note_path = result.unwrap();
    assert!(note_path.exists());
    assert!(note_path.starts_with(&vault.join("Quick Notes")));

    let content = fs::read_to_string(&note_path).unwrap();
    assert_eq!(content, "note from anywhere\n");
    assert!(!content.starts_with('#')); // ADR-0180: no synthetic heading

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_stdin_multiline_and_unicode() {
    let vault = create_temp_vault("multiline");
    let multiline_text = "Line 1: Meeting notes\nLine 2: 🚀 Unicode العربية 中文\nLine 3: End";

    let path = capture_note(&vault, CaptureTarget::QuickNotes, multiline_text).unwrap();
    let content = fs::read_to_string(&path).unwrap();

    assert_eq!(content, format!("{multiline_text}\n"));

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_vault_path_with_spaces() {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let vault = std::env::temp_dir().join(format!("My Vault With Spaces {nanos}"));
    fs::create_dir_all(&vault).unwrap();

    let path = capture_note(&vault, CaptureTarget::QuickNotes, "thought in spaced vault").unwrap();
    assert!(path.exists());
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        "thought in spaced vault\n"
    );

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_same_second_collision_disambiguation() {
    let vault = create_temp_vault("collision");
    let quick_notes = vault.join("Quick Notes");
    fs::create_dir_all(&quick_notes).unwrap();

    // Capture first note
    let path1 = capture_note(&vault, CaptureTarget::QuickNotes, "First capture").unwrap();
    assert!(path1.exists());

    // Capture second note immediately (same or next second)
    let path2 = capture_note(&vault, CaptureTarget::QuickNotes, "Second capture").unwrap();
    assert!(path2.exists());

    // Verify both files exist and have distinct contents
    assert_ne!(path1, path2);
    assert_eq!(fs::read_to_string(&path1).unwrap(), "First capture\n");
    assert_eq!(fs::read_to_string(&path2).unwrap(), "Second capture\n");

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_simulated_mid_write_kill_leaves_no_partial_file() {
    let vault = create_temp_vault("kill_sim");
    let target = vault.join("Quick Notes").join("target.md");
    fs::create_dir_all(target.parent().unwrap()).unwrap();

    let temp_path = vault.join("Quick Notes").join(".dn-tmp-fake-kill.tmp");
    {
        let _guard = TempFileGuard::new(temp_path.clone());
        fs::write(&temp_path, "partial in-flight bytes...").unwrap();
        assert!(temp_path.exists());
        // Simulate crash / termination before committed = true: guard drops here
    }

    // Verify the uncommitted temp file was deleted on drop and target was never created
    assert!(!temp_path.exists());
    assert!(!target.exists());

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_empty_input_rejected() {
    let vault = create_temp_vault("empty");
    let res1 = capture_note(&vault, CaptureTarget::QuickNotes, "");
    assert!(res1.is_err());
    assert!(res1.unwrap_err().contains("empty"));

    let res2 = capture_note(&vault, CaptureTarget::QuickNotes, "   \n\t  ");
    assert!(res2.is_err());
    assert!(res2.unwrap_err().contains("empty"));

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_daily_note_append_format() {
    let vault = create_temp_vault("daily");

    let path = capture_note(&vault, CaptureTarget::Daily, "first daily thought").unwrap();
    assert!(path.exists());
    let content1 = fs::read_to_string(&path).unwrap();
    assert!(content1.starts_with("# "));
    assert!(content1.contains("- ["));
    assert!(content1.contains("] first daily thought"));

    // Second append to same daily note
    let path2 = capture_note(&vault, CaptureTarget::Daily, "second daily thought").unwrap();
    assert_eq!(path, path2);
    let content2 = fs::read_to_string(&path2).unwrap();
    assert!(content2.contains("first daily thought"));
    assert!(content2.contains("second daily thought"));

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_custom_note_append_and_sanitize() {
    let vault = create_temp_vault("custom");

    let path = capture_note(
        &vault,
        CaptureTarget::CustomNote("Projects/Alpha".to_string()),
        "milestone 1 achieved",
    )
    .unwrap();

    assert!(path.exists());
    assert!(path.ends_with("Projects/Alpha.md"));
    let content = fs::read_to_string(&path).unwrap();
    assert!(content.starts_with("# Alpha\n"));
    assert!(content.contains("milestone 1 achieved"));

    // Traversal rejection
    let bad = capture_note(
        &vault,
        CaptureTarget::CustomNote("../../etc/passwd".to_string()),
        "exploit",
    );
    assert!(bad.is_err());
    assert!(bad.unwrap_err().contains("traversal"));

    let _ = fs::remove_dir_all(&vault);
}
