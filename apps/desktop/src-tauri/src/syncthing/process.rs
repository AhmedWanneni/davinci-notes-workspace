use std::fs;
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use tauri::{AppHandle, Manager};

pub const PID_FILE_NAME: &str = "syncthing.pid";

pub fn allocate_free_port() -> Result<u16, String> {
  let listener = TcpListener::bind("127.0.0.1:0")
    .map_err(|e| format!("Failed to bind to random localhost port: {e}"))?;
  let port = listener
    .local_addr()
    .map_err(|e| format!("Failed to read socket port: {e}"))?
    .port();
  drop(listener);
  Ok(port)
}

pub fn find_bundled_syncthing(app: &AppHandle) -> Result<PathBuf, String> {
  // 1. Production bundle: alongside the executable
  if let Ok(exe_path) = std::env::current_exe() {
    if let Some(exe_dir) = exe_path.parent() {
      let candidate = exe_dir.join(if cfg!(windows) { "syncthing.exe" } else { "syncthing" });
      if candidate.exists() {
        return Ok(candidate);
      }
    }
  }

  // 2. Resource directory
  if let Ok(res_dir) = app.path().resource_dir() {
    let candidate = res_dir.join(if cfg!(windows) { "syncthing.exe" } else { "syncthing" });
    if candidate.exists() {
      return Ok(candidate);
    }
    let sub_candidate = res_dir.join("binaries").join(if cfg!(windows) { "syncthing.exe" } else { "syncthing" });
    if sub_candidate.exists() {
      return Ok(sub_candidate);
    }
  }

  // 3. Development binaries directory
  let dev_bin_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries");
  if dev_bin_dir.exists() {
    if let Ok(entries) = fs::read_dir(&dev_bin_dir) {
      for entry in entries.flatten() {
        let p = entry.path();
        if let Some(file_name) = p.file_name().and_then(|f| f.to_str()) {
          if file_name.starts_with("syncthing-") {
            let is_match = if cfg!(target_os = "macos") {
              file_name.contains("apple-darwin")
            } else if cfg!(target_os = "windows") {
              file_name.contains("windows") && file_name.ends_with(".exe")
            } else {
              file_name.contains("linux")
            };
            if is_match && p.is_file() {
              return Ok(p);
            }
          }
        }
      }
    }
  }

  // 4. Fallback: check system PATH (Requirement 9)
  let fallback_name = if cfg!(windows) { "syncthing.exe" } else { "syncthing" };
  if let Ok(output) = Command::new(fallback_name).arg("--version").output() {
    if output.status.success() {
      return Ok(PathBuf::from(fallback_name));
    }
  }

  Err("Bundled Syncthing binary not found. Run 'pnpm prepare:syncthing' to fetch it.".to_string())
}

pub fn strip_default_folder_from_config(config_path: &Path) {
  if !config_path.exists() {
    return;
  }
  let Ok(xml) = fs::read_to_string(config_path) else {
    return;
  };

  // Strip any `<folder id="default"` or non-vault folder template if present
  let mut modified = false;
  let mut clean_xml = xml;
  while let Some(start) = clean_xml.find("<folder id=\"default\"") {
    if let Some(end) = clean_xml[start..].find("</folder>") {
      clean_xml.replace_range(start..start + end + 9, "");
      modified = true;
    } else {
      break;
    }
  }

  if modified {
    let _ = fs::write(config_path, clean_xml);
  }
}

pub fn write_pid_file(home_dir: &Path, pid: u32, port: u16) -> std::io::Result<()> {
  let pid_path = home_dir.join(PID_FILE_NAME);
  fs::write(pid_path, format!("{}:{}", pid, port))
}

pub fn read_pid_file(home_dir: &Path) -> Option<(u32, u16)> {
  let pid_path = home_dir.join(PID_FILE_NAME);
  if !pid_path.exists() {
    return None;
  }
  let content = fs::read_to_string(pid_path).ok()?;
  let parts: Vec<&str> = content.trim().split(':').collect();
  if parts.len() == 2 {
    let pid: u32 = parts[0].parse().ok()?;
    let port: u16 = parts[1].parse().ok()?;
    Some((pid, port))
  } else {
    None
  }
}

