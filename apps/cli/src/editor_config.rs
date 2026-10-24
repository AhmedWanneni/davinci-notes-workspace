use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EditorMode {
    External,
    Builtin,
}

#[derive(Debug, Clone, Default)]
pub struct EditorSettings {
    pub command: Option<String>,
    pub args: Vec<String>,
    pub mode: Option<EditorMode>,
}

fn get_config_path() -> Option<PathBuf> {
    dirs::config_dir().map(|c| c.join("davinci").join("config.toml"))
}

pub fn read_editor_settings() -> EditorSettings {
    let mut settings = EditorSettings::default();
    let Some(path) = get_config_path() else {
        return settings;
    };
    let Ok(content) = std::fs::read_to_string(path) else {
        return settings;
    };

    let mut in_editor_section = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('#') || trimmed.is_empty() {
            continue;
        }
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            in_editor_section = trimmed == "[editor]";
            continue;
        }

        let is_target = in_editor_section || trimmed.starts_with("editor.");
        if !is_target {
            continue;
        }

        let clean_line = if trimmed.starts_with("editor.") {
            trimmed.trim_start_matches("editor.")
        } else {
            trimmed
        };

        if let Some((k, v)) = clean_line.split_once('=') {
            let key = k.trim();
            let val = v.trim().trim_matches(|c| c == '"' || c == '\'');

            match key {
                "command" => settings.command = Some(val.to_string()),
                "args" => {
                    settings.args = crate::command_parser::parse_shell_words(val);
                }
                "mode" => match val.to_lowercase().as_str() {
                    "builtin" => settings.mode = Some(EditorMode::Builtin),
                    "external" => settings.mode = Some(EditorMode::External),
                    _ => {}
                },
                _ => {}
            }
        }
    }

    settings
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_editor_settings() {
        let settings = EditorSettings::default();
        assert!(settings.command.is_none());
        assert!(settings.args.is_empty());
        assert!(settings.mode.is_none());
    }
}
