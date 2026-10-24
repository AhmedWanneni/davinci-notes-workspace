use serde::Deserialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Deserialize)]
pub struct RecentVaultEntry {
    pub path: String,
    #[serde(default)]
    pub name: String,
    #[serde(rename = "lastOpenedAt", default)]
    pub last_opened_at: i64,
}

#[derive(Debug, Deserialize, Default)]
pub struct CliConfigFile {
    pub default_vault: Option<String>,
}

pub fn find_vault_from_cwd(start_dir: &Path) -> Option<PathBuf> {
    let mut current = start_dir.to_path_buf();
    loop {
        if current.join(".obsidian").is_dir()
            || current.join(".davinci").is_dir()
            || current.join("vault-index.db").is_file()
        {
            return Some(current);
        }
        if !current.pop() {
            break;
        }
    }
    None
}

pub fn get_desktop_config_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|c| c.join("com.davinci.notes"))
}

pub fn read_recent_vaults(config_dir: &Path) -> Vec<RecentVaultEntry> {
    let json_file = config_dir.join("davinci-recent-vaults.json");
    if !json_file.is_file() {
        return Vec::new();
    }
    let Ok(content) = std::fs::read_to_string(&json_file) else {
        return Vec::new();
    };
    serde_json::from_str::<Vec<RecentVaultEntry>>(&content).unwrap_or_default()
}

pub fn find_vault_from_desktop() -> Option<PathBuf> {
    let config_dir = get_desktop_config_dir()?;
    let entries = read_recent_vaults(&config_dir);
    for entry in entries {
        let p = PathBuf::from(&entry.path);
        if p.is_dir() {
            return Some(p);
        }
    }
    None
}

pub fn find_vault_from_cli_config() -> Option<PathBuf> {
    let config_dir = dirs::config_dir()?.join("davinci");
    let config_file = config_dir.join("config.toml");
    if !config_file.is_file() {
        return None;
    }
    let content = std::fs::read_to_string(&config_file).ok()?;
    // Simple line parsing to avoid heavy toml dependency in phase 1
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("default_vault") {
            let val = rest.trim_start_matches(|c: char| c == '=' || c.is_whitespace());
            let clean = val.trim_matches(|c: char| c == '"' || c == '\'');
            let p = PathBuf::from(clean);
            if p.is_dir() {
                return Some(p);
            }
        }
    }
    None
}

pub fn resolve_vault(explicit_flag: Option<&str>) -> Result<PathBuf, String> {
    // Tier 1: Explicit CLI flag
    if let Some(flag) = explicit_flag {
        let p = PathBuf::from(flag);
        if p.is_dir() {
            return Ok(p);
        } else {
            return Err(format!("Specified vault path does not exist: {flag}"));
        }
    }

    // Tier 2: Environment variables
    if let Ok(val) = std::env::var("DN_VAULT").or_else(|_| std::env::var("DAVINCI_VAULT")) {
        let p = PathBuf::from(&val);
        if p.is_dir() {
            return Ok(p);
        }
    }

    // Tier 3: Upwards traversal from cwd
    if let Ok(cwd) = std::env::current_dir() {
        if let Some(vault) = find_vault_from_cwd(&cwd) {
            return Ok(vault);
        }
    }

    // Tier 4: CLI config file
    if let Some(vault) = find_vault_from_cli_config() {
        return Ok(vault);
    }

    // Tier 5: Desktop app recent vaults
    if let Some(vault) = find_vault_from_desktop() {
        return Ok(vault);
    }

    Err(
        "No DaVinci vault found.\n\
         Provide a vault using one of the following methods:\n  \
         1. Flag: dn --vault /path/to/vault <command>\n  \
         2. Environment variable: export DN_VAULT=/path/to/vault\n  \
         3. Run dn from inside a vault directory\n  \
         4. Open a vault in the DaVinci Notes desktop app"
            .to_string(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cwd_traversal() {
        let temp = std::env::temp_dir().join(format!("dn_cfg_test_{}", std::process::id()));
        let sub = temp.join("folder1").join("folder2");
        std::fs::create_dir_all(&sub).unwrap();
        std::fs::create_dir_all(temp.join(".obsidian")).unwrap();

        let found = find_vault_from_cwd(&sub);
        assert_eq!(found, Some(temp.clone()));

        let _ = std::fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_explicit_flag_missing() {
        let res = resolve_vault(Some("/nonexistent/directory/xyz123"));
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("does not exist"));
    }
}
