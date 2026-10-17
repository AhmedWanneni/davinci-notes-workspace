use std::path::PathBuf;

use super::types::{redact_secrets, SyncthingError};

const KEYCHAIN_SERVICE: &str = "com.davinci.notes.syncthing";
const KEYCHAIN_USER: &str = "api-key";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncthingResolvedConfig {
  pub base_url: String,
  pub gui_address: String,
  pub api_key: String,
}

pub fn get_default_config_paths() -> Vec<PathBuf> {
  let mut paths = Vec::new();

  #[cfg(target_os = "macos")]
  {
    if let Ok(home) = std::env::var("HOME") {
      paths.push(PathBuf::from(&home).join("Library/Application Support/Syncthing/config.xml"));
      paths.push(PathBuf::from(&home).join(".config/syncthing/config.xml"));
    }
  }

  #[cfg(target_os = "linux")]
  {
    if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
      paths.push(PathBuf::from(xdg).join("syncthing/config.xml"));
    }
    if let Ok(home) = std::env::var("HOME") {
      paths.push(PathBuf::from(&home).join(".config/syncthing/config.xml"));
      paths.push(PathBuf::from(&home).join(".syncthing/config.xml"));
    }
  }

  #[cfg(target_os = "windows")]
  {
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
      paths.push(PathBuf::from(local_app_data).join("Syncthing/config.xml"));
    }
    if let Ok(app_data) = std::env::var("APPDATA") {
      paths.push(PathBuf::from(app_data).join("Syncthing/config.xml"));
    }
  }

  paths
}

pub fn extract_xml_tag(xml: &str, tag: &str) -> Option<String> {
  let open = format!("<{}>", tag);
  let close = format!("</{}>", tag);
  let start = xml.find(&open)? + open.len();
  let end = xml[start..].find(&close)? + start;
  let val = xml[start..end].trim();
  if val.is_empty() {
    None
  } else {
    Some(val.to_string())
  }
}

pub fn parse_config_xml(content: &str) -> Result<(String, String, bool), SyncthingError> {
  let gui_start = content.find("<gui").ok_or(SyncthingError::NotInstalled)?;
  let gui_end = content[gui_start..]
    .find("</gui>")
    .map(|pos| gui_start + pos + 6)
    .unwrap_or(content.len());
  let gui_block = &content[gui_start..gui_end];

  let tls = gui_block.contains("tls=\"true\"")
    || extract_xml_tag(gui_block, "tls").as_deref() == Some("true");

  let address = extract_xml_tag(gui_block, "address")
    .unwrap_or_else(|| "127.0.0.1:8384".to_string());
  let api_key = extract_xml_tag(gui_block, "apikey").unwrap_or_default();

  Ok((address, api_key, tls))
}

pub fn validate_and_normalize_loopback(raw: &str, tls: bool) -> Result<(String, String), SyncthingError> {
  let trimmed = raw
    .trim()
    .trim_start_matches("http://")
    .trim_start_matches("https://");

  let (host, port) = if let Some(colon) = trimmed.rfind(':') {
    let h = &trimmed[..colon];
    let p_str = &trimmed[colon + 1..];
    let p: u16 = p_str.parse().map_err(|_| {
      SyncthingError::UnexpectedResponse(format!("Invalid port in address: {}", raw))
    })?;
    (h, p)
  } else {
    (trimmed, 8384)
  };

  let clean_host = host.trim_matches('[').trim_matches(']');
  let is_loopback = clean_host == "127.0.0.1"
    || clean_host.eq_ignore_ascii_case("localhost")
    || clean_host == "::1"
    || clean_host == "0.0.0.0"
    || clean_host == "::";

  if !is_loopback {
    return Err(SyncthingError::ForbiddenHost(format!(
      "Host '{}' is not a permitted local loopback address",
      redact_secrets(clean_host, None)
    )));
  }

  let normalized_host = if clean_host == "0.0.0.0" || clean_host == "::" {
    "127.0.0.1"
  } else {
    clean_host
  };

  let scheme = if tls { "https" } else { "http" };
  let gui_address = format!("{}:{}", clean_host, port);
  let base_url = format!("{}://{}:{}", scheme, normalized_host, port);

  Ok((gui_address, base_url))
}

pub fn load_keychain_key() -> Option<String> {
  let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_USER).ok()?;
  entry.get_password().ok()
}

pub fn resolve_local_syncthing_config() -> Result<SyncthingResolvedConfig, SyncthingError> {
  let candidate_paths = get_default_config_paths();
  let mut loaded_config: Option<(String, String, bool)> = None;

  for p in candidate_paths {
    if p.exists() {
      if let Ok(content) = std::fs::read_to_string(&p) {
        if let Ok(parsed) = parse_config_xml(&content) {
          loaded_config = Some(parsed);
          break;
        }
      }
    }
  }

  let (raw_address, mut api_key, tls) = match loaded_config {
    Some(cfg) => cfg,
    None => {
      let keychain_key = load_keychain_key();
      if let Some(key) = keychain_key {
        ("127.0.0.1:8384".to_string(), key, false)
      } else {
        return Err(SyncthingError::NotInstalled);
      }
    }
  };

  if api_key.is_empty() {
    if let Some(key) = load_keychain_key() {
      api_key = key;
    }
  }

  let (gui_address, base_url) = validate_and_normalize_loopback(&raw_address, tls)?;

  Ok(SyncthingResolvedConfig {
    base_url,
    gui_address,
    api_key,
  })
}
