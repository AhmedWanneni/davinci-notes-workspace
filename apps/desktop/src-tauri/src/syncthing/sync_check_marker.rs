use std::fs;
use std::path::Path;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use super::client::SyncthingClient;
use super::sync_check_types::SyncthingSelfTestItem;
use super::types::SyncthingStatusResult;

pub fn cleanup_stale_marker(vault_root: &Path) {
  let marker_dir = vault_root.join(".davinci-sync-check");
  if marker_dir.exists() {
    let _ = fs::remove_dir_all(&marker_dir);
  }
}

pub async fn execute_marker_self_test(
  client: &SyncthingClient,
  vault_root: &Path,
  folder_id: &str,
  connected_devices: &[String],
  status_opt: Option<&SyncthingStatusResult>,
) -> SyncthingSelfTestItem {
  let check_dir = vault_root.join(".davinci-sync-check");
  let _ = fs::create_dir_all(&check_dir);

  let my_id = status_opt.map(|s| s.device_id.as_str()).unwrap_or("local");
  let now_ts = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis();
  let marker_name = format!("{}-{}.txt", my_id, now_ts);
  let marker_path = check_dir.join(&marker_name);

  if let Err(e) = fs::write(&marker_path, format!("davinci-sync-check {}\n", now_ts)) {
    cleanup_stale_marker(vault_root);
    return SyncthingSelfTestItem {
      passed: false,
      reason: format!("Failed to create marker file: {e}"),
      round_trip_ms: None,
    };
  }

  // Trigger local scan for marker
  let scan_url = format!("{}/rest/db/scan?folder={}&sub=.davinci-sync-check", client.config.base_url, folder_id);
  let _ = client.http.post(&scan_url).header("X-API-Key", &client.config.api_key).send().await;

  let start_time = Instant::now();
  let timeout = Duration::from_secs(10);
  let mut round_trip_ms = None;
  let target_device = &connected_devices[0];

  loop {
    tokio::time::sleep(Duration::from_millis(250)).await;

    let comp_url = format!("{}/rest/db/completion?folder={}&device={}", client.config.base_url, folder_id, target_device);
    if let Ok(resp) = client.http.get(&comp_url).header("X-API-Key", &client.config.api_key).send().await {
      if resp.status().is_success() {
        let txt = resp.text().await.unwrap_or_default();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&txt) {
          let completion = val.get("completion").and_then(|c| c.as_f64()).unwrap_or(0.0);
          let need_items = val.get("needItems").and_then(|n| n.as_u64()).unwrap_or(0);
          if completion >= 100.0 && need_items == 0 {
            round_trip_ms = Some(start_time.elapsed().as_millis() as u64);
            break;
          }
        }
      }
    }

    if start_time.elapsed() >= timeout {
      break;
    }
  }

  // Always clean up marker in all paths (success or failure)
  cleanup_stale_marker(vault_root);
  let _ = client.http.post(&scan_url).header("X-API-Key", &client.config.api_key).send().await;

  match round_trip_ms {
    Some(ms) => SyncthingSelfTestItem {
      passed: true,
      reason: format!("Synced to remote in {ms}ms"),
      round_trip_ms: Some(ms),
    },
    None => SyncthingSelfTestItem {
      passed: false,
      reason: "Timed out waiting for remote device to sync marker (10s)".to_string(),
      round_trip_ms: None,
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cleanup_stale_marker_removes_directory() {
    let tmp = std::env::temp_dir().join(format!("davinci_test_marker_{}", std::process::id()));
    let check_dir = tmp.join(".davinci-sync-check");
    fs::create_dir_all(&check_dir).unwrap();
    fs::write(check_dir.join("marker.txt"), "test").unwrap();

    assert!(check_dir.exists());
    cleanup_stale_marker(&tmp);
    assert!(!check_dir.exists());

    let _ = fs::remove_dir_all(&tmp);
  }
}
