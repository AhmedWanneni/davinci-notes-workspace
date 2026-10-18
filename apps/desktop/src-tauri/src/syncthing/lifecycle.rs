use std::collections::VecDeque;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::Child;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

use super::api_key::get_or_create_managed_api_key;
use super::client::SyncthingClient;
use super::config::SyncthingResolvedConfig;
use super::lifecycle_starter::{check_and_recover_orphan, poll_startup_until_ready};
use super::process::{
  allocate_free_port, find_bundled_syncthing, remove_pid_file, spawn_syncthing_process,
  write_pid_file,
};
use super::types::{SyncthingError, SyncthingLifecycleState, SyncthingLifecycleStatus};

pub const LIFECYCLE_EVENT: &str = "syncthing://status";
const MAX_LOG_LINES: usize = 40;
const STARTUP_TIMEOUT: Duration = Duration::from_secs(15);
const MAX_CRASHES_IN_WINDOW: usize = 3;
const CRASH_WINDOW: Duration = Duration::from_secs(60);

struct ManagerInner {
  state: SyncthingLifecycleState,
  child: Option<Child>,
  port: Option<u16>,
  api_key: Option<String>,
  device_id: Option<String>,
  device_name: Option<String>,
  version: Option<String>,
  reason: Option<String>,
  last_logs: VecDeque<String>,
  crash_times: Vec<Instant>,
}

#[derive(Clone)]
pub struct SyncthingManager {
  inner: Arc<Mutex<ManagerInner>>,
}

impl Default for SyncthingManager {
  fn default() -> Self {
    Self::new()
  }
}

impl SyncthingManager {
  pub fn new() -> Self {
    Self {
      inner: Arc::new(Mutex::new(ManagerInner {
        state: SyncthingLifecycleState::Stopped,
        child: None, port: None, api_key: None, device_id: None, device_name: None,
        version: None, reason: None, last_logs: VecDeque::with_capacity(MAX_LOG_LINES),
        crash_times: Vec::new(),
      })),
    }
  }

  pub fn get_home_dir(app: &AppHandle) -> Result<PathBuf, SyncthingError> {
    let base = app
      .path()
      .app_data_dir()
      .map_err(|e| SyncthingError::UnexpectedResponse(format!("App data dir error: {e}")))?;
    Ok(base.join("syncthing"))
  }

  pub fn get_resolved_config(&self) -> Option<SyncthingResolvedConfig> {
    let guard = self.inner.lock().ok()?;
    if guard.state != SyncthingLifecycleState::Running {
      return None;
    }
    let port = guard.port?;
    let api_key = guard.api_key.clone()?;
    Some(SyncthingResolvedConfig {
      base_url: format!("http://127.0.0.1:{}", port),
      gui_address: format!("127.0.0.1:{}", port),
      api_key,
    })
  }

  pub fn get_status(&self) -> SyncthingLifecycleStatus {
    let mut guard = match self.inner.lock() {
      Ok(g) => g,
      Err(p) => p.into_inner(),
    };
    self.check_child_liveness(&mut guard);
    SyncthingLifecycleStatus {
      state: guard.state,
      reason: guard.reason.clone(),
      gui_address: guard.port.map(|p| format!("127.0.0.1:{}", p)),
      device_id: guard.device_id.clone(),
      device_name: guard.device_name.clone(),
      version: guard.version.clone(),
      last_logs: if guard.last_logs.is_empty() { None } else { Some(guard.last_logs.iter().cloned().collect()) },
    }
  }

  fn check_child_liveness(&self, inner: &mut ManagerInner) {
    if inner.state != SyncthingLifecycleState::Running {
      return;
    }
    if let Some(child) = inner.child.as_mut() {
      if let Ok(Some(exit_status)) = child.try_wait() {
        inner.state = SyncthingLifecycleState::Crashed;
        inner.reason = Some(format!("Process terminated unexpectedly: {exit_status}"));
        inner.child = None;
      }
    }
  }

  fn emit_status(&self, app: &AppHandle) {
    let status = self.get_status();
    let _ = app.emit(LIFECYCLE_EVENT, &status);
  }

