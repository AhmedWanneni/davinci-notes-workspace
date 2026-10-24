//! Tauri commands for the Web Clipper settings section (plan §5, Phase 3).
//!
//! Every command is reachable only from the main window: the plugin-runner and
//! capture webviews must not be able to read the pairing token or open a
//! listener (ADR-0017 pattern, mirrors `oauth.rs`).

use tauri::{AppHandle, State, WebviewWindow};

use crate::clipper_payload::ClipAck;
use crate::clipper_server::{start_listener, stop_listener, ClipperState, ClipperStatus};
use crate::command_auth::reject_plugin_runner;

/// Enable the Web Clipper: pair if needed, then bind the loopback listener.
#[tauri::command]
pub fn clipper_enable(
  window: WebviewWindow,
  app: AppHandle,
  state: State<'_, ClipperState>,
) -> Result<ClipperStatus, String> {
  reject_plugin_runner(&window)?;
  state.arm_token()?;
  start_listener(app, state.inner())?;
  state.status()
}

/// Disable the Web Clipper: unbind and stop the listener thread.
#[tauri::command]
pub fn clipper_disable(window: WebviewWindow, state: State<'_, ClipperState>) -> Result<ClipperStatus, String> {
  reject_plugin_runner(&window)?;
  stop_listener(state.inner());
  state.status()
}

/// Current state for the settings panel (enabled, port, whether a token exists).
#[tauri::command]
pub fn clipper_status(window: WebviewWindow, state: State<'_, ClipperState>) -> Result<ClipperStatus, String> {
  reject_plugin_runner(&window)?;
  state.status()
}

/// Reveal the pairing token, creating one on first call.
#[tauri::command]
pub fn clipper_reveal_token(window: WebviewWindow, state: State<'_, ClipperState>) -> Result<String, String> {
  reject_plugin_runner(&window)?;
  state.arm_token()
}

/// Replace the pairing token; the old value stops working immediately.
#[tauri::command]
pub fn clipper_rotate_token(window: WebviewWindow, state: State<'_, ClipperState>) -> Result<String, String> {
  reject_plugin_runner(&window)?;
  state.rotate_token()
}

/// Forget the pairing token and stop the listener.
#[tauri::command]
pub fn clipper_revoke_token(window: WebviewWindow, state: State<'_, ClipperState>) -> Result<ClipperStatus, String> {
  reject_plugin_runner(&window)?;
  stop_listener(state.inner());
  state.revoke_token()?;
  state.status()
}

/// The main webview reports the outcome of a dispatched clip (ADR-0177/0178).
#[tauri::command]
pub fn clipper_submit_result(
  window: WebviewWindow,
  state: State<'_, ClipperState>,
  ack: ClipAck,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  state.submit_result(&ack)
}
