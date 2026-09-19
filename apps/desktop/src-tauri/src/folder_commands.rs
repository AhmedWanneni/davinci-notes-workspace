use std::fs;
use std::path::{Component, Path, PathBuf};

use crate::fs::resolve_in_vault;

fn is_hidden_or_system_path(path: &str) -> bool {
    Path::new(path).components().any(|component| {
    matches!(component, Component::Normal(name) if name.to_string_lossy().starts_with('.'))
  })
}

fn reject_symlink_components(vault_root: &Path, relative: &str) -> Result<(), String> {
    let mut candidate = vault_root.to_path_buf();
    for component in Path::new(relative).components() {
        let Component::Normal(segment) = component else {
            continue;
        };
        candidate.push(segment);
        if candidate.exists()
            && fs::symlink_metadata(&candidate)
                .map_err(|e| format!("Path metadata failed: {e}"))?
                .file_type()
                .is_symlink()
        {
            return Err(format!("Symlink paths are not allowed: {relative}"));
        }
    }
    Ok(())
}

fn resolve_folder_path(vault_root: &Path, relative: &str) -> Result<PathBuf, String> {
    if relative.is_empty() || relative == "." || relative == "/" {
        return Err("Cannot modify vault root".to_string());
    }
    if is_hidden_or_system_path(relative) {
        return Err(format!(
            "Hidden or system folder is not allowed: {relative}"
        ));
    }
    reject_symlink_components(vault_root, relative)?;

    let absolute = resolve_in_vault(vault_root, relative)?;
    if absolute == vault_root {
        return Err("Cannot modify vault root".to_string());
    }
    Ok(absolute)
}

pub(crate) fn rename_folder_in_vault(
    vault_root: &Path,
    from_path: &str,
    to_path: &str,
) -> Result<(), String> {
    let from_absolute = resolve_folder_path(vault_root, from_path)?;
    let to_absolute = resolve_folder_path(vault_root, to_path)?;

    if from_path == to_path {
        return Ok(());
    }
    if !from_absolute.is_dir() {
        return Err(format!("Source folder not found: {from_path}"));
    }
    if to_absolute.exists() {
        return Err(format!("Destination already exists: {to_path}"));
    }
    if let Some(parent) = to_absolute.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create parent dirs failed: {e}"))?;
    }
    fs::rename(&from_absolute, &to_absolute).map_err(|e| format!("Rename folder failed: {e}"))
}

pub(crate) fn delete_folder_in_vault(vault_root: &Path, path: &str) -> Result<(), String> {
    let absolute = resolve_folder_path(vault_root, path)?;
    if !absolute.is_dir() {
        return Err(format!("Source folder not found: {path}"));
    }
    fs::remove_dir_all(&absolute).map_err(|e| format!("Delete folder failed: {e}"))
}

#[cfg(test)]
mod tests {
    use super::{delete_folder_in_vault, rename_folder_in_vault};
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TestVault(std::path::PathBuf);

    impl TestVault {
        fn new() -> Self {
            let suffix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be valid")
                .as_nanos();
            let root = std::env::temp_dir().join(format!("davinci-folder-{suffix}"));
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
    fn renames_a_nested_folder_on_disk() {
        let vault = TestVault::new();
        fs::create_dir_all(vault.0.join("projects/sub")).expect("nested folder should be created");
        fs::write(vault.0.join("projects/sub/note.md"), "# Note")
            .expect("nested note should be created");

        rename_folder_in_vault(&vault.0, "projects", "résumés 2026")
            .expect("folder rename should succeed");

        assert!(!vault.0.join("projects").exists());
        assert_eq!(
            fs::read_to_string(vault.0.join("résumés 2026/sub/note.md"))
                .expect("renamed descendant should remain"),
            "# Note",
        );
    }

    #[test]
    fn deletes_a_nested_folder_on_disk_and_rejects_unsafe_paths() {
        let vault = TestVault::new();
        fs::create_dir_all(vault.0.join("projects/sub")).expect("nested folder should be created");
        fs::write(vault.0.join("projects/sub/note.md"), "# Note")
            .expect("nested note should be created");

        delete_folder_in_vault(&vault.0, "projects").expect("folder delete should succeed");
        assert!(!vault.0.join("projects").exists());

        for path in ["", ".", ".git", "../outside", "missing"] {
            assert!(delete_folder_in_vault(&vault.0, path).is_err(), "{path}");
        }
    }
}
