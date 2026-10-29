use serde::Serialize;
use std::path::Path;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::{initialize_local_repository, run_git},
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitRepoInfo {
    pub git_available: bool,
    pub is_repo: bool,
    pub branch: Option<String>,
    pub is_empty: bool,
    pub is_detached: bool,
}

pub(crate) fn query_git_repo_info(vault_root: &Path) -> GitRepoInfo {
    // 1. Check if git is available on system PATH
    let version_output = match run_git(vault_root, &["--version"]) {
        Ok(out) if out.status.success() => out,
        _ => {
            return GitRepoInfo {
                git_available: false,
                is_repo: false,
                branch: None,
                is_empty: false,
                is_detached: false,
            };
        }
    };
    let _ = version_output;

    // 2. Check if vault is a git repository
    let is_repo = match run_git(vault_root, &["rev-parse", "--is-inside-work-tree"]) {
        Ok(out) => out.status.success() && String::from_utf8_lossy(&out.stdout).trim() == "true",
        _ => false,
    };

    if !is_repo {
        return GitRepoInfo {
            git_available: true,
            is_repo: false,
            branch: None,
            is_empty: false,
            is_detached: false,
        };
    }

    // 3. Check if repo is empty (has zero commits)
    let is_empty = match run_git(vault_root, &["rev-parse", "--verify", "HEAD"]) {
        Ok(out) => !out.status.success(),
        _ => true,
    };

    // 4. Check if detached HEAD
    let is_detached = match run_git(vault_root, &["symbolic-ref", "-q", "HEAD"]) {
        Ok(out) => !out.status.success(),
        _ => true,
    };

    // 5. Get current branch or detached hash
    let branch = if is_detached {
        run_git(vault_root, &["rev-parse", "--short", "HEAD"])
            .ok()
            .and_then(|out| {
                if out.status.success() {
                    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if s.is_empty() { None } else { Some(s) }
                } else {
                    None
                }
            })
    } else {
        run_git(vault_root, &["branch", "--show-current"])
            .ok()
            .and_then(|out| {
                if out.status.success() {
                    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if s.is_empty() { None } else { Some(s) }
                } else {
                    None
                }
            })
    };

    GitRepoInfo {
        git_available: true,
        is_repo: true,
        branch,
        is_empty,
        is_detached,
    }
}

#[tauri::command]
pub async fn get_git_repo_info(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<GitRepoInfo, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    tauri::async_runtime::spawn_blocking(move || Ok(query_git_repo_info(&vault_root)))
        .await
        .map_err(|e| format!("Git repo info task failed: {e}"))?
}

#[tauri::command]
pub async fn init_git_repository(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    tauri::async_runtime::spawn_blocking(move || initialize_local_repository(&vault_root))
        .await
        .map_err(|e| format!("Git init task failed: {e}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    struct TestVault(std::path::PathBuf);

    impl TestVault {
        fn new() -> Self {
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be after Unix epoch")
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("sophia-git-mgr-test-{}-{nanos}", std::process::id()));
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
    fn test_non_repo_returns_is_repo_false() {
        let vault = TestVault::new();
        let info = query_git_repo_info(&vault.0);
        assert!(info.git_available);
        assert!(!info.is_repo);
        assert_eq!(info.branch, None);
    }

    #[test]
    fn test_initialized_repo_returns_info() {
        let vault = TestVault::new();
        initialize_local_repository(&vault.0).unwrap();
        let info = query_git_repo_info(&vault.0);
        assert!(info.git_available);
        assert!(info.is_repo);
        assert!(info.is_empty);
    }
}
