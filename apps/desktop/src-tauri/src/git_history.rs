use std::path::Path;

use serde::Serialize;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::{require_success, restore_local_version},
    state::VaultState,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitVersion {
    pub revision: String,
    pub message: String,
    pub timestamp: i64,
}

fn valid_revision(revision: &str) -> bool {
    (7..=64).contains(&revision.len()) && revision.chars().all(|c| c.is_ascii_hexdigit())
}

fn checked_note(vault: &Path, path: &str) -> Result<(), String> {
    if !path.to_lowercase().ends_with(".md") {
        return Err("Version history is available for Markdown notes only".to_string());
    }
    crate::fs::resolve_in_vault(vault, path).map(|_| ())
}

pub(crate) fn list_versions(vault: &Path, path: &str) -> Result<Vec<GitVersion>, String> {
    checked_note(vault, path)?;
    let output = require_success(vault, &["log", "--format=%H%x1f%s%x1f%ct", "--", path])?;
    Ok(String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter_map(|line| {
            let mut fields = line.split('\u{1f}');
            Some(GitVersion {
                revision: fields.next()?.to_string(),
                message: fields.next()?.to_string(),
                timestamp: fields.next()?.parse().ok()?,
            })
        })
        .collect())
}

pub(crate) fn version_content(vault: &Path, path: &str, revision: &str) -> Result<String, String> {
    checked_note(vault, path)?;
    if !valid_revision(revision) {
        return Err("Invalid local version identifier".to_string());
    }
    let spec = format!("{revision}:{path}");
    let output = require_success(vault, &["show", &spec])?;
    String::from_utf8(output.stdout).map_err(|_| "Version content is not valid UTF-8".to_string())
}

#[tauri::command]
pub fn list_local_git_versions(window: WebviewWindow, app: AppHandle, path: String) -> Result<Vec<GitVersion>, String> {
    reject_plugin_runner(&window)?;
    list_versions(&app.state::<VaultState>().get_root()?, &path)
}

#[tauri::command]
pub fn read_local_git_version(
    window: WebviewWindow,
    app: AppHandle,
    path: String,
    revision: String,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;
    version_content(&app.state::<VaultState>().get_root()?, &path, &revision)
}

#[tauri::command]
pub fn restore_local_git_version(
    window: WebviewWindow,
    app: AppHandle,
    path: String,
    revision: String,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;
    let vault = app.state::<VaultState>().get_root()?;
    let content = version_content(&vault, &path, &revision)?;
    restore_local_version(&vault, path, &revision, &content)?
        .ok_or_else(|| "Restore did not create a local version".to_string())
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    use crate::git::{create_local_version, require_success};

    use super::{list_versions, version_content};

    struct TestVault(std::path::PathBuf);

    impl TestVault {
        fn new() -> Self {
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be after Unix epoch")
                .as_nanos();
            let root = std::env::temp_dir().join(format!(
                "davinci-git-history-{}-{nanos}",
                std::process::id()
            ));
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
    fn lists_real_log_order_and_restores_two_versions_without_rewriting_history() {
        let vault = TestVault::new();
        let path = "note.md";
        let first = "# Note\nfirst\n";
        let second = "# Note\nsecond\n";
        let third = "# Note\nthird\n";

        for content in [first, second, third] {
            fs::write(vault.0.join(path), content).expect("note should be written");
            create_local_version(&vault.0, vec![path.to_string()], false)
                .expect("auto-save should create a commit");
        }

        let versions = list_versions(&vault.0, path).expect("history should be listed");
        let log = require_success(&vault.0, &["log", "--format=%H%x1f%s%x1f%ct", "--", path])
            .expect("Git log should be readable");
        let log_lines = String::from_utf8_lossy(&log.stdout).into_owned();
        let expected: Vec<&str> = log_lines.lines().collect();
        let actual: Vec<String> = versions
            .iter()
            .map(|version| {
                format!(
                    "{}\x1f{}\x1f{}",
                    version.revision, version.message, version.timestamp
                )
            })
            .collect();
        assert_eq!(actual, expected, "native history exactly mirrors git log");

        let first_revision = versions
            .last()
            .expect("first version should exist")
            .revision
            .clone();
        let second_revision = versions[1].revision.clone();
        let first_content =
            version_content(&vault.0, path, &first_revision).expect("first content");
        let second_content =
            version_content(&vault.0, path, &second_revision).expect("second content");

        crate::git::restore_local_version(
            &vault.0,
            path.to_string(),
            &first_revision,
            &first_content,
        )
        .expect("first restore should commit");
        assert_eq!(
            fs::read_to_string(vault.0.join(path)).unwrap(),
            first_content
        );

        crate::git::restore_local_version(
            &vault.0,
            path.to_string(),
            &second_revision,
            &second_content,
        )
        .expect("second restore should commit");
        assert_eq!(
            fs::read_to_string(vault.0.join(path)).unwrap(),
            second_content
        );

        let after = list_versions(&vault.0, path).expect("history should remain readable");
        assert_eq!(
            after.len(),
            5,
            "two restores append rather than replace history"
        );
        assert!(after
            .iter()
            .any(|version| version.revision == first_revision));
        assert!(after
            .iter()
            .any(|version| version.revision == second_revision));
        assert_eq!(
            after[0].message,
            format!("Restore: {path} to {}", &second_revision[..7])
        );
        assert_eq!(
            after[1].message,
            format!("Restore: {path} to {}", &first_revision[..7])
        );
    }
}
