use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use std::fs;
use std::path::{Path, PathBuf};

use crate::fs_atomic::atomic_write_new;

pub fn sanitize_rel_path(raw: &str) -> Result<PathBuf, String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("Note name cannot be empty".to_string());
    }

    let mut path = PathBuf::from(trimmed);
    if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
        path = PathBuf::from(format!("{}.md", path.display()));
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

pub fn create_new_note(vault_root: &Path, rel_name: &str) -> Result<PathBuf, String> {
    let rel_path = sanitize_rel_path(rel_name)?;
    let target = vault_root.join(&rel_path);

    if target.exists() {
        return Err(format!("Note already exists: {}", rel_path.display()));
    }

    let stem = target
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");
    let content = format!("# {stem}\n\n");

    atomic_write_new(&target, &content)
        .map_err(|e| format!("Failed to create note: {e}"))?;

    Ok(target)
}

pub fn rename_note(
    vault_root: &Path,
    old_path: &Path,
    new_name: &str,
) -> Result<PathBuf, String> {
    let new_rel = sanitize_rel_path(new_name)?;
    let new_target = vault_root.join(&new_rel);

    if new_target.exists() {
        return Err(format!("Destination already exists: {}", new_rel.display()));
    }

    if let Some(parent) = new_target.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::rename(old_path, &new_target).map_err(|e| format!("Failed to rename note: {e}"))?;
    Ok(new_target)
}

pub fn delete_note(vault_root: &Path, target: &Path) -> Result<(), String> {
    if !target.exists() {
        return Err("Target file does not exist".to_string());
    }

    // Move to .trash per DaVinci / Obsidian conventions
    let trash_dir = vault_root.join(".trash");
    let _ = fs::create_dir_all(&trash_dir);

    let file_name = target
        .file_name()
        .ok_or_else(|| "Invalid file name".to_string())?;
    let trash_target = trash_dir.join(file_name);

    fs::rename(target, trash_target).map_err(|e| format!("Failed to delete note: {e}"))?;
    Ok(())
}

pub fn find_best_match(vault_root: &Path, query: &str) -> Option<PathBuf> {
    let matcher = SkimMatcherV2::default();
    let mut best_score = i64::MIN;
    let mut best_match = None;

    fn walk_dir(
        dir: &Path,
        vault_root: &Path,
        query: &str,
        matcher: &SkimMatcherV2,
        best_score: &mut i64,
        best_match: &mut Option<PathBuf>,
    ) {
        let Ok(entries) = fs::read_dir(dir) else {
            return;
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap_or_default().to_string_lossy();
            if name.starts_with('.') {
                continue;
            }

            if path.is_dir() {
                walk_dir(&path, vault_root, query, matcher, best_score, best_match);
            } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                let rel = path
                    .strip_prefix(vault_root)
                    .map(|p| p.to_string_lossy())
                    .unwrap_or_default();

                if let Some(score) = matcher.fuzzy_match(&rel, query) {
                    if score > *best_score {
                        *best_score = score;
                        *best_match = Some(path);
                    }
                }
            }
        }
    }

    walk_dir(
        vault_root,
        vault_root,
        query,
        &matcher,
        &mut best_score,
        &mut best_match,
    );
    best_match
}

pub fn list_notes(vault_root: &Path, folder: Option<&str>) -> Vec<(String, u64)> {
    let start_dir = match folder {
        Some(f) => vault_root.join(f),
        None => vault_root.to_path_buf(),
    };

    let mut results = Vec::new();
    let Ok(entries) = fs::read_dir(&start_dir) else {
        return results;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }

        let is_dir = path.is_dir();
        let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
        let display_name = if is_dir { format!("{name}/") } else { name };
        results.push((display_name, size));
    }

    results.sort_by_key(|a| a.0.to_lowercase());
    results
}
