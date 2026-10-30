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
