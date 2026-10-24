use std::path::Path;
use std::time::{Duration, Instant};

use super::client::SyncthingClient;
use super::config::SyncthingResolvedConfig;
use super::process::{is_pid_running, kill_pid_forcefully, read_pid_file, remove_pid_file};
use super::types::{SyncthingError, SyncthingStatusResult};

pub async fn check_and_recover_orphan(
  home_dir: &Path,
  api_key: &str,
) -> Result<Option<(u16, SyncthingStatusResult)>, SyncthingError> {
  let Some((pid, port)) = read_pid_file(home_dir) else {
    return Ok(None);
  };

  if is_pid_running(pid) {
    let test_client = SyncthingClient::new(SyncthingResolvedConfig {
      base_url: format!("http://127.0.0.1:{}", port),
      gui_address: format!("127.0.0.1:{}", port),
      api_key: api_key.to_string(),
    })?;

    if let Ok(status) = test_client.status().await {
      return Ok(Some((port, status)));
    }
    kill_pid_forcefully(pid);
  }

  remove_pid_file(home_dir);
  Ok(None)
}

pub async fn poll_startup_until_ready(
  client: &SyncthingClient,
  timeout: Duration,
) -> Result<(SyncthingStatusResult, String), SyncthingError> {
  let start_time = Instant::now();
  while start_time.elapsed() < timeout {
    if let Ok(detect) = client.detect().await {
      if detect.running {
        if let Ok(stat) = client.status().await {
          return Ok((stat, detect.version));
        }
      }
    }
    tokio::time::sleep(Duration::from_millis(250)).await;
  }

  Err(SyncthingError::UnexpectedResponse("Startup timeout: API did not respond".to_string()))
}
