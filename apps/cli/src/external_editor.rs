use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::SystemTime;

use crate::terminal_guard::TerminalGuard;

#[derive(Debug, PartialEq, Eq)]
pub struct EditorExitStatus {
    pub was_modified: bool,
    pub external_conflict: bool,
}

pub fn resolve_editor() -> String {
    if let Ok(v) = std::env::var("VISUAL") {
        let trimmed = v.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    if let Ok(e) = std::env::var("EDITOR") {
        let trimmed = e.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    if cfg!(windows) {
        "notepad".to_string()
    } else {
        resolve_vim()
    }
}

pub fn resolve_vim() -> String {
    for candidate in &["vim", "nvim", "vi"] {
        if Command::new("which").arg(candidate).output().map(|o| o.status.success()).unwrap_or(false) {
            return candidate.to_string();
        }
    }
    if Command::new("which").arg("nano").output().map(|o| o.status.success()).unwrap_or(false) {
        "nano".to_string()
    } else {
        "vi".to_string()
    }
}

fn get_file_mtime(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).ok().and_then(|m| m.modified().ok())
}

pub fn launch_vim_editor(file_path: &Path) -> std::io::Result<EditorExitStatus> {
    launch_editor_binary(&resolve_vim(), file_path)
}

pub fn launch_external_editor(file_path: &Path) -> std::io::Result<EditorExitStatus> {
    launch_editor_binary(&resolve_editor(), file_path)
}

fn launch_editor_binary(editor: &str, file_path: &Path) -> std::io::Result<EditorExitStatus> {
    // 1. Snapshot initial state before launching editor
    let initial_mtime = get_file_mtime(file_path);
    let initial_content = fs::read(file_path).ok();

    // 2. Suspend TUI cleanly
    TerminalGuard::restore_terminal()?;

    // 3. Launch editor subprocess
    let parts: Vec<&str> = editor.split_whitespace().collect();
    let (cmd, args) = if parts.is_empty() {
        ("vi", &[][..])
    } else {
        (parts[0], &parts[1..])
    };

    let mut command = Command::new(cmd);
    command.args(args);
    command.arg(file_path);

    let status = command.status()?;

    // 4. Inspect modifications
    let final_mtime = get_file_mtime(file_path);
    let final_content = fs::read(file_path).ok();

    let was_modified = initial_content != final_content;
    let external_conflict = if let (Some(t1), Some(t2)) = (initial_mtime, final_mtime) {
        t1 != t2 && !status.success()
    } else {
        false
    };

    Ok(EditorExitStatus {
        was_modified,
        external_conflict,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_editor_fallback() {
        let editor = resolve_editor();
        assert!(!editor.is_empty());
    }

    #[test]
    fn test_resolve_vim() {
        let vim = resolve_vim();
        assert!(!vim.is_empty());
    }

    #[test]
    fn test_mtime_inspection() {
        let temp = std::env::temp_dir().join(format!("dn_mtime_{}", std::process::id()));
        let _ = fs::write(&temp, "data");

        let mtime = get_file_mtime(&temp);
        assert!(mtime.is_some());

        let _ = fs::remove_file(&temp);
    }
}
