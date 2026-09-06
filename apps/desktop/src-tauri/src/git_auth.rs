use keyring::Entry;
use tauri::{AppHandle, Manager};

use crate::state::VaultState;

const SERVICE: &str = "com.davinci.notes.git-remote";

fn account(vault_root: &std::path::Path, remote_url: &str) -> String {
    blake3::hash(format!("{}\n{remote_url}", vault_root.display()).as_bytes())
        .to_hex()
        .to_string()
}

fn entry(vault_root: &std::path::Path, remote_url: &str) -> Result<Entry, String> {
    if !remote_url.starts_with("https://") {
        return Err("Git personal-access tokens require an HTTPS remote URL".to_string());
    }
    Entry::new(SERVICE, &account(vault_root, remote_url)).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_git_pat(app: AppHandle, remote_url: String, token: String) -> Result<(), String> {
    let vault_root = app.state::<VaultState>().get_root()?;
    entry(&vault_root, &remote_url)?
        .set_password(&token)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_git_pat(app: AppHandle, remote_url: String) -> Result<Option<String>, String> {
    let vault_root = app.state::<VaultState>().get_root()?;
    match entry(&vault_root, &remote_url)?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn clear_git_pat(app: AppHandle, remote_url: String) -> Result<(), String> {
    let vault_root = app.state::<VaultState>().get_root()?;
    match entry(&vault_root, &remote_url)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    #[cfg(not(windows))]
    use std::{
        fs,
        io::Write,
        os::unix::fs::PermissionsExt,
        process::{Command, Stdio},
        time::{SystemTime, UNIX_EPOCH},
    };

    use super::{account, entry};

    #[test]
    fn scopes_a_remote_credential_to_its_vault_and_https_url() {
        let vault = std::path::Path::new("/vault-a");
        assert_ne!(
            account(vault, "https://github.com/example/notes.git"),
            account(vault, "https://gitlab.com/example/notes.git")
        );
        assert_ne!(
            account(vault, "https://github.com/example/notes.git"),
            account(
                std::path::Path::new("/vault-b"),
                "https://github.com/example/notes.git"
            )
        );
        assert!(entry(vault, "git@github.com:example/notes.git").is_err());
    }

    #[cfg(not(windows))]
    #[test]
    fn system_git_accepts_a_pat_through_its_standard_https_askpass_path() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be after Unix epoch")
            .as_nanos();
        let script = std::env::temp_dir().join(format!("davinci-git-askpass-{unique}.sh"));
        fs::write(&script, "#!/bin/sh\nprintf '%s' \"$DAVINCI_GIT_PAT\"\n")
            .expect("askpass script should be written");
        fs::set_permissions(&script, fs::Permissions::from_mode(0o700))
            .expect("askpass script should be executable");

        let mut child = Command::new("git")
            .args(["-c", "credential.helper=", "credential", "fill"])
            .env("GIT_ASKPASS", &script)
            .env("GIT_TERMINAL_PROMPT", "0")
            .env("DAVINCI_GIT_PAT", "phase3-token")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("system Git should start");
        child
            .stdin
            .take()
            .expect("credential fill should accept input")
            .write_all(b"protocol=https\nhost=git.example.test\nusername=git\n\n")
            .expect("credential request should be written");
        let output = child
            .wait_with_output()
            .expect("credential fill should complete");
        let _ = fs::remove_file(&script);

        assert!(output.status.success());
        assert!(String::from_utf8_lossy(&output.stdout).contains("password=phase3-token"));
    }
}
