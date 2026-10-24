//! Attachment download and SSRF validation for Web Clipper (Phase 6).

use std::net::{IpAddr, ToSocketAddrs};
use std::time::Duration;
use reqwest::Url;
use tauri::WebviewWindow;

use crate::command_auth::reject_plugin_runner;

pub const MAX_ATTACHMENT_BYTES: usize = 1_048_576; // 1 MiB

/// Validates whether an IP address belongs to a private, loopback, link-local, or special range.
pub fn is_disallowed_ip(ip: &IpAddr) -> Result<(), &'static str> {
  let ipv4 = match ip {
    IpAddr::V4(v4) => *v4,
    IpAddr::V6(v6) => {
      if let Some(mapped) = v6.to_ipv4_mapped() {
        mapped
      } else {
        if v6.is_loopback() {
          return Err("loopback address disallowed");
        }
        if v6.is_unspecified() {
          return Err("unspecified address disallowed");
        }
        if v6.is_multicast() {
          return Err("multicast address disallowed");
        }
        let segments = v6.segments();
        if (segments[0] & 0xffc0) == 0xfe80 {
          return Err("link-local address disallowed");
        }
        if (segments[0] & 0xfe00) == 0xfc00 {
          return Err("private network address disallowed");
        }
        return Ok(());
      }
    }
  };

  if ipv4.is_loopback() {
    return Err("loopback address disallowed");
  }
  if ipv4.is_unspecified() || ipv4.is_broadcast() || ipv4.is_multicast() {
    return Err("special address disallowed");
  }
  let octets = ipv4.octets();
  if octets[0] == 10 {
    return Err("private network address disallowed");
  }
  if octets[0] == 172 && (16..=31).contains(&octets[1]) {
    return Err("private network address disallowed");
  }
  if octets[0] == 192 && octets[1] == 168 {
    return Err("private network address disallowed");
  }
  if octets[0] == 169 && octets[1] == 254 {
    return Err("link-local address disallowed");
  }
  if octets[0] == 100 && (64..=127).contains(&octets[1]) {
    return Err("carrier-grade NAT address disallowed");
  }

  Ok(())
}

/// Strict SSRF verification for clipper image URLs.
pub fn validate_attachment_url(url: &Url) -> Result<(), String> {
  if !matches!(url.scheme(), "http" | "https") {
    return Err(format!("Disallowed scheme: {}", url.scheme()));
  }

  let host_str = url.host_str().ok_or_else(|| "URL has no host".to_string())?;
  let clean_host = host_str.trim_start_matches('[').trim_end_matches(']');

  if let Ok(ip) = clean_host.parse::<IpAddr>() {
    is_disallowed_ip(&ip).map_err(|reason| format!("SSRF protection: {reason}"))?;
  } else {
    let lower_host = clean_host.to_ascii_lowercase();
    if lower_host == "localhost" || lower_host.ends_with(".localhost") || lower_host.ends_with(".local") {
      return Err("SSRF protection: localhost is disallowed".to_string());
    }
    let port = url.port_or_known_default().unwrap_or(80);
    if let Ok(addrs) = (clean_host, port).to_socket_addrs() {
      for addr in addrs {
        is_disallowed_ip(&addr.ip()).map_err(|reason| format!("SSRF protection: {reason}"))?;
      }
    }
  }

  Ok(())
}

/// Validates image payload headers and magic bytes to reject HTML, active content, and corrupted data.
pub fn validate_image_content(content_type: Option<&str>, bytes: &[u8]) -> Result<(), String> {
  if bytes.is_empty() {
    return Err("Image response is empty".to_string());
  }

  let sample_len = bytes.len().min(512);
  let sample = &bytes[..sample_len];
  let sample_str = String::from_utf8_lossy(sample).to_ascii_lowercase();
  let trimmed = sample_str.trim_start();

  if trimmed.starts_with("<!doctype")
    || trimmed.starts_with("<html")
    || trimmed.starts_with("<head")
    || trimmed.starts_with("<body")
    || sample_str.contains("<script")
  {
    return Err("Response is HTML or script, not an image".to_string());
  }

  if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) {
    return Ok(()); // PNG
  }
  if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
    return Ok(()); // JPEG
  }
  if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
    return Ok(()); // GIF
  }
  if bytes.len() >= 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
    return Ok(()); // WebP
  }
  if bytes.starts_with(b"BM") {
    return Ok(()); // BMP
  }
  if bytes.starts_with(&[0x00, 0x00, 0x01, 0x00]) {
    return Ok(()); // ICO
  }
  if (trimmed.starts_with("<svg") || (trimmed.starts_with("<?xml") && sample_str.contains("<svg")))
    && !sample_str.contains("<script")
  {
    return Ok(()); // SVG
  }

  let _ = content_type;
  Err("Unsupported or invalid image content format".to_string())
}

/// Tauri command to fetch an image attachment with SSRF and size bounds.
#[tauri::command]
pub async fn clipper_fetch_attachment(
  window: WebviewWindow,
  url: String,
) -> Result<Vec<u8>, String> {
  reject_plugin_runner(&window)?;

  let parsed_url = Url::parse(&url).map_err(|error| format!("Invalid URL: {error}"))?;
  validate_attachment_url(&parsed_url)?;

  let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(10))
    .redirect(reqwest::redirect::Policy::custom(|attempt| {
      if attempt.previous().len() >= 5 {
        return attempt.error("Too many redirects (max 5)");
      }
      if let Err(error) = validate_attachment_url(attempt.url()) {
        return attempt.error(error);
      }
      attempt.follow()
    }))
    .build()
    .map_err(|error| format!("Failed to create HTTP client: {error}"))?;

  let response = client
    .get(parsed_url)
    .send()
    .await
    .map_err(|error| format!("Failed to fetch attachment: {error}"))?;

  if !response.status().is_success() {
    return Err(format!("HTTP error {}", response.status()));
  }

  if response
    .content_length()
    .is_some_and(|len| len > MAX_ATTACHMENT_BYTES as u64)
  {
    return Err(format!("Image exceeds {MAX_ATTACHMENT_BYTES} byte limit"));
  }

  let content_type = response
    .headers()
    .get(reqwest::header::CONTENT_TYPE)
    .and_then(|val| val.to_str().ok())
    .map(|val| val.to_string());

  let bytes = response
    .bytes()
    .await
    .map_err(|error| format!("Failed to read attachment bytes: {error}"))?;

  if bytes.len() > MAX_ATTACHMENT_BYTES {
    return Err(format!("Image exceeds {MAX_ATTACHMENT_BYTES} byte limit"));
  }

  validate_image_content(content_type.as_deref(), &bytes)?;

  Ok(bytes.to_vec())
}
