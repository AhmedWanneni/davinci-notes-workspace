use std::collections::HashMap;

use super::client::SyncthingClient;
use super::types::{redact_secrets, SyncthingError, SyncthingPendingDevice};

#[derive(serde::Deserialize)]
struct PendingDeviceEntry {
  name: Option<String>,
  address: Option<String>,
  time: Option<String>,
}

impl SyncthingClient {
  pub async fn add_device(&self, id: &str, name: &str) -> Result<(), SyncthingError> {
    let clean_id = id.trim().to_uppercase();
    if clean_id.is_empty() {
      return Err(SyncthingError::UnexpectedResponse("Device ID cannot be empty".to_string()));
    }

    let status = self.status().await?;
    if clean_id == status.device_id.trim().to_uppercase() {
      return Err(SyncthingError::UnexpectedResponse(
        "Cannot add this device: this is your own Device ID.".to_string(),
      ));
    }

    // Check existing devices
    let dev_url = format!("{}/rest/config/devices", self.config.base_url);
    let dev_resp = self
      .http
      .get(&dev_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    if dev_resp.status().is_success() {
      if let Ok(text) = dev_resp.text().await {
        if let Ok(devs) = serde_json::from_str::<Vec<serde_json::Value>>(&text) {
          for d in devs {
            if let Some(existing_id) = d.get("deviceID").and_then(|v| v.as_str()) {
              if existing_id.trim().to_uppercase() == clean_id {
                return Err(SyncthingError::UnexpectedResponse("Device already added.".to_string()));
              }
            }
          }
        }
      }
    }

    let payload = serde_json::json!({
      "deviceID": clean_id,
      "name": name.trim(),
      "addresses": ["dynamic"],
      "compression": "metadata"
    });
    let payload_str = serde_json::to_string(&payload).unwrap_or_default();

    let resp = self
      .http
      .post(&dev_url)
      .header("X-API-Key", &self.config.api_key)
      .header("Content-Type", "application/json")
      .body(payload_str)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    if !resp.status().is_success() {
      let err_text = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
      return Err(SyncthingError::UnexpectedResponse(redact_secrets(
        err_text.trim(),
        Some(&self.config.api_key),
      )));
    }

    Ok(())
  }

  pub async fn pending_devices(&self) -> Result<Vec<SyncthingPendingDevice>, SyncthingError> {
    let url = format!("{}/rest/cluster/pending/devices", self.config.base_url);
    let resp = self
      .http
      .get(&url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    if !resp.status().is_success() {
      return Err(SyncthingError::UnexpectedResponse(format!("HTTP status {}", resp.status())));
    }

    let text = resp.text().await.map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let raw: HashMap<String, PendingDeviceEntry> = serde_json::from_str(&text).map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let mut result = Vec::new();
    for (device_id, entry) in raw {
      result.push(SyncthingPendingDevice {
        device_id,
        name: entry.name.unwrap_or_default(),
        address: entry.address.unwrap_or_default(),
        time: entry.time.unwrap_or_default(),
      });
    }

    Ok(result)
  }

  pub async fn accept_device(&self, id: &str) -> Result<(), SyncthingError> {
    let pendings = self.pending_devices().await.unwrap_or_default();
    let name = pendings
      .iter()
      .find(|d| d.device_id.trim().eq_ignore_ascii_case(id.trim()))
      .map(|d| d.name.as_str())
      .unwrap_or("");
    self.add_device(id, name).await
  }

  pub async fn dismiss_pending_device(&self, id: &str) -> Result<(), SyncthingError> {
    let url = format!("{}/rest/cluster/pending/devices?device={}", self.config.base_url, id.trim());
    let _ = self
      .http
      .delete(&url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await;
    Ok(())
  }
}
