use std::collections::HashMap;
use std::fs;
use std::path::Path;

use super::client::SyncthingClient;
use super::stignore::ensure_stignore;
use super::types::{redact_secrets, SyncthingError, SyncthingPendingFolder};

#[derive(serde::Deserialize)]
struct PendingFolderEntry {
  #[serde(rename = "offeredBy")]
  offered_by: Option<String>,
  label: Option<String>,
  time: Option<String>,
}

impl SyncthingClient {
  pub async fn pending_folders(&self) -> Result<Vec<SyncthingPendingFolder>, SyncthingError> {
    let url = format!("{}/rest/cluster/pending/folders", self.config.base_url);
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

    let raw: HashMap<String, PendingFolderEntry> = serde_json::from_str(&text).map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let mut result = Vec::new();
    for (folder_id, entry) in raw {
      result.push(SyncthingPendingFolder {
        folder_id,
        label: entry.label.unwrap_or_default(),
        offered_by: entry.offered_by.unwrap_or_default(),
        time: entry.time.unwrap_or_default(),
      });
    }

    Ok(result)
  }

  pub async fn accept_folder(&self, folder_id: &str, target_path: &Path, allow_non_empty: bool) -> Result<(), SyncthingError> {
    if !target_path.exists() {
      fs::create_dir_all(target_path)
        .map_err(|e| SyncthingError::UnexpectedResponse(format!("Cannot create target path: {e}")))?;
    } else if !allow_non_empty {
      let entries = fs::read_dir(target_path)
        .map_err(|e| SyncthingError::UnexpectedResponse(format!("Cannot inspect target directory: {e}")))?;
      let non_empty = entries.filter_map(|e| e.ok()).any(|e| {
        let name = e.file_name();
        name != ".DS_Store" && name != ".stfolder" && name != ".stignore"
      });
      if non_empty {
        return Err(SyncthingError::UnexpectedResponse(
          "Target directory is not empty. Please choose an empty folder or confirm overwrite.".to_string(),
        ));
      }
    }

    let _ = ensure_stignore(target_path)
      .map_err(|e| SyncthingError::UnexpectedResponse(format!("Failed to write .stignore: {e}")))?;

    let pendings = self.pending_folders().await.unwrap_or_default();
    let folder_info = pendings.into_iter().find(|f| f.folder_id == folder_id);
    let offered_by = folder_info.as_ref().map(|f| f.offered_by.clone()).unwrap_or_default();
    let label = folder_info.as_ref().map(|f| f.label.clone()).unwrap_or_else(|| "Vault".to_string());

    let my_id = self.status().await?.device_id;
    let mut devices = vec![serde_json::json!({ "deviceID": my_id })];
    if !offered_by.is_empty() {
      devices.push(serde_json::json!({ "deviceID": offered_by }));
    }

    let payload = serde_json::json!({
      "id": folder_id,
      "label": label,
      "path": target_path.to_string_lossy().to_string(),
      "type": "sendreceive",
      "devices": devices
    });
    let payload_str = serde_json::to_string(&payload).unwrap_or_default();

    let folders_url = format!("{}/rest/config/folders", self.config.base_url);
    let resp = self
      .http
      .post(&folders_url)
      .header("X-API-Key", &self.config.api_key)
      .header("Content-Type", "application/json")
      .body(payload_str)
      .send()
      .await
      .map_err(|e| SyncthingError::Unreachable(redact_secrets(&e.to_string(), Some(&self.config.api_key))))?;

    if !resp.status().is_success() {
      let err_txt = resp.text().await.unwrap_or_default();
      return Err(SyncthingError::UnexpectedResponse(redact_secrets(err_txt.trim(), Some(&self.config.api_key))));
    }

    Ok(())
  }
}
