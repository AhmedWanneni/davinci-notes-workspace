use std::collections::HashMap;

use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use tauri::{State, WebviewWindow};

use crate::command_auth::reject_plugin_runner;

const MAX_RESPONSE_BYTES: usize = 1_048_576;

pub struct PluginNetworkClient(pub Client);

impl PluginNetworkClient {
    pub fn new() -> Result<Self, String> {
        Client::builder()
            .redirect(reqwest::redirect::Policy::limited(5))
            .build()
            .map(Self)
            .map_err(|error| format!("Could not initialize plugin network client: {error}"))
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginNetworkRequest {
    url: String,
    method: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginNetworkResponse {
    ok: bool,
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body: String,
}

#[tauri::command]
pub async fn plugin_network_request(
    window: WebviewWindow,
    client: State<'_, PluginNetworkClient>,
    request: PluginNetworkRequest,
) -> Result<PluginNetworkResponse, String> {
    reject_plugin_runner(&window)?;
    let url = reqwest::Url::parse(&request.url)
        .map_err(|error| format!("Invalid network URL: {error}"))?;
    if !matches!(url.scheme(), "http" | "https") {
        return Err("Plugin network requests require an http: or https: URL".to_string());
    }
    let method = Method::from_bytes(request.method.as_bytes())
        .map_err(|error| format!("Invalid network method: {error}"))?;
    let mut builder = client.0.request(method, url);
    if let Some(headers) = request.headers {
        for (name, value) in headers {
            builder = builder.header(name, value);
        }
    }
    if let Some(body) = request.body {
        builder = builder.body(body);
    }
    let response = builder
        .send()
        .await
        .map_err(|error| format!("Network request failed: {error}"))?;
    if response
        .content_length()
        .is_some_and(|length| length > MAX_RESPONSE_BYTES as u64)
    {
        return Err(format!(
            "Plugin network response exceeds {MAX_RESPONSE_BYTES} byte limit"
        ));
    }
    let status = response.status();
    let headers = response
        .headers()
        .iter()
        .filter_map(|(name, value)| {
            value
                .to_str()
                .ok()
                .map(|value| (name.to_string(), value.to_string()))
        })
        .collect();
    let body = response
        .bytes()
        .await
        .map_err(|error| format!("Could not read network response: {error}"))?;
    if body.len() > MAX_RESPONSE_BYTES {
        return Err(format!(
            "Plugin network response exceeds {MAX_RESPONSE_BYTES} byte limit"
        ));
    }
    Ok(PluginNetworkResponse {
        ok: status.is_success(),
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or_default().to_string(),
        headers,
        body: String::from_utf8_lossy(&body).into_owned(),
    })
}
