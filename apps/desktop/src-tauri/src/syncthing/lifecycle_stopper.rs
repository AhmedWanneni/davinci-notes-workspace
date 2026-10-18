use std::path::Path;
use std::process::Child;
use std::time::{Duration, Instant};

use super::client::SyncthingClient;
use super::config::SyncthingResolvedConfig;
use super::process::remove_pid_file;

pub async fn stop_managed_process(
  mut child_opt: Option<Child>,
  cfg_opt: Option<(u16, String)>,
  home_dir: &Path,
) {
  remove_pid_file(home_dir);

  if let Some((port, key)) = cfg_opt {
    if let Ok(client) = SyncthingClient::new(SyncthingResolvedConfig {
      base_url: format!("http://127.0.0.1:{}", port),
      gui_address: format!("127.0.0.1:{}", port),
      api_key: key,
    }) {
      let _ = client.shutdown().await;
    }
  }

  if let Some(mut child) = child_opt.take() {
    let deadline = Instant::now() + Duration::from_secs(3);
    let mut exited = false;
    while Instant::now() < deadline {
      if let Ok(Some(_)) = child.try_wait() {
        exited = true;
        break;
      }
      tokio::time::sleep(Duration::from_millis(100)).await;
    }
    if !exited {
      let _ = child.kill();
    }
  }
}
