use std::collections::HashMap;
use std::path::Path;

use super::client::SyncthingClient;
pub use super::sync_check_marker::cleanup_stale_marker;
use super::sync_check_marker::execute_marker_self_test;
pub use super::sync_check_types::*;
use super::types::SyncthingError;

impl SyncthingClient {
  pub async fn check_sync(&self, vault_root: &Path) -> Result<SyncthingCheckReport, SyncthingError> {
    cleanup_stale_marker(vault_root);

    // 1. Check reachability and API key
    let detect_res = self.detect().await;
    let (reachability_passed, reachability_reason, status_opt) = match detect_res {
      Ok(det) => {
        let stat = self.status().await.ok();
        (true, format!("Syncthing {} reachable at {}", det.version, self.config.gui_address), stat)
      }
      Err(err) => {
        let reason = match err {
          SyncthingError::NotRunning => "Syncthing is not running".to_string(),
          SyncthingError::NotInstalled => "Syncthing configuration not found".to_string(),
          SyncthingError::BadKey => "Invalid Syncthing API key".to_string(),
          _ => format!("Syncthing error: {err}"),
        };
        (false, reason, None)
      }
    };

    let reachability = SyncthingCheckItem {
      passed: reachability_passed,
      reason: reachability_reason,
    };

    if !reachability_passed {
      return Ok(SyncthingCheckReport::unreachable(reachability));
    }

    // 2. Check remote device connectivity
    let conn_url = format!("{}/rest/system/connections", self.config.base_url);
    let mut connected_devices = Vec::new();
    if let Ok(resp) = self.http.get(&conn_url).header("X-API-Key", &self.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&txt) {
          if let Some(conns) = val.get("connections").and_then(|c| c.as_object()) {
            for (dev_id, dev_info) in conns {
              if dev_info.get("connected").and_then(|c| c.as_bool()).unwrap_or(false) {
                connected_devices.push(dev_id.clone());
              }
            }
          }
        }
      }
    }

    let remote_connected = SyncthingRemoteConnectedItem {
      passed: !connected_devices.is_empty(),
      reason: if connected_devices.is_empty() {
        "No remote devices connected".to_string()
      } else {
        format!("{} remote device(s) connected", connected_devices.len())
      },
      connected_devices: connected_devices.clone(),
    };

    // 3. Vault folder state
    let folders_url = format!("{}/rest/config/folders", self.config.base_url);
    let mut matching_folder_id = None;
    let vault_canonical = vault_root.canonicalize().unwrap_or_else(|_| vault_root.to_path_buf());

    if let Ok(resp) = self.http.get(&folders_url).header("X-API-Key", &self.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(folders) = serde_json::from_str::<Vec<serde_json::Value>>(&txt) {
          for f in folders {
            if let Some(p) = f.get("path").and_then(|p| p.as_str()) {
              let f_canon = Path::new(p).canonicalize().unwrap_or_else(|_| Path::new(p).to_path_buf());
              if f_canon == vault_canonical || p == vault_root.to_string_lossy().as_ref() {
                matching_folder_id = f.get("id").and_then(|i| i.as_str()).map(|s| s.to_string());
                break;
              }
            }
          }
        }
      }
    }

    let (folder_state, folder_errors) = if let Some(ref fid) = matching_folder_id {
      self.inspect_folder(fid, &connected_devices).await
    } else {
      (
        SyncthingFolderStateItem {
          passed: false,
          reason: "Current vault folder is not shared in Syncthing".into(),
          folder_id: None,
          state: None,
          out_of_sync_items: 0,
          remote_completions: HashMap::new(),
        },
        SyncthingFolderErrorsItem {
          passed: false,
          reason: "Skipped: vault folder not found in Syncthing".into(),
          errors: Vec::new(),
        },
      )
    };

    // 5. Self-test: write marker, poll remote completion with timeout, report round-trip, cleanup
    let self_test = if !remote_connected.passed {
      SyncthingSelfTestItem {
        passed: false,
        reason: "Skipped: no remote devices connected to verify sync round-trip".into(),
        round_trip_ms: None,
      }
    } else if matching_folder_id.is_none() {
      SyncthingSelfTestItem {
        passed: false,
        reason: "Skipped: vault folder is not shared in Syncthing".into(),
        round_trip_ms: None,
      }
    } else {
      let fid = matching_folder_id.as_deref().unwrap_or("default");
      execute_marker_self_test(self, vault_root, fid, &connected_devices, status_opt.as_ref()).await
    };

    Ok(SyncthingCheckReport {
      reachability,
      remote_connected,
      folder_state,
      folder_errors,
      self_test,
    })
  }

  async fn inspect_folder(
    &self,
    fid: &str,
    connected_devices: &[String],
  ) -> (SyncthingFolderStateItem, SyncthingFolderErrorsItem) {
    let status_url = format!("{}/rest/db/status?folder={}", self.config.base_url, fid);
    let mut folder_state_str = "unknown".to_string();
    let mut out_of_sync = 0u32;
    let mut error_msg = String::new();

    if let Ok(resp) = self.http.get(&status_url).header("X-API-Key", &self.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&txt) {
          folder_state_str = val.get("state").and_then(|s| s.as_str()).unwrap_or("unknown").to_string();
          out_of_sync = val.get("needTotalItems").and_then(|n| n.as_u64()).unwrap_or(0) as u32;
          if let Some(err) = val.get("error").and_then(|e| e.as_str()) {
            if !err.is_empty() {
              error_msg = err.to_string();
            }
          }
        }
      }
    }

    let mut remote_completions = HashMap::new();
    for dev in connected_devices {
      let comp_url = format!("{}/rest/db/completion?folder={}&device={}", self.config.base_url, fid, dev);
      if let Ok(resp) = self.http.get(&comp_url).header("X-API-Key", &self.config.api_key).send().await {
        if resp.status().is_success() {
          let txt = resp.text().await.unwrap_or_default();
          if let Ok(val) = serde_json::from_str::<serde_json::Value>(&txt) {
            let comp_pct = val.get("completion").and_then(|c| c.as_f64()).unwrap_or(0.0);
            remote_completions.insert(dev.clone(), comp_pct);
          }
        }
      }
    }

    let mut error_list = Vec::new();
    if !error_msg.is_empty() {
      error_list.push(error_msg);
    }
    let err_url = format!("{}/rest/folder/errors?folder={}", self.config.base_url, fid);
    if let Ok(resp) = self.http.get(&err_url).header("X-API-Key", &self.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&txt) {
          if let Some(items) = val.get("errors").and_then(|e| e.as_array()) {
            for item in items {
              let err_desc = item.get("error").and_then(|e| e.as_str()).unwrap_or("unknown error");
              let path_desc = item.get("path").and_then(|p| p.as_str()).unwrap_or("");
              if path_desc.is_empty() {
                error_list.push(err_desc.to_string());
              } else {
                error_list.push(format!("{path_desc}: {err_desc}"));
              }
            }
          }
        }
      }
    }

    let f_state = SyncthingFolderStateItem {
      passed: folder_state_str != "error",
      reason: if folder_state_str == "error" {
        "Folder reports error state".to_string()
      } else {
        format!("Folder is {} ({} out-of-sync items)", folder_state_str, out_of_sync)
      },
      folder_id: Some(fid.to_string()),
      state: Some(folder_state_str),
      out_of_sync_items: out_of_sync,
      remote_completions,
    };

    let f_errors = SyncthingFolderErrorsItem {
      passed: error_list.is_empty(),
      reason: if error_list.is_empty() {
        "No folder errors reported".to_string()
      } else {
        format!("{} folder error(s) reported", error_list.len())
      },
      errors: error_list,
    };

    (f_state, f_errors)
  }
}
