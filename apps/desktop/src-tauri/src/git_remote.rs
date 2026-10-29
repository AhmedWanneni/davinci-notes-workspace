use std::{
    fs,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

use serde::Serialize;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{command_auth::reject_plugin_runner, git::initialize_local_repository, state::VaultState};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRemoteValidation {
    pub remote_state: String,
}

fn malformed_url(url: &str) -> bool {
    !url.starts_with("https://") || url.split('/').nth(2).unwrap_or_default().is_empty()
}

pub(crate) fn classify(stderr: &str) -> String {
    let error = stderr.to_ascii_lowercase();
    if error.contains("authentication failed") || error.contains("invalid username or token") {
        "bad-token".to_string()
    } else if error.contains("repository not found") || error.contains("not found") {
        "repository-not-found".to_string()
    } else if error.contains("permission denied")
        || error.contains("not allowed")
        || error.contains("403")
    {
        "no-push-access".to_string()
    } else if error.contains("src refspec") || error.contains("does not match any") {
        "local-history-empty".to_string()
    } else {
        "remote-unreachable".to_string()
    }
}

pub(crate) fn askpass_script(token: &str) -> Result<std::path::PathBuf, String> {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let path = std::env::temp_dir().join(format!("davinci-git-askpass-{nonce}.sh"));
    fs::write(&path, "#!/bin/sh\ncase \"$1\" in *Username*) printf '%s' \"$DAVINCI_GIT_USERNAME\" ;; *) printf '%s' \"$DAVINCI_GIT_PAT\" ;; esac\n").map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).map_err(|e| e.to_string())?;
    }
    let _ = token;
    Ok(path)
}

pub(crate) fn git_with_pat(
    vault: &std::path::Path,
    args: &[&str],
    token: &str,
    username: &str,
) -> Result<std::process::Output, String> {
    let script = askpass_script(token)?;
    let output = Command::new("git")
        .args(args)
        .current_dir(vault)
        .env("GIT_ASKPASS", &script)
        .env("DAVINCI_GIT_PAT", token)
        .env("DAVINCI_GIT_USERNAME", username)
        .env("GIT_TERMINAL_PROMPT", "0")
        .output()
        .map_err(|e| e.to_string())?;
    let _ = fs::remove_file(script);
    Ok(output)
}

#[tauri::command]
pub async fn validate_git_remote(
    window: WebviewWindow,
    app: AppHandle,
    remote_url: String,
    token: String,
    username: Option<String>,
) -> Result<GitRemoteValidation, String> {
    reject_plugin_runner(&window)?;
    if malformed_url(&remote_url) {
        return Err("malformed-url".to_string());
    }
    let vault = app.state::<VaultState>().get_root()?;
    tauri::async_runtime::spawn_blocking(move || {
        initialize_local_repository(&vault)?;
        let username = username.as_deref().unwrap_or("git");
        let list = git_with_pat(
            &vault,
            &[
                "-c",
                "credential.helper=",
                "ls-remote",
                "--heads",
                &remote_url,
            ],
            &token,
            username,
        )?;
        if !list.status.success() {
            return Err(classify(&String::from_utf8_lossy(&list.stderr)));
        }
        let push = git_with_pat(
            &vault,
            &[
                "-c",
                "credential.helper=",
                "push",
                "--dry-run",
                &remote_url,
                "HEAD:refs/heads/main",
            ],
            &token,
            username,
        )?;
        if !push.status.success() {
            return Err(classify(&String::from_utf8_lossy(&push.stderr)));
        }
        Ok(GitRemoteValidation {
            remote_state: if list.stdout.is_empty() {
                "empty".to_string()
            } else {
                "nonempty".to_string()
            },
        })
    })
    .await
    .map_err(|e| e.to_string())?
}
