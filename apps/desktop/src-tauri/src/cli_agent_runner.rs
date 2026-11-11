use std::{
  collections::HashMap,
  io::{BufRead, BufReader},
  path::Path,
  process::{Command, Stdio},
  sync::Mutex,
  thread,
};
use tauri::{Emitter, WebviewWindow};

use crate::cli_agent_detector::resolve_binary_path;
use crate::cli_agent_types::{CliAgentId, CliAgentStreamEvent};

static ACTIVE_CLI_SESSIONS: Mutex<Option<HashMap<String, u32>>> = Mutex::new(None);

fn with_sessions<F, R>(f: F) -> R
where
  F: FnOnce(&mut HashMap<String, u32>) -> R,
{
  let mut guard = ACTIVE_CLI_SESSIONS.lock().unwrap();
  let map = guard.get_or_insert_with(HashMap::new);
  f(map)
}

pub fn start_session(
  window: WebviewWindow,
  session_id: String,
  agent_id_str: String,
  prompt: String,
  vault_path: String,
) -> Result<(), String> {
  let agent_id = CliAgentId::from_str(&agent_id_str)
    .ok_or_else(|| format!("Unknown CLI agent: {agent_id_str}"))?;

  let bin_path = resolve_binary_path(agent_id.default_binary())
    .ok_or_else(|| format!("CLI agent binary not found: {}", agent_id.default_binary()))?;

  let vault_dir = Path::new(&vault_path);
  if !vault_dir.is_dir() {
    return Err(format!("Invalid vault path: {vault_path}"));
  }

  let args = build_agent_args(&agent_id, &prompt);

  let mut path_env = std::env::var("PATH").unwrap_or_default();
  let extra_paths = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  for p in extra_paths {
    if !path_env.contains(p) {
      path_env = format!("{p}:{path_env}");
    }
  }
  if let Ok(home) = std::env::var("HOME") {
    let local_bin = format!("{home}/.local/bin");
    let cargo_bin = format!("{home}/.cargo/bin");
    let npm_bin = format!("{home}/.npm-global/bin");
    if !path_env.contains(&local_bin) {
      path_env = format!("{local_bin}:{path_env}");
    }
    if !path_env.contains(&cargo_bin) {
      path_env = format!("{cargo_bin}:{path_env}");
    }
    if !path_env.contains(&npm_bin) {
      path_env = format!("{npm_bin}:{path_env}");
    }
  }

  let mut child = Command::new(&bin_path)
    .args(&args)
    .env("PATH", path_env)
    .current_dir(vault_dir)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|e| format!("Failed to spawn {}: {e}", agent_id.as_str()))?;

  let pid = child.id();
  with_sessions(|m| {
    m.insert(session_id.clone(), pid);
  });

  let stdout = child.stdout.take();
  let stderr = child.stderr.take();
  let session_id_clone = session_id.clone();
  let window_clone = window.clone();

  thread::spawn(move || {
    if let Some(out) = stdout {
      let reader = BufReader::new(out);
      for line in reader.lines().map_while(Result::ok) {
        let kind = classify_line(&line);
        let event = CliAgentStreamEvent {
          session_id: session_id_clone.clone(),
          kind: kind.to_string(),
          content: line,
        };
        let _ = window_clone.emit("cli-agent-stream", event);
      }
    }

    if let Some(err) = stderr {
      let reader = BufReader::new(err);
      for raw_line in reader.lines().map_while(Result::ok) {
        let line = strip_ansi(&raw_line);
        let trimmed = line.trim();
        if !trimmed.is_empty() {
          let is_status = trimmed.starts_with('>') || trimmed.starts_with("✓");
          let event = CliAgentStreamEvent {
            session_id: session_id_clone.clone(),
            kind: if is_status { "thought".to_string() } else { "error".to_string() },
            content: trimmed.to_string(),
          };
          let _ = window_clone.emit("cli-agent-stream", event);
        }
      }
    }

    let status = child.wait();
    with_sessions(|m| {
      m.remove(&session_id_clone);
    });

    let exit_success = status.map(|s| s.success()).unwrap_or(false);
    let done_event = CliAgentStreamEvent {
      session_id: session_id_clone,
      kind: if exit_success { "done".to_string() } else { "error".to_string() },
      content: if exit_success { "Execution completed.".to_string() } else { "Process exited with error.".to_string() },
    };
    let _ = window_clone.emit("cli-agent-stream", done_event);
  });

  Ok(())
}

pub fn cancel_session(session_id: &str) -> Result<(), String> {
  let pid = with_sessions(|m| m.remove(session_id));
  if let Some(pid) = pid {
    #[cfg(unix)]
    {
      let _ = Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .output();
    }
    #[cfg(windows)]
    {
      let _ = Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/F"])
        .output();
    }
    Ok(())
  } else {
    Ok(()) // Process already finished
  }
}

fn strip_ansi(input: &str) -> String {
  let mut out = String::with_capacity(input.len());
  let mut chars = input.chars().peekable();
  while let Some(c) = chars.next() {
    if c == '\x1b' {
      if chars.peek() == Some(&'[') {
        chars.next();
        for ch in chars.by_ref() {
          if ch.is_ascii_alphabetic() {
            break;
          }
        }
      }
    } else {
      out.push(c);
    }
  }
  out
}

fn build_agent_args(agent_id: &CliAgentId, prompt: &str) -> Vec<String> {
  match agent_id {
    CliAgentId::Agy => vec!["-p".to_string(), prompt.to_string()],
    CliAgentId::Claude => vec![
      "-p".to_string(),
      prompt.to_string(),
      "--dangerously-skip-permissions".to_string(),
    ],
    CliAgentId::Codex => vec![
      "exec".to_string(),
      "--dangerously-bypass-approvals-and-sandbox".to_string(),
      prompt.to_string(),
    ],
    CliAgentId::OpenCode => vec![
      "run".to_string(),
      "--auto".to_string(),
      prompt.to_string(),
    ],
  }
}

fn classify_line(line: &str) -> &'static str {
  let trimmed = line.trim();
  if trimmed.starts_with('{') && (trimmed.contains("\"type\"") || trimmed.contains("\"thought\"")) {
    "thought"
  } else if trimmed.starts_with("Thinking")
    || trimmed.starts_with("⚡")
    || trimmed.starts_with("[thought]")
    || trimmed.starts_with("Thought:")
    || trimmed.starts_with("Reasoning:")
    || trimmed.starts_with("Plan:")
    || trimmed.starts_with("[plan]")
  {
    "thought"
  } else if trimmed.starts_with("Writing")
    || trimmed.starts_with("Creating")
    || trimmed.starts_with("Moving")
    || trimmed.starts_with("Deleting")
    || trimmed.starts_with("Searching")
    || trimmed.starts_with("Running")
    || trimmed.starts_with("diff")
    || trimmed.starts_with("Tool:")
    || trimmed.starts_with("[action]")
  {
    "action"
  } else {
    "text"
  }
}
