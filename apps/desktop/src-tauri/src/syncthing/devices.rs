use std::collections::HashMap;
use std::path::Path;

use super::client::SyncthingClient;
use super::types::{redact_secrets, SyncthingConfiguredDevice, SyncthingError};

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

  pub async fn list_devices(
    &self,
    vault_path: Option<&Path>,
  ) -> Result<Vec<SyncthingConfiguredDevice>, SyncthingError> {
    let my_id = self.status().await?.device_id.trim().to_uppercase();

    // 1. Fetch configured devices
    let dev_url = format!("{}/rest/config/devices", self.config.base_url);
    let dev_resp = self
      .http
      .get(&dev_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    let configured_devs: Vec<serde_json::Value> = if dev_resp.status().is_success() {
      let txt = dev_resp.text().await.unwrap_or_default();
      serde_json::from_str(&txt).unwrap_or_default()
    } else {
      Vec::new()
    };

    // 2. Fetch connections
    let conn_url = format!("{}/rest/system/connections", self.config.base_url);
    let mut conn_map: HashMap<String, serde_json::Value> = HashMap::new();
    if let Ok(resp) = self.http.get(&conn_url).header("X-API-Key", &self.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&txt) {
          if let Some(conns) = val.get("connections").and_then(|c| c.as_object()) {
            for (k, v) in conns {
              conn_map.insert(k.trim().to_uppercase(), v.clone());
            }
          }
        }
      }
    }

    // 3. Check vault sharing
    let mut shared_device_ids = std::collections::HashSet::new();
    if let Some(vault_root) = vault_path {
      let folders_url = format!("{}/rest/config/folders", self.config.base_url);
      if let Ok(resp) = self.http.get(&folders_url).header("X-API-Key", &self.config.api_key).send().await {
        if resp.status().is_success() {
          let txt = resp.text().await.unwrap_or_default();
          if let Ok(folders) = serde_json::from_str::<Vec<serde_json::Value>>(&txt) {
            let vault_canonical = vault_root.canonicalize().unwrap_or_else(|_| vault_root.to_path_buf());
            for f in folders {
              if let Some(p) = f.get("path").and_then(|p| p.as_str()) {
                let f_canon = Path::new(p).canonicalize().unwrap_or_else(|_| Path::new(p).to_path_buf());
                if f_canon == vault_canonical || p == vault_root.to_string_lossy().as_ref() {
                  if let Some(devs) = f.get("devices").and_then(|d| d.as_array()) {
                    for d in devs {
                      if let Some(did) = d.get("deviceID").and_then(|s| s.as_str()) {
                        shared_device_ids.insert(did.trim().to_uppercase());
                      }
                    }
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }

    // 4. Combine
    let mut result = Vec::new();
    for d in configured_devs {
      let Some(dev_id) = d.get("deviceID").and_then(|v| v.as_str()) else { continue; };
      let clean_id = dev_id.trim().to_uppercase();
      if clean_id.is_empty() || clean_id == my_id {
        continue;
      }

      let name = d.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
      let paused = d.get("paused").and_then(|v| v.as_bool()).unwrap_or(false);

      let (connected, address, last_seen) = if let Some(conn_info) = conn_map.get(&clean_id) {
        let is_conn = conn_info.get("connected").and_then(|c| c.as_bool()).unwrap_or(false);
        let addr = conn_info.get("address").and_then(|a| a.as_str()).map(|s| s.to_string());
        let last = conn_info.get("lastSeen").and_then(|a| a.as_str()).map(|s| s.to_string());
        (is_conn, addr, last)
      } else {
        (false, None, None)
      };

      let is_vault_shared = shared_device_ids.contains(&clean_id);

      result.push(SyncthingConfiguredDevice {
        device_id: clean_id,
        name,
        connected,
        paused,
        address,
        last_seen,
        is_vault_shared,
      });
    }

    Ok(result)
  }

  pub async fn remove_device(&self, id: &str) -> Result<(), SyncthingError> {
    let clean_id = id.trim().to_uppercase();
    if clean_id.is_empty() {
      return Ok(());
    }

    // Remove from any folders
    let folders_url = format!("{}/rest/config/folders", self.config.base_url);
    if let Ok(resp) = self.http.get(&folders_url).header("X-API-Key", &self.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(mut folders) = serde_json::from_str::<Vec<serde_json::Value>>(&txt) {
          for folder in &mut folders {
            if let Some(devices) = folder.get_mut("devices").and_then(|d| d.as_array_mut()) {
              let orig_len = devices.len();
              devices.retain(|d| {
                d.get("deviceID").and_then(|s| s.as_str()).map(|s| s.trim().to_uppercase()) != Some(clean_id.clone())
              });
              if devices.len() != orig_len {
                if let Some(folder_id) = folder.get("id").and_then(|i| i.as_str()) {
                  let put_url = format!("{}/{}", folders_url, folder_id);
                  let body_str = serde_json::to_string(folder).unwrap_or_default();
                  let _ = self
                    .http
                    .put(&put_url)
                    .header("X-API-Key", &self.config.api_key)
                    .header("Content-Type", "application/json")
                    .body(body_str)
                    .send()
                    .await;
                }
              }
            }
          }
        }
      }
    }

    let dev_url = format!("{}/rest/config/devices/{}", self.config.base_url, clean_id);
    let resp = self
      .http
      .delete(&dev_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    if !resp.status().is_success() && resp.status().as_u16() != 404 {
      let err_txt = resp.text().await.unwrap_or_default();
      return Err(SyncthingError::UnexpectedResponse(redact_secrets(err_txt.trim(), Some(&self.config.api_key))));
    }

    Ok(())
  }
}
