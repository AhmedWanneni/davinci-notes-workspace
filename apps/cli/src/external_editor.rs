use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::SystemTime;

use crate::editor_resolver::{find_executable, resolve_editor_chain, ResolvedEditor};
use crate::terminal_guard::TerminalGuard;

#[derive(Debug, PartialEq, Eq)]
pub struct EditorExitStatus {
    pub was_modified: bool,
    pub external_conflict: bool,
}

pub fn resolve_editor() -> String {
    resolve_editor_chain(None, None)
        .map(|r| r.binary.to_string_lossy().to_string())
        .unwrap_or_else(|_| "vi".to_string())
}

pub fn resolve_vim() -> String {
    for candidate in &["nvim", "vim", "vi", "nano"] {
        if find_executable(candidate).is_some() {
            return candidate.to_string();
        }
    }
    "vi".to_string()
}

fn get_file_mtime(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).ok().and_then(|m| m.modified().ok())
}

fn get_file_size(path: &Path) -> u64 {
    fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

pub fn launch_external_editor(file_path: &Path) -> Result<EditorExitStatus, String> {
    let resolved = resolve_editor_chain(None, None)?;
    launch_resolved_editor(&resolved, file_path, false)
}

pub fn launch_custom_editor(
    file_path: &Path,
    editor: Option<&str>,
    editor_args: Option<&str>,
) -> Result<EditorExitStatus, String> {
    let resolved = resolve_editor_chain(editor, editor_args)?;
    launch_resolved_editor(&resolved, file_path, false)
}

pub fn launch_editor_from_tui(
    file_path: &Path,
    editor: Option<&str>,
    editor_args: Option<&str>,
) -> Result<EditorExitStatus, String> {
    let resolved = resolve_editor_chain(editor, editor_args)?;
    launch_resolved_editor(&resolved, file_path, true)
}

fn launch_resolved_editor(
    resolved: &ResolvedEditor,
    file_path: &Path,
    is_tui_context: bool,
) -> Result<EditorExitStatus, String> {
    let initial_mtime = get_file_mtime(file_path);
    let initial_size = get_file_size(file_path);
    let initial_content = fs::read(file_path).ok();

    if is_tui_context {
        let _ = TerminalGuard::restore_terminal();
    }

    let mut command = Command::new(&resolved.binary);
    command.args(&resolved.args);
    if resolved.args.last().map(|s| s.as_str()) != Some("--") {
        command.arg("--");
    }
    command.arg(file_path);
    command.stdin(Stdio::inherit());
    command.stdout(Stdio::inherit());
    command.stderr(Stdio::inherit());

    let spawn_result = command.status();

    if is_tui_context {
        let _ = TerminalGuard::reenter_terminal();
    }

    let status = match spawn_result {
        Ok(s) => s,
        Err(e) => {
            return Err(format!(
                "Failed to execute editor '{}' ({}): {e}",
                resolved.binary.display(),
                resolved.source
            ));
        }
    };

    let final_mtime = get_file_mtime(file_path);
    let final_size = get_file_size(file_path);
    let final_content = fs::read(file_path).ok();

    let was_modified = initial_content != final_content;
    let external_conflict = if let (Some(t1), Some(t2)) = (initial_mtime, final_mtime) {
        (t1 != t2 || initial_size != final_size) && !status.success()
    } else {
        false
    };

    Ok(EditorExitStatus {
        was_modified,
        external_conflict,
    })
}

pub fn launch_vim_editor(file_path: &Path) -> Result<EditorExitStatus, String> {
    let resolved = resolve_editor_chain(Some("nvim"), None)
        .or_else(|_| resolve_editor_chain(Some("vim"), None))
        .or_else(|_| resolve_editor_chain(Some("vi"), None))?;
    launch_resolved_editor(&resolved, file_path, false)
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
        assert!(vim.contains("vim") || vim.contains("vi"));
    }

    #[test]
    fn test_mtime_and_size_inspection() {
        let temp = std::env::temp_dir().join(format!("dn_mtime_{}", std::process::id()));
        let _ = fs::write(&temp, "data");

        assert!(get_file_mtime(&temp).is_some());
        assert_eq!(get_file_size(&temp), 4);

        let _ = fs::remove_file(&temp);
    }
}
