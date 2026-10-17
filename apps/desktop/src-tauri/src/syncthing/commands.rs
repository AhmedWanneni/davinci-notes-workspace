use tauri::{command, WebviewWindow};

use crate::command_auth::reject_plugin_runner;

use super::client::SyncthingClient;
use super::config::resolve_local_syncthing_config;
use super::types::{SyncthingDetectResult, SyncthingError, SyncthingStatusResult};

#[command]
pub async fn syncthing_detect(window: WebviewWindow) -> Result<SyncthingDetectResult, SyncthingError> {
  reject_plugin_runner(&window).map_err(|e| SyncthingError::UnexpectedResponse(e))?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.detect().await
}

#[command]
pub async fn syncthing_status(window: WebviewWindow) -> Result<SyncthingStatusResult, SyncthingError> {
  reject_plugin_runner(&window).map_err(|e| SyncthingError::UnexpectedResponse(e))?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.status().await
}

#[command]
pub async fn syncthing_qr_png(window: WebviewWindow) -> Result<String, SyncthingError> {
  reject_plugin_runner(&window).map_err(|e| SyncthingError::UnexpectedResponse(e))?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.qr_png().await
}
