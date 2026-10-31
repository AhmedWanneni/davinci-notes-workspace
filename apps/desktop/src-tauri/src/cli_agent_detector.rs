use std::{
  env,
  path::{Path, PathBuf},
  process::Command,
};

use crate::cli_agent_types::{CliAgentId, CliAgentInfo};

const CANDIDATE_AGENTS: &[CliAgentId] = &[
  CliAgentId::Agy,
  CliAgentId::Claude,
  CliAgentId::Codex,
  CliAgentId::OpenCode,
];

pub fn detect_all_agents() -> Vec<CliAgentInfo> {
  CANDIDATE_AGENTS
    .iter()
    .map(|id| detect_single_agent(id))
    .collect()
}

pub fn detect_single_agent(id: &CliAgentId) -> CliAgentInfo {
  let binary_name = id.default_binary();
  let resolved_path = resolve_binary_path(binary_name);

  let (installed, version) = match &resolved_path {
    Some(path) => {
      let ver = query_version(path);
      (true, ver)
    }
    None => (false, None),
  };

  CliAgentInfo {
    id: id.as_str().to_string(),
    name: id.display_name().to_string(),
    binary: binary_name.to_string(),
    installed,
    version,
    path: resolved_path.map(|p| p.to_string_lossy().to_string()),
  }
}

pub fn resolve_binary_path(binary: &str) -> Option<PathBuf> {
  // 1. Direct which / where lookup
  let probe_cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
  if let Ok(output) = Command::new(probe_cmd).arg(binary).output() {
    if output.status.success() {
      if let Ok(s) = String::from_utf8(output.stdout) {
        if let Some(first_line) = s.lines().next() {
          let trimmed = first_line.trim();
          if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            if path.is_file() {
              return Some(path);
            }
          }
        }
      }
    }
  }

  // 2. Fallback search across standard directories (crucial for GUI apps launched outside terminal)
  let mut search_dirs: Vec<PathBuf> = vec![
    PathBuf::from("/opt/homebrew/bin"),
    PathBuf::from("/usr/local/bin"),
    PathBuf::from("/usr/bin"),
    PathBuf::from("/bin"),
  ];

  if let Ok(home) = env::var("HOME") {
    let home_path = Path::new(&home);
    search_dirs.push(home_path.join(".local/bin"));
    search_dirs.push(home_path.join(".cargo/bin"));
    search_dirs.push(home_path.join(".npm-global/bin"));
    search_dirs.push(home_path.join("bin"));
  }

  for dir in search_dirs {
    let candidate = dir.join(binary);
    if candidate.is_file() {
      return Some(candidate);
    }
  }

  None
}

fn query_version(path: &Path) -> Option<String> {
  let output = Command::new(path).arg("--version").output().ok()?;
  if !output.status.success() {
    return None;
  }
  let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if !stdout.is_empty() {
    // Keep first line, up to 60 chars
    let first_line = stdout.lines().next().unwrap_or(&stdout);
    return Some(first_line.chars().take(60).collect());
  }
  None
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_detect_candidate_agents_list() {
    let agents = detect_all_agents();
    assert_eq!(agents.len(), 4);
    assert_eq!(agents[0].id, "agy");
    assert_eq!(agents[1].id, "claude");
    assert_eq!(agents[2].id, "codex");
    assert_eq!(agents[3].id, "opencode");
  }

  #[test]
  fn test_resolve_known_binary() {
    // "sh" should always exist on unix systems
    if cfg!(unix) {
      assert!(resolve_binary_path("sh").is_some());
    }
  }
}
