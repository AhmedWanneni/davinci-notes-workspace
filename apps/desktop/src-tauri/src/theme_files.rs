use std::fs;
use std::path::Path;

use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{command_auth::reject_plugin_runner, fs::resolve_in_vault, state::VaultState};

const THEMES_ROOT: &str = ".davinci/themes";

pub(crate) fn list_theme_directories_in_vault(vault_root: &Path) -> Result<Vec<String>, String> {
    let themes_root = resolve_in_vault(vault_root, THEMES_ROOT)?;
    if !themes_root.exists() {
        return Ok(Vec::new());
    }
    if !themes_root.is_dir() {
        return Err("Themes path is not a directory".to_string());
    }

    let entries =
        fs::read_dir(&themes_root).map_err(|e| format!("Could not read themes directory: {e}"))?;
    let mut directories = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| format!("Could not read theme entry: {e}"))?;
        let file_type = entry
            .file_type()
            .map_err(|e| format!("Could not inspect theme entry: {e}"))?;
        if file_type.is_dir() {
            let name = entry
                .file_name()
                .into_string()
                .map_err(|_| "Theme directory name is not valid UTF-8".to_string())?;
            directories.push(name);
        }
    }
    directories.sort();
    Ok(directories)
}

pub(crate) fn read_theme_file_in_vault(
    vault_root: &Path,
    dir_name: &str,
    relative_path: &str,
) -> Result<String, String> {
    let relative = format!("{THEMES_ROOT}/{dir_name}/{relative_path}");
    let absolute = resolve_in_vault(vault_root, &relative)?;
    fs::read_to_string(&absolute).map_err(|e| format!("Could not read theme file: {e}"))
}

#[tauri::command]
pub fn list_theme_directories(window: WebviewWindow, app: AppHandle) -> Result<Vec<String>, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    list_theme_directories_in_vault(&vault_root)
}

#[tauri::command]
pub fn read_theme_file(
    window: WebviewWindow,
    app: AppHandle,
    dir_name: String,
    relative_path: String,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;
    let vault_root = app.state::<VaultState>().get_root()?;
    read_theme_file_in_vault(&vault_root, &dir_name, &relative_path)
}

#[cfg(test)]
mod tests {
    use super::{list_theme_directories_in_vault, read_theme_file_in_vault};
    use std::fs;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static TEST_VAULT_ID: AtomicUsize = AtomicUsize::new(0);

    struct TestVault(std::path::PathBuf);

    impl TestVault {
        fn new() -> Self {
            let suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be valid")
                .as_nanos();
            let id = TEST_VAULT_ID.fetch_add(1, Ordering::Relaxed);
            let root = std::env::temp_dir().join(format!("davinci-theme-{suffix}-{id}"));
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
    fn lists_and_reads_themes_inside_a_vault() {
        let vault = TestVault::new();
        let theme = vault.0.join(".davinci/themes/fixture-theme");
        fs::create_dir_all(&theme).expect("theme directory should be created");
        fs::write(theme.join("manifest.json"), r#"{"id":"fixture"}"#)
            .expect("manifest should be written");

        assert_eq!(
            list_theme_directories_in_vault(&vault.0).expect("theme list should succeed"),
            vec!["fixture-theme".to_string()],
        );
        assert_eq!(
            read_theme_file_in_vault(&vault.0, "fixture-theme", "manifest.json")
                .expect("theme manifest should be readable"),
            r#"{"id":"fixture"}"#,
        );
    }

    #[test]
    fn treats_a_missing_themes_directory_as_empty_and_rejects_escapes() {
        let vault = TestVault::new();
        assert!(list_theme_directories_in_vault(&vault.0)
            .expect("missing themes directory should be accepted")
            .is_empty(),);
        assert!(read_theme_file_in_vault(&vault.0, "../outside", "theme.css").is_err());
        assert!(read_theme_file_in_vault(&vault.0, "theme", "../theme.css").is_err());
    }
}
