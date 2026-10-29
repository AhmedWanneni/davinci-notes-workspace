use std::{
    fs,
    path::Path,
    process::Command,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::with_git_lock,
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictFileVersions {
    pub path: String,
    pub base: Option<String>,
    pub ours: Option<String>,
    pub theirs: Option<String>,
    pub current: String,
    pub is_binary: bool,
    pub ours_exists: bool,
    pub theirs_exists: bool,
}

pub(crate) fn get_stage_content(vault: &Path, stage: u8, rel_path: &str) -> Option<String> {
    let out = Command::new("git")
        .args(["show", &format!(":{stage}:{rel_path}")])
        .current_dir(vault)
        .output()
        .ok()?;
    if out.status.success() {
        Some(String::from_utf8_lossy(&out.stdout).to_string())
    } else {
        None
    }
}

pub(crate) fn check_is_binary(vault: &Path, rel_path: &str) -> bool {
    let out = Command::new("git")
        .args(["diff", "--numstat", "HEAD", "--", rel_path])
        .current_dir(vault)
        .output();
    if let Ok(o) = out {
        let text = String::from_utf8_lossy(&o.stdout);
        if text.starts_with("-\t-\t") {
            return true;
        }
    }
    let abs_path = vault.join(rel_path);
    if let Ok(bytes) = fs::read(&abs_path) {
        let check_len = bytes.len().min(1024);
        return bytes[..check_len].contains(&0);
    }
    false
}

#[tauri::command]
pub fn git_manager_get_conflict_details(
    window: WebviewWindow,
    app: AppHandle,
    path: String,
) -> Result<ConflictFileVersions, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;

    let base = get_stage_content(&vault_root, 1, &path);
    let ours = get_stage_content(&vault_root, 2, &path);
    let theirs = get_stage_content(&vault_root, 3, &path);

    let ours_exists = ours.is_some();
    let theirs_exists = theirs.is_some();

    let abs_path = vault_root.join(&path);
    let current = fs::read_to_string(&abs_path).unwrap_or_default();
    let is_binary = check_is_binary(&vault_root, &path);

    Ok(ConflictFileVersions {
        path,
        base,
        ours,
        theirs,
        current,
        is_binary,
        ours_exists,
        theirs_exists,
    })
}

#[tauri::command]
pub fn git_manager_resolve_conflict(
    window: WebviewWindow,
    app: AppHandle,
    path: String,
    content: String,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let abs_path = vault_root.join(&path);
        fs::write(&abs_path, content).map_err(|e| e.to_string())?;

        let status = Command::new("git")
            .args(["add", "--", &path])
            .current_dir(&vault_root)
            .status()
            .map_err(|e| e.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("Failed to stage resolved conflict for '{path}'"))
        }
    })
}

#[tauri::command]
pub fn git_manager_abort_merge(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let status = Command::new("git")
            .args(["merge", "--abort"])
            .current_dir(&vault_root)
            .status()
            .map_err(|e| e.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err("Failed to abort merge".to_string())
        }
    })
}

#[tauri::command]
pub fn git_manager_continue_merge(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let status = Command::new("git")
            .args(["commit", "--no-edit"])
            .current_dir(&vault_root)
            .output()
            .map_err(|e| e.to_string())?;

        if status.status.success() {
            let out = Command::new("git")
                .args(["rev-parse", "HEAD"])
                .current_dir(&vault_root)
                .output()
                .map_err(|e| e.to_string())?;
            Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
        } else {
            let err = String::from_utf8_lossy(&status.stderr);
            Err(format!("Cannot complete merge: {}", err.trim()))
        }
    })
}
