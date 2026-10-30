use std::path::Path;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::{require_success, run_git, with_git_lock},
    state::VaultState,
};

pub(crate) fn stage_paths_internal(vault_root: &Path, paths: &[String]) -> Result<(), String> {
    with_git_lock(|| {
        if paths.is_empty() {
            require_success(vault_root, &["add", "-A"])?;
        } else {
            let mut args = vec!["add", "-A", "--"];
            for p in paths {
                args.push(p.as_str());
            }
            require_success(vault_root, &args)?;
        }
        Ok(())
    })
}

pub(crate) fn unstage_paths_internal(vault_root: &Path, paths: &[String]) -> Result<(), String> {
    with_git_lock(|| {
        // Test if HEAD exists
        let has_head = match run_git(vault_root, &["rev-parse", "--verify", "HEAD"]) {
            Ok(out) => out.status.success(),
            _ => false,
        };

        if paths.is_empty() {
            if has_head {
                require_success(vault_root, &["restore", "--staged", "."])?;
            } else {
                require_success(vault_root, &["rm", "-r", "--cached", "--ignore-unmatch", "."])?;
            }
        } else {
            if has_head {
                let mut args = vec!["restore", "--staged", "--"];
                for p in paths {
                    args.push(p.as_str());
                }
                require_success(vault_root, &args)?;
            } else {
                let mut args = vec!["rm", "-r", "--cached", "--ignore-unmatch", "--"];
                for p in paths {
                    args.push(p.as_str());
                }
                require_success(vault_root, &args)?;
            }
        }
        Ok(())
    })
}

pub(crate) fn discard_paths_internal(vault_root: &Path, paths: &[String]) -> Result<(), String> {
    with_git_lock(|| {
        if paths.is_empty() {
            let _ = run_git(vault_root, &["restore", "--worktree", "."]);
            let _ = run_git(vault_root, &["clean", "-f", "-d", "."]);
        } else {
            for p in paths {
                let res = run_git(vault_root, &["restore", "--worktree", "--", p.as_str()]);
                if res.is_err() || !res.unwrap().status.success() {
                    let _ = run_git(vault_root, &["clean", "-f", "-d", "--", p.as_str()]);
                }
            }
        }
        Ok(())
    })
}

pub(crate) fn commit_internal(
    vault_root: &Path,
    message: &str,
    amend: bool,
) -> Result<String, String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Commit message cannot be empty".to_string());
    }

    with_git_lock(|| {
        let args = if amend {
            vec!["commit", "--amend", "-m", trimmed]
        } else {
            vec!["commit", "-m", trimmed]
        };
        require_success(vault_root, &args)?;

        let hash_out = require_success(vault_root, &["rev-parse", "HEAD"])?;
        Ok(String::from_utf8_lossy(&hash_out.stdout).trim().to_string())
    })
}

#[tauri::command]
pub async fn git_manager_stage(
    app: AppHandle,
    window: WebviewWindow,
    paths: Vec<String>,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    stage_paths_internal(&root, &paths)
}

#[tauri::command]
pub async fn git_manager_unstage(
    app: AppHandle,
    window: WebviewWindow,
    paths: Vec<String>,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    unstage_paths_internal(&root, &paths)
}

#[tauri::command]
pub async fn git_manager_discard(
    app: AppHandle,
    window: WebviewWindow,
    paths: Vec<String>,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    discard_paths_internal(&root, &paths)
}

#[tauri::command]
pub async fn git_manager_commit(
    app: AppHandle,
    window: WebviewWindow,
    message: String,
    amend: bool,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    commit_internal(&root, &message, amend)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    struct TestRepo(PathBuf);

    impl TestRepo {
        fn new() -> Self {
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock is valid")
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("sophia-git-ops-test-{}-{nanos}", std::process::id()));
            fs::create_dir_all(&root).expect("test vault should be created");

            std::process::Command::new("git")
                .args(["init"])
                .current_dir(&root)
                .output()
                .unwrap();
            std::process::Command::new("git")
                .args(["config", "user.name", "Sophia Tester"])
                .current_dir(&root)
                .output()
                .unwrap();
            std::process::Command::new("git")
                .args(["config", "user.email", "tester@davinci.internal"])
                .current_dir(&root)
                .output()
                .unwrap();
            Self(root)
        }
    }

    impl Drop for TestRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn test_stage_unstage_and_commit() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let file = path.join("note.md");
        fs::write(&file, "Hello world").unwrap();

        // Stage file
        stage_paths_internal(path, &["note.md".to_string()]).unwrap();
        let status = run_git(path, &["status", "--porcelain=v2"]).unwrap();
        let status_str = String::from_utf8_lossy(&status.stdout);
        assert!(status_str.contains("1 A."));

        // Unstage file (initial commit empty HEAD handling)
        unstage_paths_internal(path, &["note.md".to_string()]).unwrap();
        let status2 = run_git(path, &["status", "--porcelain=v2"]).unwrap();
        let status2_str = String::from_utf8_lossy(&status2.stdout);
        assert!(status2_str.contains("? note.md"));

        // Stage again and commit
        stage_paths_internal(path, &["note.md".to_string()]).unwrap();
        let hash = commit_internal(path, "feat: first note", false).unwrap();
        assert_eq!(hash.len(), 40);

        // Amend commit
        let amend_hash = commit_internal(path, "feat: first note amended", true).unwrap();
        assert_eq!(amend_hash.len(), 40);
        let log = run_git(path, &["log", "-1", "--pretty=%s"]).unwrap();
        assert_eq!(String::from_utf8_lossy(&log.stdout).trim(), "feat: first note amended");
    }

    #[test]
    fn test_discard_tracked_and_untracked() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let file = path.join("tracked.md");
        fs::write(&file, "Original").unwrap();
        stage_paths_internal(path, &["tracked.md".to_string()]).unwrap();
        commit_internal(path, "initial", false).unwrap();

        // Modify tracked file and create untracked file
        fs::write(&file, "Modified content").unwrap();
        let untracked = path.join("temp.md");
        fs::write(&untracked, "Temp").unwrap();

        discard_paths_internal(path, &["tracked.md".to_string(), "temp.md".to_string()]).unwrap();

        // Tracked should be restored
        assert_eq!(fs::read_to_string(&file).unwrap(), "Original");
        // Untracked should be deleted
        assert!(!untracked.exists());
    }
}
