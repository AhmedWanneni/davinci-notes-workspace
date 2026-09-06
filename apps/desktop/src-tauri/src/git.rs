use std::{
    fs, io,
    path::Path,
    process::{Command, Output},
};

use tauri::{AppHandle, Manager};

use crate::state::VaultState;

const VAULT_GITIGNORE: &str = "# Managed by DaVinci Notes local version history.\n# Only Markdown notes are source of truth for local history.\n*\n!**/\n!**/*.md\n";

fn run_git(vault_root: &Path, args: &[&str]) -> Result<Output, String> {
    Command::new("git")
    .args(args)
    .current_dir(vault_root)
    .output()
    .map_err(|error| match error.kind() {
      io::ErrorKind::NotFound => "Local version history requires the system Git executable. Install Git, then enable version history again.".to_string(),
      _ => format!("Could not start Git: {error}"),
    })
}

fn require_success(vault_root: &Path, args: &[&str]) -> Result<Output, String> {
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

/// Phase 0 command. Phase 2's single Version History toggle invokes this lazily.
#[tauri::command]
pub fn initialize_local_git_repository(app: AppHandle) -> Result<(), String> {
    let vault_root = app.state::<VaultState>().get_root()?;
    initialize_local_repository(&vault_root)
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    use super::{initialize_local_repository, require_success};

    struct TestVault(std::path::PathBuf);

    impl TestVault {
        fn new() -> Self {
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be after Unix epoch")
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("davinci-git-phase0-{}-{nanos}", std::process::id()));
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
    fn initializes_an_offline_repository_that_stages_only_markdown() {
        let vault = TestVault::new();
        fs::write(vault.0.join("note.md"), "# Offline note\n").expect("note should be written");
        fs::write(vault.0.join("vault-index.db"), "generated").expect("index should be written");
        fs::create_dir_all(vault.0.join(".davinci")).expect("cache folder should be written");
        fs::write(vault.0.join(".davinci/settings-cache.json"), "{}")
            .expect("cache should be written");

        initialize_local_repository(&vault.0).expect("Git should initialize the vault");

        assert!(vault.0.join(".git/HEAD").is_file());
        let remote = require_success(&vault.0, &["remote"]).expect("remote listing should work");
        assert!(String::from_utf8_lossy(&remote.stdout).trim().is_empty());

        require_success(&vault.0, &["add", "--all"]).expect("staging should work offline");
        let staged = require_success(&vault.0, &["diff", "--cached", "--name-only"])
            .expect("staged paths should be readable");
        assert_eq!(String::from_utf8_lossy(&staged.stdout), "note.md\n");
    }
}
