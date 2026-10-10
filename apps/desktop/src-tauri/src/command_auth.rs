use tauri::WebviewWindow;

use crate::plugin_webview::PLUGIN_WEBVIEW_LABEL;

pub fn reject_plugin_runner(window: &WebviewWindow) -> Result<(), String> {
  reject_plugin_runner_label(window.label())
}

fn reject_plugin_runner_label(label: &str) -> Result<(), String> {
  if label == PLUGIN_WEBVIEW_LABEL {
    return Err("plugin-runner is not authorized to invoke this native command".to_string());
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::reject_plugin_runner_label;

  #[test]
  fn rejects_only_the_plugin_runner_label() {
    assert!(reject_plugin_runner_label("plugin-runner").is_err());
    assert!(reject_plugin_runner_label("main").is_ok());
  }
}
