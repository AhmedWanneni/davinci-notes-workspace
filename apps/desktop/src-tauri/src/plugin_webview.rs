use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

pub const PLUGIN_WEBVIEW_LABEL: &str = "plugin-runner";
const RPC_EVENT: &str = "davinci-plugin-rpc";
pub const HOST_REQUEST_EVENT: &str = "davinci-plugin-host-request";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginMessage {
  pub protocol: u8,
  pub session_id: String,
  pub request_id: String,
  pub kind: String,
  pub method: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub params: Option<Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub result: Option<Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error: Option<PluginMessageError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMessageError {
  pub code: String,
  pub message: String,
}

#[derive(Default)]
pub struct PluginProbeState(pub Mutex<Option<PluginMessage>>);

pub fn create_plugin_webview(app: &AppHandle) -> Result<(), String> {
  if app.get_webview_window(PLUGIN_WEBVIEW_LABEL).is_some() {
    println!("[plugin-rpc] plugin-runner already exists");
    return Ok(());
  }

  WebviewWindowBuilder::new(
    app,
    PLUGIN_WEBVIEW_LABEL,
    WebviewUrl::App("plugin-runner.html".into()),
  )
  .title("DaVinci Notes plugin runner")
  .visible(false)
  .initialization_script(concat!(
    include_str!("plugin_webview_security.js"),
    "\n",
    include_str!("plugin_webview_bootstrap.js"),
  ))
  .build()
  .map(|_| println!("[plugin-rpc] created plugin-runner"))
  .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn start_plugin_webview_probe(app: AppHandle) -> Result<(), String> {
  create_plugin_webview(&app)
}

#[tauri::command]
pub fn ensure_plugin_webview(app: AppHandle) -> Result<(), String> {
  create_plugin_webview(&app)
}

#[tauri::command]
pub fn plugin_webview_exists(app: AppHandle) -> bool {
  app.get_webview_window(PLUGIN_WEBVIEW_LABEL).is_some()
}

#[tauri::command]
pub fn plugin_webview_booted(window: WebviewWindow) -> Result<(), String> {
  if window.label() != PLUGIN_WEBVIEW_LABEL {
    return Err("plugin runner bootstrap must originate from plugin-runner".to_string());
  }
  println!("[plugin-rpc] plugin-runner bootstrap loaded");
  Ok(())
}

#[tauri::command]
pub fn plugin_webview_script_error(window: WebviewWindow, message: String) -> Result<(), String> {
  if window.label() != PLUGIN_WEBVIEW_LABEL {
    return Err("plugin runner error must originate from plugin-runner".to_string());
  }
  println!("[plugin-rpc] plugin-runner bootstrap error: {message}");
  Ok(())
}

#[tauri::command]
pub fn plugin_webview_listening(window: WebviewWindow) -> Result<(), String> {
  if window.label() != PLUGIN_WEBVIEW_LABEL {
    return Err("plugin runner listener must originate from plugin-runner".to_string());
  }

  let message = PluginMessage {
    protocol: 1,
    session_id: "scaffold-session".to_string(),
    request_id: "scaffold-ping-1".to_string(),
    kind: "request".to_string(),
    method: "ping".to_string(),
    params: Some(serde_json::json!({ "source": "main" })),
    result: None,
    error: None,
  };
  println!("[plugin-rpc] main -> plugin-runner: {message:?}");
  window.emit(RPC_EVENT, message).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn start_plugin_webview_synthetic_probe(window: WebviewWindow) -> Result<(), String> {
  if window.label() != "main" {
    return Err("synthetic plugin RPC probe must originate from main".to_string());
  }
  if std::env::var_os("DAVINCI_PLUGIN_RPC_SYNTHETIC").is_some() {
    let synthetic = PluginMessage {
      protocol: 1,
      session_id: "scaffold-session".to_string(),
      request_id: "scaffold-synthetic-1".to_string(),
      kind: "request".to_string(),
      method: "synthetic.start".to_string(),
      params: Some(serde_json::json!({
        "single": "plugin-rpc-probe/single.md",
        "concurrent": [
          "plugin-rpc-probe/a.md",
          "plugin-rpc-probe/b.md",
          "plugin-rpc-probe/c.md"
        ]
      })),
      result: None,
      error: None,
    };
    println!("[plugin-rpc] main -> plugin-runner: synthetic.start");
    let runner = window
      .app_handle()
      .get_webview_window(PLUGIN_WEBVIEW_LABEL)
      .ok_or_else(|| "plugin-runner webview is not open".to_string())?;
    runner.emit(RPC_EVENT, synthetic).map_err(|error| error.to_string())?;
  }
  Ok(())
}

#[tauri::command]
pub fn plugin_webview_send(
  window: WebviewWindow,
  message: PluginMessage,
) -> Result<(), String> {
  if window.label() != "main" {
    return Err("host RPC sends must originate from main".to_string());
  }
  let runner = window
    .app_handle()
    .get_webview_window(PLUGIN_WEBVIEW_LABEL)
    .ok_or_else(|| "plugin-runner webview is not open".to_string())?;
  println!("[plugin-rpc] main -> plugin-runner: {message:?}");
  runner.emit(RPC_EVENT, message).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn plugin_webview_request(
  app: AppHandle,
  window: WebviewWindow,
  message: PluginMessage,
) -> Result<(), String> {
  if window.label() != PLUGIN_WEBVIEW_LABEL {
    return Err("plugin RPC requests must originate from plugin-runner".to_string());
  }
  if message.method == "probe.result" {
    if let Some(params) = &message.params {
      println!("[plugin-security-probe] {params}");
    }
  }
  println!("[plugin-rpc] plugin-runner -> host request: {message:?}");
  app.emit(HOST_REQUEST_EVENT, message).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn plugin_webview_response(
  app: AppHandle,
  window: WebviewWindow,
  message: PluginMessage,
) -> Result<(), String> {
  if window.label() != PLUGIN_WEBVIEW_LABEL {
    return Err("plugin runner response must originate from plugin-runner".to_string());
  }
  if message.protocol != 1 || message.kind != "response" {
    return Err("invalid plugin RPC scaffold response".to_string());
  }
  println!("[plugin-rpc] plugin-runner -> main: {message:?}");
  *app.state::<PluginProbeState>().0.lock().map_err(|_| "plugin probe lock poisoned")? = Some(message.clone());
  app.emit("davinci-plugin-rpc-response", message).map_err(|error| error.to_string())?;
  Ok(())
}
