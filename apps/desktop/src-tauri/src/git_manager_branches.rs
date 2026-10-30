use serde::Serialize;
use std::path::Path;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::{require_success, run_git, with_git_lock},
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitBranchInfo {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
}

pub(crate) fn list_branches_internal(vault_root: &Path) -> Result<Vec<GitBranchInfo>, String> {
    let out = run_git(
        vault_root,
        &[
            "branch",
            "-a",
            "--format=%(refname:short)%09%(upstream:short)%09%(HEAD)%09%(upstream:track)",
        ],
    )?;
    if !out.status.success() {
        return Ok(Vec::new());
    }

    let raw = String::from_utf8_lossy(&out.stdout);
    let mut branches = Vec::new();

    for line in raw.lines() {
        let cols: Vec<&str> = line.split('\t').collect();
        if cols.is_empty() || cols[0].trim().is_empty() {
            continue;
        }
        let name = cols[0].trim().to_string();
        let upstream = if cols.len() > 1 && !cols[1].trim().is_empty() {
            Some(cols[1].trim().to_string())
        } else {
            None
        };
        let is_current = cols.len() > 2 && cols[2].trim() == "*";
        let track = if cols.len() > 3 { cols[3].trim() } else { "" };

        let mut ahead = 0;
        let mut behind = 0;
        if track.contains("ahead") {
            if let Some(pos) = track.find("ahead ") {
                ahead = track[pos + 6..].chars().take_while(|c| c.is_ascii_digit()).collect::<String>().parse().unwrap_or(0);
            }
        }
        if track.contains("behind") {
            if let Some(pos) = track.find("behind ") {
                behind = track[pos + 7..].chars().take_while(|c| c.is_ascii_digit()).collect::<String>().parse().unwrap_or(0);
            }
        }

        let is_remote = name.starts_with("origin/") || name.starts_with("remotes/");

        branches.push(GitBranchInfo {
            name,
            is_current,
            is_remote,
            upstream,
            ahead,
            behind,
        });
    }

    Ok(branches)
}

pub(crate) fn is_working_tree_dirty(vault_root: &Path) -> bool {
    let status_out = run_git(vault_root, &["status", "--porcelain=v2"]);
    match status_out {
        Ok(out) => !out.stdout.is_empty(),
        _ => false,
    }
}

pub(crate) fn switch_branch_internal(vault_root: &Path, branch: &str) -> Result<(), String> {
    with_git_lock(|| {
        if is_working_tree_dirty(vault_root) {
            return Err("DIRTY_WORKING_TREE: You have uncommitted changes. Stash, commit, or discard them first.".to_string());
        }
        require_success(vault_root, &["switch", branch]).map(|_| ())
    })
}

pub(crate) fn create_branch_internal(
    vault_root: &Path,
    branch: &str,
    checkout: bool,
) -> Result<(), String> {
    let trimmed = branch.trim();
    if trimmed.is_empty() || trimmed.contains(' ') || trimmed.contains('~') || trimmed.contains('^') {
        return Err("Invalid branch name".to_string());
    }

    with_git_lock(|| {
        if checkout {
            if is_working_tree_dirty(vault_root) {
                return Err("DIRTY_WORKING_TREE: You have uncommitted changes. Stash, commit, or discard them first.".to_string());
            }
            require_success(vault_root, &["switch", "-c", trimmed])?;
        } else {
            require_success(vault_root, &["branch", trimmed])?;
        }
        Ok(())
    })
}

pub(crate) fn delete_branch_internal(
    vault_root: &Path,
    branch: &str,
    force: bool,
) -> Result<(), String> {
    with_git_lock(|| {
        let flag = if force { "-D" } else { "-d" };
        require_success(vault_root, &["branch", flag, branch])?;
        Ok(())
    })
}

#[tauri::command]
pub async fn git_manager_list_branches(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Vec<GitBranchInfo>, String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    list_branches_internal(&root)
}

#[tauri::command]
pub async fn git_manager_switch_branch(
    app: AppHandle,
    window: WebviewWindow,
    branch: String,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    switch_branch_internal(&root, &branch)
}

#[tauri::command]
pub async fn git_manager_create_branch(
    app: AppHandle,
    window: WebviewWindow,
    branch: String,
    checkout: bool,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    create_branch_internal(&root, &branch, checkout)
}

#[tauri::command]
pub async fn git_manager_delete_branch(
    app: AppHandle,
    window: WebviewWindow,
    branch: String,
    force: bool,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    delete_branch_internal(&root, &branch, force)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
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
                .unwrap()
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("sophia-git-branch-test-{}-{nanos}-{count}", std::process::id()));
            fs::create_dir_all(&root).unwrap();

            std::process::Command::new("git").args(["init"]).current_dir(&root).output().unwrap();
            std::process::Command::new("git").args(["config", "user.name", "Sophia Tester"]).current_dir(&root).output().unwrap();
            std::process::Command::new("git").args(["config", "user.email", "test@test.local"]).current_dir(&root).output().unwrap();
            Self(root)
        }
    }

    impl Drop for TestRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn test_branch_lifecycle_and_dirty_guard() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let file = path.join("file.txt");
        fs::write(&file, "first\n").unwrap();
        std::process::Command::new("git").args(["add", "."]).current_dir(path).output().unwrap();
        std::process::Command::new("git").args(["commit", "-m", "init"]).current_dir(path).output().unwrap();

        // 1. List initial branches
        let branches = list_branches_internal(path).unwrap();
        assert!(!branches.is_empty());
        assert!(branches.iter().any(|b| b.is_current));

        // 2. Create new branch and switch
        create_branch_internal(path, "feature-test", true).unwrap();
        let branches2 = list_branches_internal(path).unwrap();
        let feat = branches2.iter().find(|b| b.name == "feature-test").unwrap();
        assert!(feat.is_current);

        // 3. Dirty tree guard
        fs::write(&file, "dirty changes\n").unwrap();
        let switch_err = switch_branch_internal(path, &branches[0].name);
        assert!(switch_err.is_err());
        assert!(switch_err.unwrap_err().contains("DIRTY_WORKING_TREE"));

        // 4. Delete feature branch after switching back (clean worktree)
        fs::remove_file(&file).unwrap();
        let _ = run_git(path, &["restore", "."]);
        switch_branch_internal(path, &branches[0].name).unwrap();
        delete_branch_internal(path, "feature-test", true).unwrap();
        let branches3 = list_branches_internal(path).unwrap();
        assert!(!branches3.iter().any(|b| b.name == "feature-test"));
    }
}
