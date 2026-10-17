use std::fs;
use std::path::Path;

pub const REQUIRED_STIGNORE_PATTERNS: &[&str] = &[
  "(?d).DS_Store",
  "(?d)Thumbs.db",
  "(?d).trash",
  "(?d)vault-index.db*",
  "(?d).davinci/workspace.json",
  "(?d).davinci/cache/",
];

/// Ensure that per-device state files are excluded in .stignore.
/// Creates the file if missing, or appends missing patterns without overwriting user lines.
/// Returns the full current contents of .stignore.
pub fn ensure_stignore(vault_path: &Path) -> Result<String, String> {
  let stignore_path = vault_path.join(".stignore");
  let existing_content = if stignore_path.exists() {
    fs::read_to_string(&stignore_path)
      .map_err(|e| format!("Failed to read .stignore at {:?}: {}", stignore_path, e))?
  } else {
    String::new()
  };

  let existing_lines: Vec<&str> = existing_content
    .lines()
    .map(|l| l.trim())
    .collect();

  let mut to_append = Vec::new();
  for pattern in REQUIRED_STIGNORE_PATTERNS {
    if !existing_lines.iter().any(|line| line == pattern) {
      to_append.push(*pattern);
    }
  }

  let final_content = if to_append.is_empty() {
    existing_content
  } else {
    let mut updated = existing_content;
    if !updated.is_empty() && !updated.ends_with('\n') {
      updated.push('\n');
    }
    if updated.is_empty() {
      updated.push_str("// DaVinci Notes per-device state exclusions\n");
    }
    for pat in to_append {
      updated.push_str(pat);
      updated.push('\n');
    }
    fs::write(&stignore_path, &updated)
      .map_err(|e| format!("Failed to write .stignore at {:?}: {}", stignore_path, e))?;
    updated
  };

  Ok(final_content)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_test_dir() -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!(
      "davinci_test_stignore_{}",
      std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos()
    ));
    let _ = fs::create_dir_all(&dir);
    dir
  }

  #[test]
  fn creates_stignore_with_header_when_missing() {
    let tmp = make_test_dir();
    let content = ensure_stignore(&tmp).expect("ensure_stignore");
    assert!(content.contains("// DaVinci Notes per-device state exclusions"));
    for pat in REQUIRED_STIGNORE_PATTERNS {
      assert!(content.contains(pat), "Missing pattern: {}", pat);
    }
    let _ = fs::remove_dir_all(&tmp);
  }

  #[test]
  fn appends_only_missing_patterns_preserving_user_lines() {
    let tmp = make_test_dir();
    let stignore_path = tmp.join(".stignore");
    fs::write(&stignore_path, "# Custom user ignore rule\n*.bak\n(?d).trash\n").expect("write");

    let content = ensure_stignore(&tmp).expect("ensure_stignore");
    assert!(content.contains("# Custom user ignore rule"));
    assert!(content.contains("*.bak"));
    assert!(content.contains("vault-index.db*"));

    // Ensure no duplication of (?d).trash
    let trash_matches: Vec<_> = content.lines().filter(|l| l.trim() == "(?d).trash").collect();
    assert_eq!(trash_matches.len(), 1);
    let _ = fs::remove_dir_all(&tmp);
  }
}
