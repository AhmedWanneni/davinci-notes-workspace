use tauri::WebviewWindow;

use crate::plugin_webview::PLUGIN_WEBVIEW_LABEL;

pub const CAPTURE_WINDOW_LABEL: &str = "capture";

pub fn reject_plugin_runner(window: &WebviewWindow) -> Result<(), String> {
  reject_non_main_label(window.label())
}

fn reject_non_main_label(label: &str) -> Result<(), String> {
  if label == PLUGIN_WEBVIEW_LABEL {
    return Err("plugin-runner is not authorized to invoke this native command".to_string());
  }
  if label == CAPTURE_WINDOW_LABEL {
    return Err("capture window is not authorized to invoke this native command".to_string());
  }
  Ok(())
}

pub fn authorize_capture_window(window: &WebviewWindow) -> Result<(), String> {
  authorize_capture_window_label(window.label())
}

fn authorize_capture_window_label(label: &str) -> Result<(), String> {
  if label == PLUGIN_WEBVIEW_LABEL {
    return Err("plugin-runner is not authorized to invoke this capture command".to_string());
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::{authorize_capture_window_label, reject_non_main_label, CAPTURE_WINDOW_LABEL};

  #[test]
  fn rejects_plugin_runner_and_capture_from_main_commands() {
    assert!(reject_non_main_label("plugin-runner").is_err());
    assert!(reject_non_main_label(CAPTURE_WINDOW_LABEL).is_err());
    assert!(reject_non_main_label("main").is_ok());
  }

  #[test]
  fn authorizes_capture_and_main_for_capture_commands() {
    assert!(authorize_capture_window_label(CAPTURE_WINDOW_LABEL).is_ok());
    assert!(authorize_capture_window_label("main").is_ok());
    assert!(authorize_capture_window_label("plugin-runner").is_err());
  }
}


