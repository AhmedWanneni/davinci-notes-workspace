#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::PathBuf,
        process::Command,
        sync::atomic::{AtomicU64, Ordering},
        time::{SystemTime, UNIX_EPOCH},
    };
    use crate::git_manager_conflicts::{
        check_is_binary,
        get_stage_content,
    };

    static TEST_COUNTER: AtomicU64 = AtomicU64::new(1);

    struct TestRepo(PathBuf);
    impl Drop for TestRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn init_repo() -> TestRepo {
        let count = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
        let pid = std::process::id();
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let root = std::env::temp_dir().join(format!("davinci-conflict-{pid}-{nanos}-{count}"));
        let _ = fs::create_dir_all(&root);

        Command::new("git").args(["init", "-b", "main"]).current_dir(&root).output().unwrap();
        Command::new("git").args(["config", "user.name", "Tester"]).current_dir(&root).output().unwrap();
        Command::new("git").args(["config", "user.email", "tester@test.local"]).current_dir(&root).output().unwrap();
        TestRepo(root)
    }

    #[test]
    fn test_adversarial_same_line_and_abort_hash_restoration() {
        let repo = init_repo();
        let path = repo.0.join("note.md");

        fs::write(&path, "Header\nCommon line\nFooter\n").unwrap();
        Command::new("git").args(["add", "."]).current_dir(&repo.0).output().unwrap();
        Command::new("git").args(["commit", "-m", "Base commit"]).current_dir(&repo.0).output().unwrap();

        // Branch feature
        Command::new("git").args(["checkout", "-b", "feature"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, "Header\nFeature line\nFooter\n").unwrap();
        Command::new("git").args(["commit", "-am", "Feature commit"]).current_dir(&repo.0).output().unwrap();

        // Branch main
        Command::new("git").args(["checkout", "main"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, "Header\nMain line\nFooter\n").unwrap();
        Command::new("git").args(["commit", "-am", "Main commit"]).current_dir(&repo.0).output().unwrap();

        // Compute hash before merge
        let before_bytes = fs::read(&path).unwrap();
        let before_hash = blake3::hash(&before_bytes).to_hex();

        // Merge feature into main -> conflict
        let merge_out = Command::new("git").args(["merge", "feature"]).current_dir(&repo.0).output().unwrap();
        assert!(!merge_out.status.success());

        // Verify stage contents
        let base = get_stage_content(&repo.0, 1, "note.md").unwrap();
        let ours = get_stage_content(&repo.0, 2, "note.md").unwrap();
        let theirs = get_stage_content(&repo.0, 3, "note.md").unwrap();

        assert!(base.contains("Common line"));
        assert!(ours.contains("Main line"));
        assert!(theirs.contains("Feature line"));

        // Abort merge
        let abort_out = Command::new("git").args(["merge", "--abort"]).current_dir(&repo.0).output().unwrap();
        assert!(abort_out.status.success());

        // Assert file hash restored exactly
        let after_bytes = fs::read(&path).unwrap();
        let after_hash = blake3::hash(&after_bytes).to_hex();
        assert_eq!(before_hash, after_hash);
    }

    #[test]
    fn test_adversarial_delete_vs_modify() {
        let repo = init_repo();
        let path = repo.0.join("doc.md");

        fs::write(&path, "Base document content\n").unwrap();
        Command::new("git").args(["add", "."]).current_dir(&repo.0).output().unwrap();
        Command::new("git").args(["commit", "-m", "Add doc"]).current_dir(&repo.0).output().unwrap();

        Command::new("git").args(["checkout", "-b", "deleter"]).current_dir(&repo.0).output().unwrap();
        Command::new("git").args(["rm", "doc.md"]).current_dir(&repo.0).output().unwrap();
        Command::new("git").args(["commit", "-m", "Delete doc"]).current_dir(&repo.0).output().unwrap();

        Command::new("git").args(["checkout", "main"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, "Modified document content\n").unwrap();
        Command::new("git").args(["commit", "-am", "Modify doc"]).current_dir(&repo.0).output().unwrap();

        // Merge deleter into main
        let merge = Command::new("git").args(["merge", "deleter"]).current_dir(&repo.0).output().unwrap();
        assert!(!merge.status.success());

        // Ours exists, theirs was deleted
        assert!(get_stage_content(&repo.0, 2, "doc.md").is_some());
        assert!(get_stage_content(&repo.0, 3, "doc.md").is_none());
    }

    #[test]
    fn test_adversarial_binary_conflict_and_resolution() {
        let repo = init_repo();
        let path = repo.0.join("image.png");

        fs::write(&path, &[0x89, b'P', b'N', b'G', 0x00, 0x01]).unwrap();
        Command::new("git").args(["add", "."]).current_dir(&repo.0).output().unwrap();
        Command::new("git").args(["commit", "-m", "Base binary"]).current_dir(&repo.0).output().unwrap();

        Command::new("git").args(["checkout", "-b", "bin-branch"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, &[0x89, b'P', b'N', b'G', 0x00, 0x02, 0x03]).unwrap();
        Command::new("git").args(["commit", "-am", "Bin 2"]).current_dir(&repo.0).output().unwrap();

        Command::new("git").args(["checkout", "main"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, &[0x89, b'P', b'N', b'G', 0x00, 0x04, 0x05]).unwrap();
        Command::new("git").args(["commit", "-am", "Bin 3"]).current_dir(&repo.0).output().unwrap();

        let merge = Command::new("git").args(["merge", "bin-branch"]).current_dir(&repo.0).output().unwrap();
        assert!(!merge.status.success());

        assert!(check_is_binary(&repo.0, "image.png"));

        // Resolve by writing ours
        fs::write(&path, &[0x89, b'P', b'N', b'G', 0x00, 0x04, 0x05]).unwrap();
        Command::new("git").args(["add", "image.png"]).current_dir(&repo.0).output().unwrap();

        // Complete merge
        let commit = Command::new("git").args(["commit", "--no-edit"]).current_dir(&repo.0).output().unwrap();
        assert!(commit.status.success());

        // Verify merge commit has 2 parents
        let rev = Command::new("git").args(["rev-parse", "HEAD^2"]).current_dir(&repo.0).output().unwrap();
        assert!(rev.status.success());
    }

    #[test]
    fn test_external_edit_mid_merge_and_continue() {
        let repo = init_repo();
        let path = repo.0.join("note.md");

        fs::write(&path, "line 1\nline 2\n").unwrap();
        Command::new("git").args(["add", "."]).current_dir(&repo.0).output().unwrap();
        Command::new("git").args(["commit", "-m", "init"]).current_dir(&repo.0).output().unwrap();

        Command::new("git").args(["checkout", "-b", "b1"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, "line 1\nline 2 b1\n").unwrap();
        Command::new("git").args(["commit", "-am", "b1 commit"]).current_dir(&repo.0).output().unwrap();

        Command::new("git").args(["checkout", "main"]).current_dir(&repo.0).output().unwrap();
        fs::write(&path, "line 1\nline 2 main\n").unwrap();
        Command::new("git").args(["commit", "-am", "main commit"]).current_dir(&repo.0).output().unwrap();

        let merge = Command::new("git").args(["merge", "b1"]).current_dir(&repo.0).output().unwrap();
        assert!(!merge.status.success());

        // External tool / Syncthing writes to note.md
        fs::write(&path, "line 1\nline 2 resolved externally\n").unwrap();

        // Stage resolved file
        Command::new("git").args(["add", "note.md"]).current_dir(&repo.0).output().unwrap();

        // Complete merge
        let commit = Command::new("git").args(["commit", "--no-edit"]).current_dir(&repo.0).output().unwrap();
        assert!(commit.status.success());
    }
}
