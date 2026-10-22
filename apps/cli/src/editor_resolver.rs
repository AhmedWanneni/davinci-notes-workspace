use std::path::PathBuf;

use crate::command_parser::parse_shell_words;
use crate::editor_config::read_editor_settings;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedEditor {
    pub binary: PathBuf,
    pub args: Vec<String>,
    pub source: String,
}

pub fn find_executable(name: &str) -> Option<PathBuf> {
    let p = PathBuf::from(name);
    if p.is_file() {
        return Some(p);
    }

    if let Some(path_var) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

pub fn resolve_editor_chain(
    explicit_editor: Option<&str>,
    explicit_args: Option<&str>,
) -> Result<ResolvedEditor, String> {
    let mut tried = Vec::new();

    // 1. Explicit CLI --editor flag
    if let Some(cmd) = explicit_editor {
        let parts = parse_shell_words(cmd);
        if let Some((bin, args)) = parts.split_first() {
            if let Some(resolved_path) = find_executable(bin) {
                let mut final_args = args.to_vec();
                if let Some(extra) = explicit_args {
                    final_args.extend(parse_shell_words(extra));
                }
                return Ok(ResolvedEditor {
                    binary: resolved_path,
                    args: final_args,
                    source: format!("--editor flag ({bin})"),
                });
            }
            return Err(format!("Editor specified via --editor '{bin}' was not found in PATH."));
        }
    }

    // 2. Config file setting
    let settings = read_editor_settings();
    if let Some(cmd) = &settings.command {
        let parts = parse_shell_words(cmd);
        if let Some((bin, args)) = parts.split_first() {
            if let Some(resolved_path) = find_executable(bin) {
                let mut final_args = args.to_vec();
                final_args.extend(settings.args.clone());
                if let Some(extra) = explicit_args {
                    final_args.extend(parse_shell_words(extra));
                }
                return Ok(ResolvedEditor {
                    binary: resolved_path,
                    args: final_args,
                    source: format!("config file ({bin})"),
                });
            }
            tried.push(format!("config file: '{bin}' (not found in PATH)"));
        }
    }

    // 3. $VISUAL environment variable
    if let Ok(vis) = std::env::var("VISUAL") {
        let trimmed = vis.trim();
        if !trimmed.is_empty() {
            let parts = parse_shell_words(trimmed);
            if let Some((bin, args)) = parts.split_first() {
                if let Some(resolved_path) = find_executable(bin) {
                    let mut final_args = args.to_vec();
                    if let Some(extra) = explicit_args {
                        final_args.extend(parse_shell_words(extra));
                    }
                    return Ok(ResolvedEditor {
                        binary: resolved_path,
                        args: final_args,
                        source: format!("$VISUAL ({bin})"),
                    });
                }
                tried.push(format!("$VISUAL: '{bin}' (not found in PATH)"));
            }
        }
    }

    // 4. $EDITOR environment variable
    if let Ok(ed) = std::env::var("EDITOR") {
        let trimmed = ed.trim();
        if !trimmed.is_empty() {
            let parts = parse_shell_words(trimmed);
            if let Some((bin, args)) = parts.split_first() {
                if let Some(resolved_path) = find_executable(bin) {
                    let mut final_args = args.to_vec();
                    if let Some(extra) = explicit_args {
                        final_args.extend(parse_shell_words(extra));
                    }
                    return Ok(ResolvedEditor {
                        binary: resolved_path,
                        args: final_args,
                        source: format!("$EDITOR ({bin})"),
                    });
                }
                tried.push(format!("$EDITOR: '{bin}' (not found in PATH)"));
            }
        }
    }

    // 5. Automatic fallbacks: if ~/.vimrc exists, prioritize vim to load user's real vim config;
    // otherwise if only nvim is configured, prioritize nvim.
    let candidates = if cfg!(windows) {
        vec!["notepad", "vi"]
    } else {
        let has_vimrc = dirs::home_dir().map(|h| h.join(".vimrc").is_file()).unwrap_or(false);
        if has_vimrc {
            vec!["vim", "nvim", "vi", "nano"]
        } else {
            vec!["nvim", "vim", "vi", "nano"]
        }
    };

    for candidate in &candidates {
        if let Some(path) = find_executable(candidate) {
            let mut final_args = Vec::new();
            if let Some(extra) = explicit_args {
                final_args.extend(parse_shell_words(extra));
            }
            return Ok(ResolvedEditor {
                binary: path,
                args: final_args,
                source: format!("fallback discovery ({candidate})"),
            });
        }
        tried.push(format!("fallback: '{candidate}' (not found)"));
    }

    Err(format!(
        "Failed to resolve an editor. Tried the following resolution chain:\n  - {}",
        tried.join("\n  - ")
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_executable_vim_or_vi() {
        assert!(find_executable("vi").is_some());
    }

    #[test]
    fn test_resolve_with_custom_editor_flag() {
        let res = resolve_editor_chain(Some("vi -e"), Some("-s"));
        assert!(res.is_ok());
        let ed = res.unwrap();
        assert!(ed.binary.ends_with("vi"));
        assert_eq!(ed.args, vec!["-e", "-s"]);
    }
}
