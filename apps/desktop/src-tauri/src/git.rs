use std::{
    fs, io,
    path::Path,
    process::{Command, Output},
    sync::Mutex,
};

use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{command_auth::reject_plugin_runner, state::VaultState};

const VAULT_GITIGNORE: &str = "# Managed by DaVinci Notes local version history.\n# Only Markdown notes are source of truth for local history.\n*\n!**/\n!**/*.md\n";
static GIT_OPERATION_LOCK: Mutex<()> = Mutex::new(());

pub(crate) fn run_git(vault_root: &Path, args: &[&str]) -> Result<Output, String> {
    Command::new("git")
    .args(args)
    .current_dir(vault_root)
    .output()
    .map_err(|error| match error.kind() {
      io::ErrorKind::NotFound => "Local version history requires the system Git executable. Install Git, then enable version history again.".to_string(),
      _ => format!("Could not start Git: {error}"),
    })
}

pub(crate) fn require_success(vault_root: &Path, args: &[&str]) -> Result<Output, String> {
    let output = run_git(vault_root, args)?;
    if output.status.success() {
        return Ok(output);
    }

    let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
    Err(if message.is_empty() {
        format!("Git {:?} failed", args)
    } else {
        format!("Git {:?} failed: {message}", args)
    })
}

fn ensure_vault_gitignore(vault_root: &Path) -> Result<(), String> {
    let path = vault_root.join(".gitignore");
    if path.exists() {
        return Ok(());
    }

    fs::write(path, VAULT_GITIGNORE)
        .map_err(|error| format!("Could not create the vault Git ignore policy: {error}"))
}

pub(crate) fn initialize_local_repository(vault_root: &Path) -> Result<(), String> {
    if !vault_root.is_dir() {
        return Err("Selected vault is not a directory".to_string());
    }

    if !vault_root.join(".git").exists() {
        require_success(vault_root, &["init", "--quiet"])?;
    }

    ensure_vault_gitignore(vault_root)
}

fn commit_message(paths: &[String], manual: bool) -> String {
    let label = if paths.len() == 1 {
        paths[0].trim_end_matches(".md").to_string()
    } else {
        format!("{} notes: {}", paths.len(), paths.join(", "))
    };
    format!(
        "{}: {label}",
        if manual { "Saved version" } else { "Auto-save" }
    )
}

fn has_staged_changes(vault_root: &Path) -> Result<bool, String> {
    let output = run_git(vault_root, &["diff", "--cached", "--quiet"])?;
    match output.status.code() {
        Some(0) => Ok(false),
        Some(1) => Ok(true),
        _ => Err(format!(
            "Git staged-change check failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        )),
    }
}

pub(crate) fn create_local_version(
    vault_root: &Path,
    paths: Vec<String>,
    manual: bool,
) -> Result<Option<String>, String> {
    create_local_version_with_message(vault_root, paths, commit_message, manual)
}

fn create_local_version_with_message<F>(
    vault_root: &Path,
    paths: Vec<String>,
    message_for: F,
    manual: bool,
) -> Result<Option<String>, String>
where
    F: FnOnce(&[String], bool) -> String,
{
    let _guard = GIT_OPERATION_LOCK
        .lock()
        .map_err(|_| "Local Git operation lock poisoned".to_string())?;
    create_local_version_locked(vault_root, paths, message_for, manual)
}

fn create_local_version_locked<F>(
    vault_root: &Path,
    paths: Vec<String>,
    message_for: F,
    manual: bool,
) -> Result<Option<String>, String>
where
    F: FnOnce(&[String], bool) -> String,
{
    initialize_local_repository(vault_root)?;

    let markdown_paths: Vec<String> = paths
        .into_iter()
        .filter(|path| path.to_lowercase().ends_with(".md"))
        .collect();
    if markdown_paths.is_empty() {
        return Ok(None);
    }

    for path in &markdown_paths {
        crate::fs::resolve_in_vault(vault_root, path)?;
    }
    let path_refs: Vec<&str> = markdown_paths.iter().map(String::as_str).collect();
    let mut add_args = vec!["add", "--"];
    add_args.extend(path_refs);
    require_success(vault_root, &add_args)?;

    if !has_staged_changes(vault_root)? {
        return Ok(None);
    }

    let message = message_for(&markdown_paths, manual);
    require_success(
        vault_root,
        &[
            "-c",
            "user.name=DaVinci Notes",
            "-c",
            "user.email=local-history@davinci.notes",
            "commit",
            "--quiet",
            "-m",
            &message,
        ],
    )?;
    let revision = require_success(vault_root, &["rev-parse", "HEAD"])?;
    Ok(Some(
        String::from_utf8_lossy(&revision.stdout).trim().to_string(),
    ))
}

pub(crate) fn restore_local_version(
    vault_root: &Path,
    path: String,
    restored_revision: &str,
    content: &str,
) -> Result<Option<String>, String> {
    let _guard = GIT_OPERATION_LOCK
        .lock()
        .map_err(|_| "Local Git operation lock poisoned".to_string())?;
    let destination = crate::fs::resolve_in_vault(vault_root, &path)?;
    fs::write(destination, content).map_err(|error| format!("Could not restore note: {error}"))?;
    let short_revision = &restored_revision[..7];
    create_local_version_locked(
        vault_root,
        vec![path.clone()],
        |_, _| format!("Restore: {path} to {short_revision}"),
        true,
    )
}

/// Phase 0 command. Phase 2's single Version History toggle invokes this lazily.
#[tauri::command]
pub fn initialize_local_git_repository(window: WebviewWindow, app: AppHandle) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    initialize_local_repository(&vault_root)
}

#[tauri::command]
pub async fn create_local_git_version(
    window: WebviewWindow,
    app: AppHandle,
    paths: Vec<String>,
    manual: bool,
) -> Result<Option<String>, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    tauri::async_runtime::spawn_blocking(move || create_local_version(&vault_root, paths, manual))
        .await
        .map_err(|error| format!("Local Git task failed: {error}"))?
}

#[cfg(test)]
#[path = "git_tests.rs"]
mod tests;
