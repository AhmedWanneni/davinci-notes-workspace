use serde::Serialize;
use std::{
    fs,
    io::Write,
    path::Path,
    process::{Command, Stdio},
};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::{run_git, with_git_lock},
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitFileDiff {
    pub path: String,
    pub original_content: String,
    pub modified_content: String,
    pub patch: String,
    pub staged: bool,
}

pub(crate) fn get_file_diff_internal(
    vault_root: &Path,
    rel_path: &str,
    staged: bool,
) -> Result<GitFileDiff, String> {
    with_git_lock(|| {
        let (original_content, modified_content, patch) = if staged {
            // Staged: compare HEAD against index (:path)
            let orig_out = run_git(vault_root, &["show", &format!("HEAD:{rel_path}")]);
            let orig = orig_out
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                .unwrap_or_default();

            let mod_out = run_git(vault_root, &["show", &format!(":{rel_path}")]);
            let modi = mod_out
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                .unwrap_or_default();

            let diff_out = run_git(vault_root, &["diff", "--cached", "-U3", "--", rel_path]);
            let patch_str = diff_out
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                .unwrap_or_default();

            (orig, modi, patch_str)
        } else {
            // Unstaged: compare index (:path) against working tree
            let orig_out = run_git(vault_root, &["show", &format!(":{rel_path}")]);
            let orig = orig_out
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                .unwrap_or_else(|| {
                    // Untracked fallback: check HEAD
                    run_git(vault_root, &["show", &format!("HEAD:{rel_path}")])
                        .ok()
                        .filter(|o| o.status.success())
                        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                        .unwrap_or_default()
                });

            let file_full_path = vault_root.join(rel_path);
            let modi = fs::read_to_string(&file_full_path).unwrap_or_default();

            let diff_out = run_git(vault_root, &["diff", "-U3", "--", rel_path]);
            let patch_str = diff_out
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                .unwrap_or_default();

            (orig, modi, patch_str)
        };

        Ok(GitFileDiff {
            path: rel_path.to_string(),
            original_content,
            modified_content,
            patch,
            staged,
        })
    })
}

pub(crate) fn apply_patch_internal(
    vault_root: &Path,
    patch: &str,
    cached: bool,
    reverse: bool,
) -> Result<(), String> {
    with_git_lock(|| {
        let mut cmd = Command::new("git");
        cmd.current_dir(vault_root);
        cmd.arg("apply");
        cmd.arg("--whitespace=nowarn");
        if cached {
            cmd.arg("--cached");
        }
        if reverse {
            cmd.arg("--reverse");
        }
        cmd.arg("-");
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn git apply: {e}"))?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin
                .write_all(patch.as_bytes())
                .map_err(|e| format!("Failed to write patch to git apply: {e}"))?;
        }

        let output = child
            .wait_with_output()
            .map_err(|e| format!("Failed waiting on git apply: {e}"))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("git apply failed: {err}"));
        }

        Ok(())
    })
}

#[tauri::command]
pub async fn git_manager_get_file_diff(
    app: AppHandle,
    window: WebviewWindow,
    path: String,
    staged: bool,
) -> Result<GitFileDiff, String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    get_file_diff_internal(&root, &path, staged)
}

#[tauri::command]
pub async fn git_manager_apply_patch(
    app: AppHandle,
    window: WebviewWindow,
    patch: String,
    cached: bool,
    reverse: bool,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    apply_patch_internal(&root, &patch, cached, reverse)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        path::PathBuf,
        sync::atomic::{AtomicU64, Ordering},
        time::{SystemTime, UNIX_EPOCH},
    };

    static TEST_COUNTER: AtomicU64 = AtomicU64::new(1);

    struct TestRepo(PathBuf);

    impl TestRepo {
        fn new() -> Self {
            let count = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock is valid")
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("sophia-git-diff-test-{}-{nanos}-{count}", std::process::id()));
            fs::create_dir_all(&root).expect("test vault should be created");

            Command::new("git").args(["init"]).current_dir(&root).output().unwrap();
            Command::new("git").args(["config", "user.name", "Tester"]).current_dir(&root).output().unwrap();
            Command::new("git").args(["config", "user.email", "test@d.in"]).current_dir(&root).output().unwrap();
            Self(root)
        }
    }

    impl Drop for TestRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn test_diff_unstaged_and_staged() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let note = path.join("note.md");
        fs::write(&note, "Initial line 1\nInitial line 2\n").unwrap();
        Command::new("git").args(["add", "."]).current_dir(path).output().unwrap();
        Command::new("git").args(["commit", "-m", "init"]).current_dir(path).output().unwrap();

        // Modify file in working tree
        fs::write(&note, "Initial line 1\nModified line 2\n").unwrap();

        // Check unstaged diff
        let diff_unstaged = get_file_diff_internal(path, "note.md", false).unwrap();
        assert_eq!(diff_unstaged.original_content, "Initial line 1\nInitial line 2\n");
        assert_eq!(diff_unstaged.modified_content, "Initial line 1\nModified line 2\n");
        assert!(diff_unstaged.patch.contains("-Initial line 2"));
        assert!(diff_unstaged.patch.contains("+Modified line 2"));

        // Stage file and check staged diff
        Command::new("git").args(["add", "note.md"]).current_dir(path).output().unwrap();
        let diff_staged = get_file_diff_internal(path, "note.md", true).unwrap();
        assert_eq!(diff_staged.original_content, "Initial line 1\nInitial line 2\n");
        assert_eq!(diff_staged.modified_content, "Initial line 1\nModified line 2\n");
        assert!(diff_staged.patch.contains("-Initial line 2"));
    }

    #[test]
    fn test_apply_patch_cached() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let note = path.join("note.md");
        fs::write(&note, "Line A\nLine B\n").unwrap();
        Command::new("git").args(["add", "."]).current_dir(path).output().unwrap();
        Command::new("git").args(["commit", "-m", "init"]).current_dir(path).output().unwrap();

        // Modify working tree
        fs::write(&note, "Line A\nLine B Modified\n").unwrap();
        let diff = get_file_diff_internal(path, "note.md", false).unwrap();

        // Apply hunk patch to index (stage hunk)
        apply_patch_internal(path, &diff.patch, true, false).unwrap();

        let staged_diff = get_file_diff_internal(path, "note.md", true).unwrap();
        assert!(staged_diff.patch.contains("+Line B Modified"));
    }
}
