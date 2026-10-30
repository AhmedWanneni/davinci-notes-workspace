use std::path::Path;

use super::client::SyncthingClient;
use super::stignore::ensure_stignore;
use super::types::{
  redact_secrets, SyncthingError, SyncthingSharedVault, SyncthingVaultFolderInfo,
};

impl SyncthingClient {
  pub async fn ensure_vault_registered(&self, vault_path: &Path) -> Result<SyncthingVaultFolderInfo, SyncthingError> {
    let _ = ensure_stignore(vault_path)
      .map_err(|e| SyncthingError::UnexpectedResponse(format!("Failed to write .stignore: {e}")))?;

    let path_str = vault_path.to_string_lossy().to_string();
    let folders_url = format!("{}/rest/config/folders", self.config.base_url);

    let get_resp = self
      .http
      .get(&folders_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    let folders: Vec<serde_json::Value> = if get_resp.status().is_success() {
      let txt = get_resp.text().await.unwrap_or_default();
      serde_json::from_str(&txt).unwrap_or_default()
    } else {
      Vec::new()
    };

    if let Some(folder) = folders.iter().find(|f| f.get("path").and_then(|p| p.as_str()) == Some(&path_str)) {
      let folder_id = folder.get("id").and_then(|i| i.as_str()).unwrap_or("default").to_string();
      let folder_label = folder.get("label").and_then(|l| l.as_str()).unwrap_or("Vault").to_string();
      return Ok(SyncthingVaultFolderInfo { folder_id, folder_label });
    }

    let my_id = self.status().await?.device_id;
    let label = vault_path.file_name().and_then(|n| n.to_str()).unwrap_or("Vault").to_string();
    let folder_id = format!("davinci-{}", &blake3::hash(path_str.as_bytes()).to_hex()[..10]);

    let new_folder = serde_json::json!({
      "id": folder_id,
      "label": label,
      "path": path_str,
      "type": "sendreceive",
      "devices": [
        { "deviceID": my_id }
      ],
      "rescanIntervalS": 60,
      "fsWatcherEnabled": true,
      "fsWatcherDelayS": 10
    });
    let new_folder_str = serde_json::to_string(&new_folder).unwrap_or_default();

    let post_resp = self
      .http
      .post(&folders_url)
      .header("X-API-Key", &self.config.api_key)
      .header("Content-Type", "application/json")
      .body(new_folder_str)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    if !post_resp.status().is_success() {
      let err_txt = post_resp.text().await.unwrap_or_default();
      return Err(SyncthingError::UnexpectedResponse(redact_secrets(err_txt.trim(), Some(&self.config.api_key))));
    }

    Ok(SyncthingVaultFolderInfo {
      folder_id,
      folder_label: label,
    })
  }

  pub async fn share_vault_folder(&self, device_id: &str, vault_path: &Path) -> Result<String, SyncthingError> {
    let clean_dev_id = device_id.trim().to_uppercase();
    let reg = self.ensure_vault_registered(vault_path).await?;
    let folders_url = format!("{}/rest/config/folders", self.config.base_url);

    let get_resp = self
      .http
      .get(&folders_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    let mut folders: Vec<serde_json::Value> = if get_resp.status().is_success() {
      let txt = get_resp.text().await.unwrap_or_default();
      serde_json::from_str(&txt).unwrap_or_default()
    } else {
      Vec::new()
    };

    if let Some(folder) = folders.iter_mut().find(|f| f.get("id").and_then(|i| i.as_str()) == Some(&reg.folder_id)) {
      let mut devices = folder.get("devices").and_then(|d| d.as_array()).cloned().unwrap_or_default();
      let already_shared = devices.iter().any(|d| d.get("deviceID").and_then(|id| id.as_str()) == Some(&clean_dev_id));
      if !already_shared {
        devices.push(serde_json::json!({ "deviceID": clean_dev_id }));
        folder["devices"] = serde_json::Value::Array(devices);
        let put_url = format!("{}/{}", folders_url, reg.folder_id);
        let folder_str = serde_json::to_string(&folder).unwrap_or_default();
        let put_resp = self
          .http
          .put(&put_url)
          .header("X-API-Key", &self.config.api_key)
          .header("Content-Type", "application/json")
          .body(folder_str)
          .send()
          .await
          .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;
        if !put_resp.status().is_success() {
          let err_txt = put_resp.text().await.unwrap_or_default();
          return Err(SyncthingError::UnexpectedResponse(redact_secrets(err_txt.trim(), Some(&self.config.api_key))));
        }
      }
    }

    Ok(reg.folder_id)
  }

  pub async fn list_shared_vaults(
    &self,
    active_vault_path: Option<&Path>,
  ) -> Result<Vec<SyncthingSharedVault>, SyncthingError> {
    let my_id = self.status().await?.device_id.trim().to_uppercase();
    let folders_url = format!("{}/rest/config/folders", self.config.base_url);

    let get_resp = self
      .http
      .get(&folders_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    let folders: Vec<serde_json::Value> = if get_resp.status().is_success() {
      let txt = get_resp.text().await.unwrap_or_default();
      serde_json::from_str(&txt).unwrap_or_default()
    } else {
      Vec::new()
    };

    let active_canonical = active_vault_path.and_then(|p| p.canonicalize().ok().or_else(|| Some(p.to_path_buf())));

    let mut result = Vec::new();
    for f in folders {
      let Some(folder_id) = f.get("id").and_then(|i| i.as_str()) else { continue; };
      let label = f.get("label").and_then(|l| l.as_str()).unwrap_or("Vault").to_string();
      let path = f.get("path").and_then(|p| p.as_str()).unwrap_or("").to_string();
      let paused = f.get("paused").and_then(|p| p.as_bool()).unwrap_or(false);

      let mut shared_with_device_ids = Vec::new();
      if let Some(devs) = f.get("devices").and_then(|d| d.as_array()) {
        for d in devs {
          if let Some(did) = d.get("deviceID").and_then(|s| s.as_str()) {
            let clean_did = did.trim().to_uppercase();
            if clean_did != my_id && !clean_did.is_empty() {
              shared_with_device_ids.push(clean_did);
            }
          }
        }
      }

      let is_active = if let Some(ref act) = active_canonical {
        let f_path = Path::new(&path);
        let f_canon = f_path.canonicalize().unwrap_or_else(|_| f_path.to_path_buf());
        &f_canon == act || path == active_vault_path.unwrap().to_string_lossy().as_ref()
      } else {
        false
      };

      let status_url = format!("{}/rest/db/status?folder={}", self.config.base_url, folder_id);
      let sync_state = if let Ok(resp) = self.http.get(&status_url).header("X-API-Key", &self.config.api_key).send().await {
        if resp.status().is_success() {
          let txt = resp.text().await.unwrap_or_default();
          if let Ok(st_val) = serde_json::from_str::<serde_json::Value>(&txt) {
            st_val.get("state").and_then(|s| s.as_str()).map(|s| s.to_string())
          } else {
            None
          }
        } else {
          None
        }
      } else {
        None
      };

      result.push(SyncthingSharedVault {
        folder_id: folder_id.to_string(),
        label,
        path,
        shared_with_device_ids,
        paused,
        is_active_vault: is_active,
        sync_state,
      });
    }

    Ok(result)
  }

  pub async fn unshare_vault_folder(&self, folder_id: &str) -> Result<(), SyncthingError> {
    let clean_id = folder_id.trim();
    if clean_id.is_empty() {
      return Ok(());
    }

    let url = format!("{}/rest/config/folders/{}", self.config.base_url, clean_id);
    let resp = self
      .http
      .delete(&url)
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
