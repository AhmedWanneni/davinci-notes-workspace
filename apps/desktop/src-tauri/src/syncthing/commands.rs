use std::path::PathBuf;
use tauri::{command, AppHandle, Manager, WebviewWindow};

use crate::command_auth::reject_plugin_runner;
use crate::state::VaultState;

use super::client::SyncthingClient;
use super::config::resolve_local_syncthing_config;
use super::types::{
  SyncthingDetectResult, SyncthingError, SyncthingPendingDevice, SyncthingPendingFolder,
  SyncthingStatusResult,
};

#[command]
pub async fn syncthing_detect(window: WebviewWindow) -> Result<SyncthingDetectResult, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.detect().await
}

#[command]
pub async fn syncthing_status(window: WebviewWindow) -> Result<SyncthingStatusResult, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.status().await
}

#[command]
pub async fn syncthing_qr_png(window: WebviewWindow) -> Result<String, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.qr_png().await
}

#[command]
pub async fn syncthing_add_device(
  window: WebviewWindow,
  id: String,
  name: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.add_device(&id, &name).await
}

#[command]
pub async fn syncthing_pending_devices(
  window: WebviewWindow,
) -> Result<Vec<SyncthingPendingDevice>, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.pending_devices().await
}

#[command]
pub async fn syncthing_accept_device(
  window: WebviewWindow,
  id: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.accept_device(&id).await
}

#[command]
pub async fn syncthing_dismiss_pending_device(
  window: WebviewWindow,
  id: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.dismiss_pending_device(&id).await
}

#[command]
pub async fn syncthing_share_vault_folder(
  window: WebviewWindow,
  app: AppHandle,
  device_id: String,
) -> Result<String, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let vault_root = app
    .state::<VaultState>()
    .get_root()
    .map_err(|e| SyncthingError::UnexpectedResponse(format!("Cannot share vault: {e}")))?;

  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.share_vault_folder(&device_id, &vault_root).await
}

#[command]
pub async fn syncthing_pending_folders(
  window: WebviewWindow,
) -> Result<Vec<SyncthingPendingFolder>, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client.pending_folders().await
}

#[command]
pub async fn syncthing_accept_folder(
  window: WebviewWindow,
  folder_id: String,
  path: String,
  allow_non_empty: Option<bool>,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let target_path = PathBuf::from(&path);
  let config = resolve_local_syncthing_config()?;
  let client = SyncthingClient::new(config)?;
  client
    .accept_folder(&folder_id, &target_path, allow_non_empty.unwrap_or(false))
    .await
}
