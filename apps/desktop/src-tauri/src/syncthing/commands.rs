use std::path::PathBuf;
use tauri::{command, AppHandle, Manager, WebviewWindow};

use crate::command_auth::reject_plugin_runner;
use crate::state::VaultState;

use super::client::SyncthingClient;
use super::config::{resolve_local_syncthing_config, SyncthingResolvedConfig};
use super::lifecycle::SyncthingManager;
use super::types::{
  SyncthingConfiguredDevice, SyncthingDetectResult, SyncthingError, SyncthingLifecycleStatus,
  SyncthingPendingDevice, SyncthingPendingFolder, SyncthingStatusResult,
  SyncthingVaultFolderInfo,
};

pub(crate) fn resolve_active_config(app: &AppHandle) -> Result<SyncthingResolvedConfig, SyncthingError> {
  if let Some(manager) = app.try_state::<SyncthingManager>() {
    if let Some(cfg) = manager.get_resolved_config() {
      return Ok(cfg);
    }
  }
  resolve_local_syncthing_config()
}

#[command]
pub async fn syncthing_start(window: WebviewWindow, app: AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let manager = app
    .try_state::<SyncthingManager>()
    .ok_or_else(|| SyncthingError::UnexpectedResponse("SyncthingManager state not registered".to_string()))?;
  manager.start(&app).await
}

#[command]
pub async fn syncthing_stop(window: WebviewWindow, app: AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let manager = app
    .try_state::<SyncthingManager>()
    .ok_or_else(|| SyncthingError::UnexpectedResponse("SyncthingManager state not registered".to_string()))?;
  manager.stop(&app).await
}

#[command]
pub async fn syncthing_restart(window: WebviewWindow, app: AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let manager = app
    .try_state::<SyncthingManager>()
    .ok_or_else(|| SyncthingError::UnexpectedResponse("SyncthingManager state not registered".to_string()))?;
  manager.restart(&app).await
}

#[command]
pub async fn syncthing_lifecycle_status(window: WebviewWindow, app: AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let manager = app
    .try_state::<SyncthingManager>()
    .ok_or_else(|| SyncthingError::UnexpectedResponse("SyncthingManager state not registered".to_string()))?;
  Ok(manager.get_status())
}

#[command]
pub async fn syncthing_detect(window: WebviewWindow) -> Result<SyncthingDetectResult, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.detect().await
}

#[command]
pub async fn syncthing_status(window: WebviewWindow) -> Result<SyncthingStatusResult, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.status().await
}

#[command]
pub async fn syncthing_qr_png(
  window: WebviewWindow,
  text: Option<String>,
) -> Result<String, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.qr_png(text.as_deref()).await
}

#[command]
pub async fn syncthing_ensure_vault_registered(
  window: WebviewWindow,
  app: AppHandle,
) -> Result<SyncthingVaultFolderInfo, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let vault_root = app
    .state::<VaultState>()
    .get_root()
    .map_err(|e| SyncthingError::UnexpectedResponse(format!("Cannot register vault: {e}")))?;

  let config = resolve_active_config(&app)?;
  let client = SyncthingClient::new(config)?;
  client.ensure_vault_registered(&vault_root).await
}

#[command]
pub async fn syncthing_add_device(
  window: WebviewWindow,
  id: String,
  name: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.add_device(&id, &name).await
}

#[command]
pub async fn syncthing_list_devices(
  window: WebviewWindow,
  app: AppHandle,
) -> Result<Vec<SyncthingConfiguredDevice>, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(&app)?;
  let client = SyncthingClient::new(config)?;
  let vault_root = app
    .state::<VaultState>()
    .get_root()
    .ok();
  client.list_devices(vault_root.as_deref()).await
}

#[command]
pub async fn syncthing_remove_device(
  window: WebviewWindow,
  id: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.remove_device(&id).await
}

#[command]
pub async fn syncthing_pending_devices(
  window: WebviewWindow,
) -> Result<Vec<SyncthingPendingDevice>, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.pending_devices().await
}

#[command]
pub async fn syncthing_accept_device(
  window: WebviewWindow,
  id: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client.accept_device(&id).await
}

#[command]
pub async fn syncthing_dismiss_pending_device(
  window: WebviewWindow,
  id: String,
) -> Result<(), SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
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

  let config = resolve_active_config(&app)?;
  let client = SyncthingClient::new(config)?;
  client.share_vault_folder(&device_id, &vault_root).await
}

#[command]
pub async fn syncthing_pending_folders(
  window: WebviewWindow,
) -> Result<Vec<SyncthingPendingFolder>, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let config = resolve_active_config(window.app_handle())?;
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
  let config = resolve_active_config(window.app_handle())?;
  let client = SyncthingClient::new(config)?;
  client
    .accept_folder(&folder_id, &target_path, allow_non_empty.unwrap_or(false))
    .await
}

#[command]
pub async fn syncthing_check_sync(
  window: WebviewWindow,
  app: AppHandle,
) -> Result<super::sync_check::SyncthingCheckReport, SyncthingError> {
  reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
  let vault_root = app
    .state::<VaultState>()
    .get_root()
    .map_err(|e| SyncthingError::UnexpectedResponse(format!("Cannot check sync without open vault: {e}")))?;

  let config = resolve_active_config(&app)?;
  let client = SyncthingClient::new(config)?;
  client.check_sync(&vault_root).await
}
