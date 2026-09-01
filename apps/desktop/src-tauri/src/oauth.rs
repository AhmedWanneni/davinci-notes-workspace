use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::{
  io::{Read, Write},
  net::{TcpListener, TcpStream},
  process::Command,
  sync::Mutex,
  time::Duration,
};
use tauri::State;

const SERVICE: &str = "com.davinci.notes.drive-oauth";
const ACCOUNT: &str = "default";

#[derive(Default)]
pub struct OAuthListenerState(pub Mutex<Option<TcpListener>>);

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthCallback {
  pub code: String,
  pub state: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoopbackEndpoint {
  pub port: u16,
  pub redirect_uri: String,
}

#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), String> {
  if !url.starts_with("https://accounts.google.com/") {
    return Err("refusing to open an unexpected authorization URL".to_string());
  }
  tauri::async_runtime::spawn_blocking(move || {
    #[cfg(target_os = "macos")]
    let result = Command::new("open").arg(&url).spawn();
    #[cfg(target_os = "windows")]
    let result = Command::new("cmd").args(["/C", "start", "", &url]).spawn();
    #[cfg(all(unix, not(target_os = "macos")))]
    let result = Command::new("xdg-open").arg(&url).spawn();
    result.map(|_| ()).map_err(|error| format!("could not open browser: {error}"))
  }).await.map_err(|error| format!("browser launch task failed: {error}"))?
}

#[tauri::command]
pub fn start_oauth_listener(state: State<'_, OAuthListenerState>) -> Result<LoopbackEndpoint, String> {
  let listener = TcpListener::bind(("127.0.0.1", 0)).map_err(|error| error.to_string())?;
  let port = listener.local_addr().map_err(|error| error.to_string())?.port();
  listener.set_nonblocking(false).map_err(|error| error.to_string())?;
  *state.0.lock().map_err(|_| "oauth listener lock poisoned")? = Some(listener);
  Ok(LoopbackEndpoint { port, redirect_uri: format!("http://127.0.0.1:{port}") })
}

#[tauri::command]
pub async fn wait_for_oauth_callback(state: State<'_, OAuthListenerState>) -> Result<OAuthCallback, String> {
  let listener = state.0.lock().map_err(|_| "oauth listener lock poisoned")?.take()
    .ok_or_else(|| "oauth listener is not started".to_string())?;
  tauri::async_runtime::spawn_blocking(move || {
    let (mut stream, _) = listener.accept().map_err(|error| error.to_string())?;
    stream.set_read_timeout(Some(Duration::from_secs(30))).map_err(|error| error.to_string())?;
    let request = read_request(&mut stream)?;
    let callback = parse_callback(&request)?;
    let _ = stream.write_all(b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nSign-in complete. You can return to DaVinci Notes.");
    Ok(callback)
  }).await.map_err(|error| format!("oauth callback task failed: {error}"))?
}

fn read_request(stream: &mut TcpStream) -> Result<String, String> {
  let mut bytes = [0_u8; 8192];
  let count = stream.read(&mut bytes).map_err(|error| error.to_string())?;
  String::from_utf8(bytes[..count].to_vec()).map_err(|error| error.to_string())
}

fn parse_callback(request: &str) -> Result<OAuthCallback, String> {
  let target = request.lines().next().and_then(|line| line.split_whitespace().nth(1))
    .ok_or_else(|| "invalid oauth callback request".to_string())?;
  if !target.starts_with("/?") && target != "/" {
    return Err("invalid oauth callback path".to_string());
  }
  let query = target.split_once('?').map(|(_, value)| value).unwrap_or_default();
  let mut code = None;
  let mut state = None;
  for pair in query.split('&') {
    let (key, value) = pair.split_once('=').unwrap_or((pair, ""));
    let value = percent_decode(value)?;
    match key {
      "code" => code = Some(value.to_string()),
      "state" => state = Some(value.to_string()),
      "error" => return Err(format!("google oauth error: {value}")),
      _ => {}
    }
  }
  Ok(OAuthCallback { code: code.ok_or_else(|| "oauth callback did not contain a code".to_string())?, state })
}

fn percent_decode(value: &str) -> Result<String, String> {
  let mut bytes = Vec::with_capacity(value.len());
  let mut chars = value.as_bytes().iter().copied();
  while let Some(byte) = chars.next() {
    if byte == b'%' {
      let high = chars.next().and_then(|value| (value as char).to_digit(16));
      let low = chars.next().and_then(|value| (value as char).to_digit(16));
      let (Some(high), Some(low)) = (high, low) else { return Err("invalid oauth callback encoding".to_string()); };
      bytes.push((high * 16 + low) as u8);
    } else if byte == b'+' {
      bytes.push(b' ');
    } else {
      bytes.push(byte);
    }
  }
  String::from_utf8(bytes).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
  use super::parse_callback;

  #[test]
  fn accepts_google_desktop_loopback_root() {
    let callback = parse_callback("GET /?code=abc%20123&state=xyz HTTP/1.1").unwrap();
    assert_eq!(callback.code, "abc 123");
    assert_eq!(callback.state.as_deref(), Some("xyz"));
  }

  #[test]
  fn rejects_non_root_callback_path() {
    assert!(parse_callback("GET /oauth/callback?code=abc HTTP/1.1").is_err());
  }
}

#[tauri::command]
pub fn save_drive_token(token: String) -> Result<(), String> {
  Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())?
    .set_password(&token).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn load_drive_token() -> Result<Option<String>, String> {
  match Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())?.get_password() {
    Ok(token) => Ok(Some(token)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
pub fn clear_drive_token() -> Result<(), String> {
  match Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())?.delete_credential() {
    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(error.to_string()),
  }
}
