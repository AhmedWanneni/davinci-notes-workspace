use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::with_git_lock,
    git_auth::get_pat_for_remote,
    git_manager_remote::get_remote_url_internal,
    git_remote::{classify, git_with_pat},
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitSyncResult {
    pub success: bool,
    pub message: String,
}

fn run_git_remote_command(
    vault: &std::path::Path,
    args: &[&str],
    remote_url: Option<&str>,
) -> Result<std::process::Output, String> {
    if let Some(url) = remote_url {
        if url.starts_with("https://") {
            if let Some(pat) = get_pat_for_remote(vault, url) {
                return git_with_pat(vault, args, &pat, "git");
            }
        }
    }
    Command::new("git")
        .args(args)
        .current_dir(vault)
        .output()
        .map_err(|e| format!("Failed to execute git: {e}"))
}

#[tauri::command]
pub fn git_manager_fetch(
    window: WebviewWindow,
    app: AppHandle,
    remote: Option<String>,
) -> Result<GitSyncResult, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let remote_name = remote.unwrap_or_else(|| "origin".to_string());
        let remote_url = get_remote_url_internal(&vault_root, &remote_name);

        let output = run_git_remote_command(
            &vault_root,
            &["fetch", "--prune", &remote_name],
            remote_url.as_deref(),
        )?;

        if output.status.success() {
            Ok(GitSyncResult {
                success: true,
                message: "Fetch completed successfully.".to_string(),
            })
        } else {
            let err = String::from_utf8_lossy(&output.stderr);
            Err(format!("Fetch failed: {}", classify(&err)))
        }
    })
}

#[tauri::command]
pub fn git_manager_pull(
    window: WebviewWindow,
    app: AppHandle,
    remote: Option<String>,
) -> Result<GitSyncResult, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let remote_name = remote.unwrap_or_else(|| "origin".to_string());
        let remote_url = get_remote_url_internal(&vault_root, &remote_name);

        let output = run_git_remote_command(
            &vault_root,
            &["pull", &remote_name],
            remote_url.as_deref(),
        )?;

        if output.status.success() {
            let msg = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Ok(GitSyncResult {
                success: true,
                message: if msg.is_empty() { "Pull completed successfully.".to_string() } else { msg },
            })
        } else {
            let err = String::from_utf8_lossy(&output.stderr);
            Err(format!("Pull failed: {}", err.trim()))
        }
    })
}

#[tauri::command]
pub fn git_manager_push(
    window: WebviewWindow,
    app: AppHandle,
    remote: Option<String>,
    branch: Option<String>,
    force: Option<bool>,
) -> Result<GitSyncResult, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let remote_name = remote.unwrap_or_else(|| "origin".to_string());
        let remote_url = get_remote_url_internal(&vault_root, &remote_name);

        let mut args = vec!["push"];
        if force.unwrap_or(false) {
            args.push("--force");
        }

        let branch_name;
        if let Some(b) = branch {
            branch_name = b;
            args.push("-u");
            args.push(&remote_name);
            args.push(&branch_name);
        } else {
            args.push(&remote_name);
        }

        let output = run_git_remote_command(&vault_root, &args, remote_url.as_deref())?;

        if output.status.success() {
            let msg = String::from_utf8_lossy(&output.stderr).trim().to_string();
            Ok(GitSyncResult {
                success: true,
                message: if msg.is_empty() { "Push completed successfully.".to_string() } else { msg },
            })
        } else {
            let err = String::from_utf8_lossy(&output.stderr);
            Err(format!("Push failed: {}", err.trim()))
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static TEST_COUNTER: AtomicU64 = AtomicU64::new(1);

    struct TestDir(std::path::PathBuf);
    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn setup_local_remote_fixture() -> (TestDir, TestDir) {
        let count = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
        let pid = std::process::id();
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let bare = std::env::temp_dir().join(format!("davinci-bare-{pid}-{nanos}-{count}"));
        let work = std::env::temp_dir().join(format!("davinci-work-{pid}-{nanos}-{count}"));
        let _ = fs::create_dir_all(&bare);
        let _ = fs::create_dir_all(&work);

        Command::new("git").args(["init", "--bare"]).current_dir(&bare).output().unwrap();
        Command::new("git").args(["init", "-b", "main"]).current_dir(&work).output().unwrap();
        Command::new("git").args(["config", "user.email", "a@test.local"]).current_dir(&work).output().unwrap();
        Command::new("git").args(["config", "user.name", "Tester"]).current_dir(&work).output().unwrap();
        Command::new("git").args(["remote", "add", "origin", bare.to_str().unwrap()]).current_dir(&work).output().unwrap();

        fs::write(work.join("Note.md"), "# Initial\n").unwrap();
        Command::new("git").args(["add", "."]).current_dir(&work).output().unwrap();
        Command::new("git").args(["commit", "-m", "Initial commit"]).current_dir(&work).output().unwrap();

        (TestDir(bare), TestDir(work))
    }

    #[test]
    fn test_push_fetch_pull_against_local_bare_remote() {
        let (_bare, work) = setup_local_remote_fixture();

        let push_res = run_git_remote_command(&work.0, &["push", "-u", "origin", "main"], None);
        assert!(push_res.is_ok());
        assert!(push_res.unwrap().status.success());

        let fetch_res = run_git_remote_command(&work.0, &["fetch", "origin"], None);
        assert!(fetch_res.is_ok());
        assert!(fetch_res.unwrap().status.success());

        let pull_res = run_git_remote_command(&work.0, &["pull", "origin", "main"], None);
        assert!(pull_res.is_ok());
        assert!(pull_res.unwrap().status.success());
    }
}