  pub async fn start(&self, app: &AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
    let home_dir = Self::get_home_dir(app)?;
    let api_key = get_or_create_managed_api_key(&home_dir);

    // 1. Recover orphan if responding
    if let Some((port, status)) = check_and_recover_orphan(&home_dir, &api_key).await? {
      let mut guard = self.inner.lock().map_err(|e| SyncthingError::UnexpectedResponse(e.to_string()))?;
      guard.state = SyncthingLifecycleState::Running;
      guard.port = Some(port);
      guard.api_key = Some(api_key);
      guard.device_id = Some(status.device_id);
      guard.device_name = Some(status.device_name);
      drop(guard);
      self.emit_status(app);
      return Ok(self.get_status());
    }

    // 2. Crash loop guard
    {
      let mut guard = self.inner.lock().map_err(|e| SyncthingError::UnexpectedResponse(e.to_string()))?;
      let now = Instant::now();
      guard.crash_times.retain(|t| now.duration_since(*t) < CRASH_WINDOW);
      if guard.crash_times.len() >= MAX_CRASHES_IN_WINDOW {
        guard.state = SyncthingLifecycleState::Crashed;
        guard.reason = Some("Repeated crashes detected. Halting auto-restart.".to_string());
        drop(guard);
        self.emit_status(app);
        return Err(SyncthingError::UnexpectedResponse("Crash loop guard active".to_string()));
      }
      guard.state = SyncthingLifecycleState::Starting;
      guard.reason = None;
    }
    self.emit_status(app);

    let bin_path = find_bundled_syncthing(app).map_err(SyncthingError::UnexpectedResponse)?;
    let port = allocate_free_port().map_err(SyncthingError::UnexpectedResponse)?;

    let mut child = spawn_syncthing_process(&bin_path, &home_dir, port, &api_key)
      .map_err(SyncthingError::UnexpectedResponse)?;
    let pid = child.id();
    let _ = write_pid_file(&home_dir, pid, port);

    // 3. Pipe stdout/stderr into ring buffer
    let logs_ref = self.inner.clone();
    if let Some(stdout) = child.stdout.take() {
      std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
          if let Ok(mut g) = logs_ref.lock() {
            if g.last_logs.len() >= MAX_LOG_LINES { g.last_logs.pop_front(); }
            g.last_logs.push_back(line);
          }
        }
      });
    }

    // 4. Poll until ready
    let client = SyncthingClient::new(SyncthingResolvedConfig {
      base_url: format!("http://127.0.0.1:{}", port),
      gui_address: format!("127.0.0.1:{}", port),
      api_key: api_key.clone(),
    })?;

    let poll_result = poll_startup_until_ready(&client, STARTUP_TIMEOUT).await;
    let Ok((stat, version)) = poll_result else {
      let _ = child.kill();
      remove_pid_file(&home_dir);
      let mut guard = self.inner.lock().map_err(|e| SyncthingError::UnexpectedResponse(e.to_string()))?;
      guard.state = SyncthingLifecycleState::Crashed;
      guard.reason = Some("Startup timeout: API did not respond".to_string());
      guard.crash_times.push(Instant::now());
      drop(guard);
      self.emit_status(app);
      return Err(SyncthingError::UnexpectedResponse("Startup timeout".to_string()));
    };

    {
      let mut guard = self.inner.lock().map_err(|e| SyncthingError::UnexpectedResponse(e.to_string()))?;
      guard.state = SyncthingLifecycleState::Running;
      guard.child = Some(child);
      guard.port = Some(port);
      guard.api_key = Some(api_key);
      guard.device_id = Some(stat.device_id);
      guard.device_name = Some(stat.device_name);
      guard.version = Some(version);
    }

    self.emit_status(app);
    Ok(self.get_status())
  }

  pub async fn stop(&self, app: &AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
    let (child_opt, cfg_opt, home_dir) = {
      let mut guard = self.inner.lock().map_err(|e| SyncthingError::UnexpectedResponse(e.to_string()))?;
      let c = guard.child.take();
      let port = guard.port;
      let key = guard.api_key.clone();
      guard.state = SyncthingLifecycleState::Stopped;
      guard.port = None;
      (c, port.and_then(|p| key.map(|k| (p, k))), Self::get_home_dir(app)?)
    };

    super::lifecycle_stopper::stop_managed_process(child_opt, cfg_opt, &home_dir).await;
    self.emit_status(app);
    Ok(self.get_status())
  }

  pub async fn restart(&self, app: &AppHandle) -> Result<SyncthingLifecycleStatus, SyncthingError> {
    let _ = self.stop(app).await;
    tokio::time::sleep(Duration::from_millis(300)).await;
    self.start(app).await
  }

  pub fn shutdown_on_exit(&self, app: &AppHandle) {
    if let Ok(home) = Self::get_home_dir(app) {
      remove_pid_file(&home);
    }
    if let Ok(mut guard) = self.inner.lock() {
      if let Some(mut child) = guard.child.take() {
        let _ = child.kill();
      }
      guard.state = SyncthingLifecycleState::Stopped;
    }
  }
}
