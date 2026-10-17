use std::time::Duration;

use super::config::SyncthingResolvedConfig;
use super::types::{redact_secrets, to_base64, SyncthingDetectResult, SyncthingError, SyncthingStatusResult};

pub struct SyncthingClient {
  http: reqwest::Client,
  pub config: SyncthingResolvedConfig,
}

impl SyncthingClient {
  pub fn new(config: SyncthingResolvedConfig) -> Result<Self, SyncthingError> {
    let http = reqwest::Client::builder()
      .connect_timeout(Duration::from_millis(1500))
      .timeout(Duration::from_millis(2000))
      .danger_accept_invalid_certs(true)
      .build()
      .map_err(|err| {
        SyncthingError::UnexpectedResponse(redact_secrets(&err.to_string(), Some(&config.api_key)))
      })?;

    Ok(Self { http, config })
  }

  pub async fn detect(&self) -> Result<SyncthingDetectResult, SyncthingError> {
    let url = format!("{}/rest/system/version", self.config.base_url);
    let mut req = self.http.get(&url);
    if !self.config.api_key.is_empty() {
      req = req.header("X-API-Key", &self.config.api_key);
    }

    let resp = match req.send().await {
      Ok(r) => r,
      Err(err) => {
        if err.is_connect() || err.is_timeout() {
          return Err(SyncthingError::NotRunning);
        }
        return Err(SyncthingError::Unreachable(redact_secrets(
          &err.to_string(),
          Some(&self.config.api_key),
        )));
      }
    };

    if resp.status() == reqwest::StatusCode::FORBIDDEN || resp.status() == reqwest::StatusCode::UNAUTHORIZED {
      let health_url = format!("{}/rest/noauth/health", self.config.base_url);
      if let Ok(health_resp) = self.http.get(&health_url).send().await {
        if health_resp.status().is_success() {
          let version = health_resp
            .headers()
            .get("X-Syncthing-Version")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("unknown")
            .to_string();
          return Ok(SyncthingDetectResult {
            running: true,
            version,
            gui_address: self.config.gui_address.clone(),
          });
        }
      }
      return Err(SyncthingError::BadKey);
    }

    if !resp.status().is_success() {
      return Err(SyncthingError::UnexpectedResponse(format!(
        "HTTP status {}",
        resp.status()
      )));
    }

    let body = resp.text().await.map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let json: serde_json::Value = serde_json::from_str(&body).map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let version = json
      .get("version")
      .and_then(|v| v.as_str())
      .unwrap_or("unknown")
      .to_string();

    Ok(SyncthingDetectResult {
      running: true,
      version,
      gui_address: self.config.gui_address.clone(),
    })
  }

  pub async fn status(&self) -> Result<SyncthingStatusResult, SyncthingError> {
    if self.config.api_key.is_empty() {
      return Err(SyncthingError::BadKey);
    }

    let url = format!("{}/rest/system/status", self.config.base_url);
    let resp = match self
      .http
      .get(&url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
    {
      Ok(r) => r,
      Err(err) => {
        if err.is_connect() || err.is_timeout() {
          return Err(SyncthingError::NotRunning);
        }
        return Err(SyncthingError::Unreachable(redact_secrets(
          &err.to_string(),
          Some(&self.config.api_key),
        )));
      }
    };

    if resp.status() == reqwest::StatusCode::FORBIDDEN || resp.status() == reqwest::StatusCode::UNAUTHORIZED {
      return Err(SyncthingError::BadKey);
    }

    if !resp.status().is_success() {
      return Err(SyncthingError::UnexpectedResponse(format!(
        "HTTP status {}",
        resp.status()
      )));
    }

    let body = resp.text().await.map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let json: serde_json::Value = serde_json::from_str(&body).map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    let device_id = json
      .get("myID")
      .and_then(|v| v.as_str())
      .ok_or_else(|| SyncthingError::UnexpectedResponse("Missing myID field".to_string()))?
      .to_string();

    let uptime = json
      .get("uptime")
      .and_then(|v| v.as_u64())
      .unwrap_or(0);

    let mut device_name = String::new();
    let devices_url = format!("{}/rest/config/devices", self.config.base_url);
    if let Ok(dev_resp) = self
      .http
      .get(&devices_url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
    {
      if dev_resp.status().is_success() {
        if let Ok(dev_text) = dev_resp.text().await {
          if let Ok(dev_json) = serde_json::from_str::<serde_json::Value>(&dev_text) {
            if let Some(list) = dev_json.as_array() {
              for d in list {
                if d.get("deviceID").and_then(|v| v.as_str()) == Some(&device_id) {
                  if let Some(name) = d.get("name").and_then(|v| v.as_str()) {
                    device_name = name.to_string();
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }

    if device_name.is_empty() {
      device_name = "Local Device".to_string();
    }

    Ok(SyncthingStatusResult {
      device_id,
      device_name,
      uptime,
    })
  }

  pub async fn qr_png(&self) -> Result<String, SyncthingError> {
    let stat = self.status().await?;
    let url = format!("{}/qr/?text={}", self.config.base_url, stat.device_id);

    let resp = match self
      .http
      .get(&url)
      .header("X-API-Key", &self.config.api_key)
      .send()
      .await
    {
      Ok(r) => r,
      Err(err) => {
        if err.is_connect() || err.is_timeout() {
          return Err(SyncthingError::NotRunning);
        }
        return Err(SyncthingError::Unreachable(redact_secrets(
          &err.to_string(),
          Some(&self.config.api_key),
        )));
      }
    };

    if resp.status() == reqwest::StatusCode::FORBIDDEN || resp.status() == reqwest::StatusCode::UNAUTHORIZED {
      return Err(SyncthingError::BadKey);
    }

    if !resp.status().is_success() {
      return Err(SyncthingError::UnexpectedResponse(format!(
        "HTTP status {}",
        resp.status()
      )));
    }

    let bytes = resp.bytes().await.map_err(|e| {
      SyncthingError::UnexpectedResponse(redact_secrets(&e.to_string(), Some(&self.config.api_key)))
    })?;

    Ok(format!("data:image/png;base64,{}", to_base64(&bytes)))
  }
}
