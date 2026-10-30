use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingDetectResult {
  pub running: bool,
  pub version: String,
  #[serde(rename = "guiAddress")]
  pub gui_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingStatusResult {
  #[serde(rename = "deviceId")]
  pub device_id: String,
  #[serde(rename = "deviceName")]
  pub device_name: String,
  pub uptime: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingPendingDevice {
  #[serde(rename = "deviceId")]
  pub device_id: String,
  pub name: String,
  pub address: String,
  pub time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingConfiguredDevice {
  #[serde(rename = "deviceId")]
  pub device_id: String,
  pub name: String,
  pub connected: bool,
  pub paused: bool,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub address: Option<String>,
  #[serde(rename = "lastSeen", skip_serializing_if = "Option::is_none")]
  pub last_seen: Option<String>,
  #[serde(rename = "isVaultShared")]
  pub is_vault_shared: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingPendingFolder {
  #[serde(rename = "folderId")]
  pub folder_id: String,
  pub label: String,
  #[serde(rename = "offeredBy")]
  pub offered_by: String,
  pub time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingSharedVault {
  #[serde(rename = "folderId")]
  pub folder_id: String,
  pub label: String,
  pub path: String,
  #[serde(rename = "sharedWithDeviceIds")]
  pub shared_with_device_ids: Vec<String>,
  pub paused: bool,
  #[serde(rename = "isActiveVault")]
  pub is_active_vault: bool,
  #[serde(rename = "syncState", skip_serializing_if = "Option::is_none")]
  pub sync_state: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum SyncthingLifecycleState {
  Starting,
  Running,
  Stopped,
  Crashed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SyncthingLifecycleStatus {
  pub state: SyncthingLifecycleState,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reason: Option<String>,
  #[serde(rename = "guiAddress", skip_serializing_if = "Option::is_none")]
  pub gui_address: Option<String>,
  #[serde(rename = "deviceId", skip_serializing_if = "Option::is_none")]
  pub device_id: Option<String>,
  #[serde(rename = "deviceName", skip_serializing_if = "Option::is_none")]
  pub device_name: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub version: Option<String>,
  #[serde(rename = "lastLogs", skip_serializing_if = "Option::is_none")]
  pub last_logs: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SyncthingError {
  NotInstalled,
  NotRunning,
  BadKey,
  Unreachable(String),
  UnexpectedResponse(String),
  ForbiddenHost(String),
}

impl std::fmt::Display for SyncthingError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NotInstalled => write!(f, "NotInstalled"),
      Self::NotRunning => write!(f, "NotRunning"),
      Self::BadKey => write!(f, "BadKey"),
      Self::Unreachable(msg) => write!(f, "Unreachable: {}", msg),
      Self::UnexpectedResponse(msg) => write!(f, "UnexpectedResponse: {}", msg),
      Self::ForbiddenHost(msg) => write!(f, "ForbiddenHost: {}", msg),
    }
  }
}

impl std::error::Error for SyncthingError {}

impl Serialize for SyncthingError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    serializer.serialize_str(&self.to_string())
  }
}

impl<'de> Deserialize<'de> for SyncthingError {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: serde::Deserializer<'de>,
  {
    let s = String::deserialize(deserializer)?;
    match s.as_str() {
      "NotInstalled" => Ok(Self::NotInstalled),
      "NotRunning" => Ok(Self::NotRunning),
      "BadKey" => Ok(Self::BadKey),
      _ => {
        if let Some(msg) = s.strip_prefix("Unreachable: ") {
          Ok(Self::Unreachable(msg.to_string()))
        } else if let Some(msg) = s.strip_prefix("UnexpectedResponse: ") {
          Ok(Self::UnexpectedResponse(msg.to_string()))
        } else if let Some(msg) = s.strip_prefix("ForbiddenHost: ") {
          Ok(Self::ForbiddenHost(msg.to_string()))
        } else {
          Ok(Self::UnexpectedResponse(s))
        }
      }
    }
  }
}

pub fn redact_secrets(input: &str, known_key: Option<&str>) -> String {
  let mut sanitized = input.to_string();
  if let Some(k) = known_key {
    let trimmed = k.trim();
    if !trimmed.is_empty() {
      sanitized = sanitized.replace(trimmed, "[REDACTED]");
    }
  }
  sanitized
}

pub fn to_base64(bytes: &[u8]) -> String {
  const CHARS: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let mut result = String::with_capacity((bytes.len() + 2) / 3 * 4);
  for chunk in bytes.chunks(3) {
    let b0 = chunk[0] as usize;
    let b1 = chunk.get(1).copied().unwrap_or(0) as usize;
    let b2 = chunk.get(2).copied().unwrap_or(0) as usize;
    let n = (b0 << 16) | (b1 << 8) | b2;
    result.push(CHARS[(n >> 18) & 63] as char);
    result.push(CHARS[(n >> 12) & 63] as char);
    if chunk.len() > 1 {
      result.push(CHARS[(n >> 6) & 63] as char);
    } else {
      result.push('=');
    }
    if chunk.len() > 2 {
      result.push(CHARS[n & 63] as char);
    } else {
      result.push('=');
    }
  }
  result
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct SyncthingVaultFolderInfo {
  #[serde(rename = "folderId")]
  pub folder_id: String,
  #[serde(rename = "folderLabel")]
  pub folder_label: String,
}

pub fn percent_encode(s: &str) -> String {
  let mut encoded = String::with_capacity(s.len() * 3);
  for byte in s.bytes() {
    match byte {
      b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
        encoded.push(byte as char);
      }
      _ => {
        encoded.push_str(&format!("%{:02X}", byte));
      }
    }
  }
  encoded
}
