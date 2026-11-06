use tauri::{command, Manager, WebviewWindow};

use super::client::SyncthingClient;
use super::commands::resolve_active_config;
use super::types::{redact_secrets, SyncthingError};
use crate::command_auth::reject_plugin_runner;

impl SyncthingClient {
    pub async fn set_local_device_name(&self, name: &str) -> Result<(), SyncthingError> {
        let clean_name = name.trim();
        if clean_name.is_empty() {
            return Err(SyncthingError::UnexpectedResponse(
                "Device name cannot be empty".to_string(),
            ));
        }
        let local_id = self.status().await?.device_id;
        let devices_url = format!("{}/rest/config/devices", self.config.base_url);
        let response = self
            .http
            .get(&devices_url)
            .header("X-API-Key", &self.config.api_key)
            .send()
            .await
            .map_err(|err| {
                SyncthingError::Unreachable(redact_secrets(
                    &err.to_string(),
                    Some(&self.config.api_key),
                ))
            })?;
        if !response.status().is_success() {
            return Err(SyncthingError::UnexpectedResponse(format!(
                "Could not read device configuration (HTTP {})",
                response.status()
            )));
        }
        let mut devices: Vec<serde_json::Value> = response.json().await.map_err(|err| {
            SyncthingError::UnexpectedResponse(redact_secrets(
                &err.to_string(),
                Some(&self.config.api_key),
            ))
        })?;
        let device = devices
            .iter_mut()
            .find(|device| {
                device
                    .get("deviceID")
                    .and_then(|id| id.as_str())
                    .is_some_and(|id| id.eq_ignore_ascii_case(&local_id))
            })
            .ok_or_else(|| {
                SyncthingError::UnexpectedResponse(
                    "Local device configuration was not found".to_string(),
                )
            })?;
        device["name"] = serde_json::Value::String(clean_name.to_string());
        let response = self
            .http
            .put(format!("{devices_url}/{local_id}"))
            .header("X-API-Key", &self.config.api_key)
            .json(device)
            .send()
            .await
            .map_err(|err| {
                SyncthingError::Unreachable(redact_secrets(
                    &err.to_string(),
                    Some(&self.config.api_key),
                ))
            })?;
        if !response.status().is_success() {
            return Err(SyncthingError::UnexpectedResponse(format!(
                "Could not save device name (HTTP {})",
                response.status()
            )));
        }
        Ok(())
    }
}

#[command]
pub async fn syncthing_set_local_device_name(
    window: WebviewWindow,
    name: String,
) -> Result<(), SyncthingError> {
    reject_plugin_runner(&window).map_err(SyncthingError::UnexpectedResponse)?;
    let config = resolve_active_config(window.app_handle())?;
    SyncthingClient::new(config)?
        .set_local_device_name(&name)
        .await
}
