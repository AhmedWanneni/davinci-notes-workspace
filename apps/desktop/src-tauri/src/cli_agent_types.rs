use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CliAgentId {
  Agy,
  Claude,
  Codex,
  OpenCode,
}

impl CliAgentId {
  pub fn from_str(s: &str) -> Option<Self> {
    match s.to_lowercase().as_str() {
      "agy" => Some(Self::Agy),
      "claude" => Some(Self::Claude),
      "codex" => Some(Self::Codex),
      "opencode" => Some(Self::OpenCode),
      _ => None,
    }
  }

  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Agy => "agy",
      Self::Claude => "claude",
      Self::Codex => "codex",
      Self::OpenCode => "opencode",
    }
  }

  pub fn default_binary(&self) -> &'static str {
    match self {
      Self::Agy => "agy",
      Self::Claude => "claude",
      Self::Codex => "codex",
      Self::OpenCode => "opencode",
    }
  }

  pub fn display_name(&self) -> &'static str {
    match self {
      Self::Agy => "Antigravity CLI (agy)",
      Self::Claude => "Claude Code",
      Self::Codex => "Codex CLI",
      Self::OpenCode => "OpenCode",
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliAgentInfo {
  pub id: String,
  pub name: String,
  pub binary: String,
  pub installed: bool,
  pub version: Option<String>,
  pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliAgentStreamEvent {
  pub session_id: String,
  pub kind: String,
  pub content: String,
}
