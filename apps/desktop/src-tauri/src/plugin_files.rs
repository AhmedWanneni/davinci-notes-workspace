use std::fs;
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{command_auth::reject_plugin_runner, fs::resolve_in_vault, state::VaultState};

const PLUGINS_ROOT: &str = ".davinci/plugins";

fn plugin_path(
    vault_root: &Path,
    dir_name: &str,
    relative_path: Option<&str>,
) -> Result<PathBuf, String> {
    let relative = match relative_path {
        Some(path) => format!("{PLUGINS_ROOT}/{dir_name}/{path}"),
        None => format!("{PLUGINS_ROOT}/{dir_name}"),
    };
    resolve_in_vault(vault_root, &relative)
}

pub(crate) fn list_plugin_directories_in_vault(vault_root: &Path) -> Result<Vec<String>, String> {
    let plugins_root = resolve_in_vault(vault_root, PLUGINS_ROOT)?;
    if !plugins_root.exists() {
        return Ok(Vec::new());
    }
    if !plugins_root.is_dir() {
        return Err("Plugins path is not a directory".to_string());
    }
    let mut directories = Vec::new();
    for entry in fs::read_dir(plugins_root)
        .map_err(|error| format!("Could not read plugins directory: {error}"))?
    {
        let entry = entry.map_err(|error| format!("Could not read plugin entry: {error}"))?;
        if entry
            .file_type()
            .map_err(|error| format!("Could not inspect plugin entry: {error}"))?
            .is_dir()
        {
            directories.push(
                entry
                    .file_name()
                    .into_string()
                    .map_err(|_| "Plugin directory name is not valid UTF-8".to_string())?,
            );
        }
    }
    directories.sort();
    Ok(directories)
}

pub(crate) fn read_plugin_file_in_vault(
    vault_root: &Path,
    dir_name: &str,
    relative_path: &str,
) -> Result<String, String> {
    fs::read_to_string(plugin_path(vault_root, dir_name, Some(relative_path))?)
        .map_err(|error| format!("Could not read plugin file: {error}"))
}

pub(crate) fn write_plugin_file_in_vault(
    vault_root: &Path,
    dir_name: &str,
    relative_path: &str,
    contents: &str,
) -> Result<(), String> {
    let file = plugin_path(vault_root, dir_name, Some(relative_path))?;
    if let Some(parent) = file.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Could not create plugin data directory: {error}"))?;
    }
    fs::write(file, contents).map_err(|error| format!("Could not write plugin file: {error}"))
}

#[tauri::command]
pub fn list_plugin_directories(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<Vec<String>, String> {
    reject_plugin_runner(&window)?;
    list_plugin_directories_in_vault(&app.state::<VaultState>().get_root()?)
}

#[tauri::command]
pub fn read_plugin_file(
    window: WebviewWindow,
    app: AppHandle,
    dir_name: String,
    relative_path: String,
) -> Result<String, String> {
    reject_plugin_runner(&window)?;
    read_plugin_file_in_vault(
        &app.state::<VaultState>().get_root()?,
        &dir_name,
        &relative_path,
    )
}

#[tauri::command]
pub fn write_plugin_file(
    window: WebviewWindow,
    app: AppHandle,
    dir_name: String,
    relative_path: String,
    contents: String,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    write_plugin_file_in_vault(
        &app.state::<VaultState>().get_root()?,
        &dir_name,
        &relative_path,
        &contents,
    )
}

#[cfg(test)]
mod tests {
    use super::{
        list_plugin_directories_in_vault, read_plugin_file_in_vault, write_plugin_file_in_vault,
    };
    use std::fs;

    #[test]
    fn reads_plugin_files_inside_the_vault_only() {
        let root = std::env::temp_dir().join(format!("davinci-plugins-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join(".davinci/plugins/example")).unwrap();
        fs::write(root.join(".davinci/plugins/example/manifest.json"), "{}").unwrap();

        assert_eq!(
            list_plugin_directories_in_vault(&root).unwrap(),
            ["example"]
        );
        assert_eq!(
            read_plugin_file_in_vault(&root, "example", "manifest.json").unwrap(),
            "{}"
        );
        write_plugin_file_in_vault(&root, "example", "data.json", "{\"ok\":true}").unwrap();
        assert!(read_plugin_file_in_vault(&root, "../outside", "data.json").is_err());
        let _ = fs::remove_dir_all(root);
    }
}
