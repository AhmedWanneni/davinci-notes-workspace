use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SearchMatch {
    pub path: PathBuf,
    pub rel_path: String,
    pub line_number: usize,
    pub line_text: String,
}

pub fn search_vault(vault_root: &Path, query: &str) -> Vec<SearchMatch> {
    let clean_query = query.trim().to_lowercase();
    if clean_query.is_empty() {
        return Vec::new();
    }

    let mut matches = Vec::new();

    for entry in WalkDir::new(vault_root)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "target" && name != "node_modules"
        })
        .flatten()
    {
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            let rel_path = path
                .strip_prefix(vault_root)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if let Ok(file) = File::open(path) {
                let reader = BufReader::new(file);
                for (idx, line_res) in reader.lines().enumerate() {
                    if let Ok(line) = line_res {
                        if line.to_lowercase().contains(&clean_query) {
                            matches.push(SearchMatch {
                                path: path.to_path_buf(),
                                rel_path: rel_path.clone(),
                                line_number: idx + 1,
                                line_text: line.trim().to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    matches
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_search_vault_finds_matches() {
        let vault = std::env::temp_dir().join(format!("dn_srch_test_{}", std::process::id()));
        let sub = vault.join("Sub");
        let _ = fs::create_dir_all(&sub);

        let _ = fs::write(vault.join("File1.md"), "alpha beta gamma\nsecond line");
        let _ = fs::write(sub.join("File2.md"), "first line\ngamma delta epsilon");

        let results = search_vault(&vault, "gamma");
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].line_number, 1);
        assert_eq!(results[1].line_number, 2);

        let _ = fs::remove_dir_all(&vault);
    }
}