pub fn remove_pid_file(home_dir: &Path) {
  let pid_path = home_dir.join(PID_FILE_NAME);
  let _ = fs::remove_file(pid_path);
}

pub fn is_pid_running(pid: u32) -> bool {
  if cfg!(unix) {
    let status = Command::new("kill")
      .args(["-0", &pid.to_string()])
      .stdout(Stdio::null())
      .stderr(Stdio::null())
      .status();
    matches!(status, Ok(s) if s.success())
  } else if cfg!(windows) {
    let status = Command::new("cmd")
      .args(["/C", &format!("tasklist /FI \"PID eq {}\" | findstr {}", pid, pid)])
      .stdout(Stdio::null())
      .stderr(Stdio::null())
      .status();
    matches!(status, Ok(s) if s.success())
  } else {
    false
  }
}

pub fn kill_pid_forcefully(pid: u32) {
  if cfg!(unix) {
    let _ = Command::new("kill")
      .args(["-TERM", &pid.to_string()])
      .output();
    std::thread::sleep(std::time::Duration::from_millis(200));
    if is_pid_running(pid) {
      let _ = Command::new("kill")
        .args(["-KILL", &pid.to_string()])
        .output();
    }
  } else if cfg!(windows) {
    let _ = Command::new("taskkill")
      .args(["/F", "/PID", &pid.to_string()])
      .output();
  }
}

pub fn spawn_syncthing_process(
  bin_path: &Path,
  home_dir: &Path,
  port: u16,
  api_key: &str,
) -> Result<Child, String> {
  // Ensure config directory exists
  fs::create_dir_all(home_dir)
    .map_err(|e| format!("Failed to create Syncthing home directory: {e}"))?;

  // Ensure default folder is stripped from config.xml if present
  let config_file = home_dir.join("config.xml");
  strip_default_folder_from_config(&config_file);

  let mut cmd = Command::new(bin_path);
  cmd
    .arg("serve")
    .arg(format!("--home={}", home_dir.to_string_lossy()))
    .arg(format!("--gui-address=http://127.0.0.1:{}", port))
    .arg(format!("--gui-apikey={}", api_key))
    .arg("--no-browser")
    .arg("--no-upgrade")
    .arg("--no-restart")
    .arg("--log-file=-")
    .env("STNORESTART", "1")
    .env("STNOUPGRADE", "1")
    .stdin(Stdio::null())
    .stdout(Stdio::piped())
    .stderr(Stdio::piped());

  #[cfg(windows)]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
  }

  let child = cmd
    .spawn()
    .map_err(|e| format!("Failed to spawn Syncthing process: {e}"))?;

  #[cfg(windows)]
  attach_job_object_kill_on_close(&child);

  Ok(child)
}

#[cfg(windows)]
fn attach_job_object_kill_on_close(child: &Child) {
  use std::os::windows::io::AsRawHandle;
  type Handle = *mut std::ffi::c_void;

  #[repr(C)]
  struct JobBasicLimit {
    user_time: i64, job_time: i64, flags: u32, min_ws: usize, max_ws: usize,
    procs: u32, affinity: usize, priority: u32, sched: u32,
  }
  #[repr(C)]
  struct JobExtendedLimit {
    basic: JobBasicLimit, io: [u64; 6], proc_mem: usize, job_mem: usize,
    peak_proc_mem: usize, peak_job_mem: usize,
  }

  extern "system" {
    fn CreateJobObjectW(attrs: *mut std::ffi::c_void, name: *const u16) -> Handle;
    fn SetInformationJobObject(h: Handle, class: u32, info: *const std::ffi::c_void, len: u32) -> i32;
    fn AssignProcessToJobObject(h_job: Handle, h_proc: Handle) -> i32;
  }

  unsafe {
    let job = CreateJobObjectW(std::ptr::null_mut(), std::ptr::null());
    if !job.is_null() {
      let mut info: JobExtendedLimit = std::mem::zeroed();
      info.basic.flags = 0x00002000; // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
      SetInformationJobObject(job, 9, &info as *const _ as *const _, std::mem::size_of::<JobExtendedLimit>() as u32);
      AssignProcessToJobObject(job, child.as_raw_handle() as Handle);
    }
  }
}
