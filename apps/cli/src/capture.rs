use chrono::Local;
use std::path::{Path, PathBuf};

use crate::fs_atomic::{atomic_append_or_create, atomic_write_new};

pub enum CaptureTarget {
    QuickNotes,
    Daily,
    CustomNote(String),
}

fn sanitize_custom_note_name(raw: &str) -> Result<PathBuf, String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("Note name cannot be empty".to_string());
    }

    let mut path = PathBuf::from(trimmed);
    if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
        let with_ext = format!("{}.md", path.display());
        path = PathBuf::from(with_ext);
    }

    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                return Err("Note path cannot contain '..' traversal".to_string());
            }
            std::path::Component::RootDir | std::path::Component::Prefix(_) => {
                return Err("Note path must be relative to the vault root".to_string());
            }
            _ => {}
        }
    }

    Ok(path)
}

pub fn find_unique_quick_note_path(quick_notes_dir: &Path) -> PathBuf {
    let now = Local::now();
    let base_name = now.format("Quick note %Y-%m-%d %H-%M-%S").to_string();
    let default_path = quick_notes_dir.join(format!("{base_name}.md"));

    if !default_path.exists() {
        return default_path;
    }

    let mut counter = 1;
    loop {
        let candidate = quick_notes_dir.join(format!("{base_name} {counter}.md"));
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}

pub fn capture_note(
    vault_root: &Path,
    target: CaptureTarget,
    text: &str,
) -> Result<PathBuf, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("Cannot capture empty content".to_string());
    }

    let now = Local::now();

    match target {
        CaptureTarget::QuickNotes => {
            let quick_notes_dir = vault_root.join("Quick Notes");
            let target_path = find_unique_quick_note_path(&quick_notes_dir);

            let content = format!("{trimmed}\n");
            atomic_write_new(&target_path, &content)
                .map_err(|e| format!("Failed to write quick note: {e}"))?;

            Ok(target_path)
        }
        CaptureTarget::Daily => {
            let daily_filename = format!("{}.md", now.format("%Y-%m-%d"));
            let target_path = vault_root.join(daily_filename);

            let time_prefix = now.format("%Y-%m-%d %H:%M:%S");
            let entry = format!("- [{time_prefix}] {trimmed}");
            let header = format!("# {}\n", now.format("%Y-%m-%d"));

            atomic_append_or_create(&target_path, &entry, Some(&header))
                .map_err(|e| format!("Failed to update daily note: {e}"))?;

            Ok(target_path)
        }
        CaptureTarget::CustomNote(name) => {
            let rel_path = sanitize_custom_note_name(&name)?;
            let target_path = vault_root.join(&rel_path);

            let stem = target_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Note");
            let header = format!("# {stem}\n");
            let time_prefix = now.format("%Y-%m-%d %H:%M:%S");
            let entry = format!("- [{time_prefix}] {trimmed}");

            atomic_append_or_create(&target_path, &entry, Some(&header))
                .map_err(|e| format!("Failed to write custom note: {e}"))?;

            Ok(target_path)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_capture_quick_note() {
        let vault = std::env::temp_dir().join(format!("dn_cap_test_{}", std::process::id()));
        std::fs::create_dir_all(&vault).unwrap();

        let path = capture_note(&vault, CaptureTarget::QuickNotes, "my capture idea").unwrap();
        assert!(path.exists());
        assert!(path.to_str().unwrap().contains("Quick Notes"));
        let content = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, "my capture idea\n");

        let _ = std::fs::remove_dir_all(&vault);
    }

    #[test]
    fn test_capture_daily_note() {
        let vault = std::env::temp_dir().join(format!("dn_daily_test_{}", std::process::id()));
        std::fs::create_dir_all(&vault).unwrap();

        let path = capture_note(&vault, CaptureTarget::Daily, "daily task item").unwrap();
        assert!(path.exists());
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("# "));
        assert!(content.contains("daily task item"));

        let _ = std::fs::remove_dir_all(&vault);
    }

    #[test]
    fn test_traversal_rejection() {
        let vault = std::env::temp_dir().join("safe_vault");
        let res = capture_note(
            &vault,
            CaptureTarget::CustomNote("../escape.md".to_string()),
            "bad content",
        );
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("traversal"));
    }
}
