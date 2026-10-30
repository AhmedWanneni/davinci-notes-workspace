use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};
use tauri::WebviewWindow;

use crate::{
    command_auth::reject_plugin_runner,
    git_auth::store_pat_for_remote,
    git_remote::{classify, git_with_pat},
};

fn validate_destination(dest: &Path) -> Result<(), String> {
    if dest.exists() {
        if dest.is_file() {
            return Err("Destination path is an existing file.".to_string());
        }
        let mut entries = fs::read_dir(dest)
            .map_err(|e| format!("Failed to inspect destination directory: {e}"))?;
        if entries.next().is_some() {
            return Err("Destination directory is not empty.".to_string());
        }
    }
    Ok(())
}

#[tauri::command]
pub fn git_manager_clone_repo(
    window: WebviewWindow,
    url: String,
    destination: String,
    token: Option<String>,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;

    let trimmed_url = url.trim();
    if trimmed_url.is_empty() {
        return Err("Repository URL cannot be empty.".to_string());
    }

    let dest_path = PathBuf::from(destination.trim());
    if dest_path.as_os_str().is_empty() {
        return Err("Destination path cannot be empty.".to_string());
    }

    validate_destination(&dest_path)?;

    let parent_dir = dest_path
        .parent()
        .filter(|p| p.exists())
        .unwrap_or_else(|| Path::new("."));

    let token_clean = token
        .as_deref()
        .map(str::trim)
        .filter(|t| !t.is_empty());

    let output = if let Some(pat) = token_clean {
        git_with_pat(
            parent_dir,
            &["clone", trimmed_url, dest_path.to_str().unwrap_or_default()],
            pat,
            "git",
        )?
    } else {
        Command::new("git")
            .args(["clone", trimmed_url, dest_path.to_str().unwrap_or_default()])
            .current_dir(parent_dir)
            .output()
            .map_err(|e| format!("Failed to spawn git clone: {e}"))?
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let classification = classify(&stderr);
        return Err(format!("Clone failed ({classification}): {stderr}"));
    }

    // If PAT was provided, save in OS keychain for this cloned vault and remote URL
    if let Some(pat) = token_clean {
        let _ = store_pat_for_remote(&dest_path, trimmed_url, pat);
    }

    Ok(dest_path.to_string_lossy().to_string())
}
