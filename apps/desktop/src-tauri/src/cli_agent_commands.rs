use tauri::WebviewWindow;

use crate::cli_agent_detector::detect_all_agents;
use crate::cli_agent_runner::{cancel_session, start_session};
use crate::cli_agent_types::CliAgentInfo;
use crate::command_auth::reject_plugin_runner;

#[tauri::command]
pub fn cli_agent_detect(window: WebviewWindow) -> Result<Vec<CliAgentInfo>, String> {
  reject_plugin_runner(&window)?;
  Ok(detect_all_agents())
}

#[tauri::command]
pub fn cli_agent_start(
  window: WebviewWindow,
  session_id: String,
  agent_id: String,
  prompt: String,
  vault_path: String,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  start_session(window, session_id, agent_id, prompt, vault_path)
}

#[tauri::command]
pub fn cli_agent_cancel(window: WebviewWindow, session_id: String) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  cancel_session(&session_id)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cli_agent_types_serialization() {
    let agents = detect_all_agents();
    assert!(!agents.is_empty());
    let serialized = serde_json::to_string(&agents);
    assert!(serialized.is_ok());
  }
}
