use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::with_git_lock,
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRemoteInfo {
    pub name: String,
    pub fetch_url: String,
    pub push_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitTrackingStatus {
    pub ahead: usize,
    pub behind: usize,
    pub upstream: Option<String>,
}

pub(crate) fn get_remote_url_internal(vault: &std::path::Path, remote_name: &str) -> Option<String> {
    let out = Command::new("git")
        .args(["remote", "get-url", remote_name])
        .current_dir(vault)
        .output()
        .ok()?;
    if out.status.success() {
        let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !url.is_empty() {
            return Some(url);
        }
    }
    None
}

#[tauri::command]
pub fn git_manager_get_remotes(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<Vec<GitRemoteInfo>, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    let out = Command::new("git")
        .args(["remote", "-v"])
        .current_dir(&vault_root)
        .output()
        .map_err(|e| e.to_string())?;

    if !out.status.success() {
        return Ok(Vec::new());
    }

    let text = String::from_utf8_lossy(&out.stdout);
    let mut remotes: std::collections::BTreeMap<String, (String, String)> =
        std::collections::BTreeMap::new();

    for line in text.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 3 {
            let name = parts[0].to_string();
            let url = parts[1].to_string();
            let kind = parts[2];
            let entry = remotes.entry(name).or_insert_with(|| (String::new(), String::new()));
            if kind.contains("(fetch)") {
                entry.0 = url;
            } else if kind.contains("(push)") {
                entry.1 = url;
            }
        }
    }

    Ok(remotes
        .into_iter()
        .map(|(name, (fetch_url, push_url))| GitRemoteInfo {
            fetch_url: if fetch_url.is_empty() { push_url.clone() } else { fetch_url.clone() },
            push_url: if push_url.is_empty() { fetch_url } else { push_url },
            name,
        })
        .collect())
}

#[tauri::command]
pub fn git_manager_set_remote(
    window: WebviewWindow,
    app: AppHandle,
    name: String,
    url: String,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    with_git_lock(|| {
        let exists = Command::new("git")
            .args(["remote", "get-url", &name])
            .current_dir(&vault_root)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        let status = if exists {
            Command::new("git")
                .args(["remote", "set-url", &name, &url])
                .current_dir(&vault_root)
                .status()
        } else {
            Command::new("git")
                .args(["remote", "add", &name, &url])
                .current_dir(&vault_root)
                .status()
        }
        .map_err(|e| e.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("Failed to configure remote '{name}' with url '{url}'"))
        }
    })
}

#[tauri::command]
pub fn git_manager_get_tracking_status(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<GitTrackingStatus, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;

    let up_out = Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"])
        .current_dir(&vault_root)
        .output()
        .map_err(|e| e.to_string())?;

    if !up_out.status.success() {
        return Ok(GitTrackingStatus {
            ahead: 0,
            behind: 0,
            upstream: None,
        });
    }

    let upstream = String::from_utf8_lossy(&up_out.stdout).trim().to_string();

    let count_out = Command::new("git")
        .args(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"])
        .current_dir(&vault_root)
        .output()
        .map_err(|e| e.to_string())?;

    if !count_out.status.success() {
        return Ok(GitTrackingStatus {
            ahead: 0,
            behind: 0,
            upstream: Some(upstream),
        });
    }

    let counts_str = String::from_utf8_lossy(&count_out.stdout);
    let parts: Vec<&str> = counts_str.split_whitespace().collect();
    let ahead = parts.get(0).and_then(|s| s.parse::<usize>().ok()).unwrap_or(0);
    let behind = parts.get(1).and_then(|s| s.parse::<usize>().ok()).unwrap_or(0);

    Ok(GitTrackingStatus {
        ahead,
        behind,
        upstream: Some(upstream),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remote_url_internal_not_found() {
        let temp = std::env::temp_dir().join(format!("test-remote-{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp);
        assert_eq!(get_remote_url_internal(&temp, "origin"), None);
        let _ = std::fs::remove_dir_all(&temp);
    }
}

