use std::{
    fs,
    time::{SystemTime, UNIX_EPOCH},
};

use super::{create_local_version, initialize_local_repository, require_success};

struct TestVault(std::path::PathBuf);

impl TestVault {
    fn new() -> Self {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos();
        let root =
            std::env::temp_dir().join(format!("davinci-git-phase0-{}-{nanos}", std::process::id()));
        fs::create_dir_all(&root).expect("test vault should be created");
        Self(root)
    }
}

impl Drop for TestVault {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[test]
fn initializes_an_offline_repository_that_stages_only_markdown() {
    let vault = TestVault::new();
    fs::write(vault.0.join("note.md"), "# Offline note\n").expect("note should be written");
    fs::write(vault.0.join("vault-index.db"), "generated").expect("index should be written");
    fs::create_dir_all(vault.0.join(".davinci")).expect("cache folder should be written");
    fs::write(vault.0.join(".davinci/settings-cache.json"), "{}").expect("cache should be written");

    initialize_local_repository(&vault.0).expect("Git should initialize the vault");

    assert!(vault.0.join(".git/HEAD").is_file());
    let remote = require_success(&vault.0, &["remote"]).expect("remote listing should work");
    assert!(String::from_utf8_lossy(&remote.stdout).trim().is_empty());

    require_success(&vault.0, &["add", "--all"]).expect("staging should work offline");
    let staged = require_success(&vault.0, &["diff", "--cached", "--name-only"])
        .expect("staged paths should be readable");
    assert_eq!(String::from_utf8_lossy(&staged.stdout), "note.md\n");
}

#[test]
fn creates_one_readable_commit_for_a_multi_note_save_batch() {
    let vault = TestVault::new();
    fs::write(vault.0.join("one.md"), "# One\n").expect("first note should be written");
    fs::write(vault.0.join("two.md"), "# Two\n").expect("second note should be written");

    let revision = create_local_version(
        &vault.0,
        vec!["one.md".to_string(), "two.md".to_string()],
        false,
    )
    .expect("batch commit should succeed");
    assert!(revision.is_some());

    let log = require_success(&vault.0, &["log", "--format=%s", "-1"])
        .expect("local log should be readable");
    assert_eq!(
        String::from_utf8_lossy(&log.stdout),
        "Auto-save: 2 notes: one.md, two.md\n"
    );
}

#[test]
fn creates_a_manual_version_with_a_distinct_message() {
    let vault = TestVault::new();
    fs::write(vault.0.join("note.md"), "# Note\n").expect("note should be written");

    create_local_version(&vault.0, vec!["note.md".to_string()], true)
        .expect("manual commit should succeed");
    let log = require_success(&vault.0, &["log", "--format=%s", "-1"])
        .expect("local log should be readable");

    assert_eq!(
        String::from_utf8_lossy(&log.stdout),
        "Saved version: note\n"
    );
}
