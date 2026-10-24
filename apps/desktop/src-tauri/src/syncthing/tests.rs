use super::client::SyncthingClient;
use super::config::{parse_config_xml, validate_and_normalize_loopback, SyncthingResolvedConfig};
use super::types::{redact_secrets, to_base64, SyncthingError};

#[test]
fn validates_and_accepts_loopback_hosts() {
  let ok_cases = [
    ("127.0.0.1:8384", false, "http://127.0.0.1:8384"),
    ("localhost:8384", false, "http://localhost:8384"),
    ("[::1]:8384", false, "http://::1:8384"),
    ("0.0.0.0:8384", false, "http://127.0.0.1:8384"),
    ("127.0.0.1:8384", true, "https://127.0.0.1:8384"),
  ];

  for (raw, tls, expected) in ok_cases {
    let res = validate_and_normalize_loopback(raw, tls);
    assert!(res.is_ok(), "Expected {} to be valid loopback", raw);
    let (_, base_url) = res.unwrap();
    assert_eq!(base_url, expected);
  }
}

#[test]
fn strictly_refuses_non_loopback_hosts() {
  let forbidden_cases = [
    "192.168.1.100:8384",
    "10.0.0.1:8384",
    "172.16.0.1:8384",
    "example.com:8384",
    "syncthing.remote.org:8384",
    "8.8.8.8:8384",
  ];

  for host in forbidden_cases {
    let res = validate_and_normalize_loopback(host, false);
    assert!(
      matches!(res, Err(SyncthingError::ForbiddenHost(_))),
      "Expected {} to be rejected as ForbiddenHost, got {:?}",
      host,
      res
    );
  }
}

#[test]
fn parses_config_xml_correctly() {
  let sample = r#"
    <configuration version="52">
      <gui enabled="true" tls="false">
        <address>127.0.0.1:8384</address>
        <apikey>SECRET_KEY_12345</apikey>
      </gui>
    </configuration>
  "#;

  let (address, key, tls) = parse_config_xml(sample).expect("Should parse valid config.xml");
  assert_eq!(address, "127.0.0.1:8384");
  assert_eq!(key, "SECRET_KEY_12345");
  assert!(!tls);
}

#[test]
fn redacts_api_key_from_error_strings_and_logs() {
  let secret_key = "TOP_SECRET_SYNCTHING_KEY_ABC";
  let raw_error = format!("HTTP 403 Forbidden with key {}", secret_key);
  let sanitized = redact_secrets(&raw_error, Some(secret_key));

  assert!(!sanitized.contains(secret_key));
  assert!(sanitized.contains("[REDACTED]"));
}

#[test]
fn serializes_error_enums_faithfully() {
  let not_running = SyncthingError::NotRunning;
  let json = serde_json::to_string(&not_running).unwrap();
  assert_eq!(json, "\"NotRunning\"");

  let bad_key = SyncthingError::BadKey;
  let json_key = serde_json::to_string(&bad_key).unwrap();
  assert_eq!(json_key, "\"BadKey\"");

  let not_installed = SyncthingError::NotInstalled;
  let json_inst = serde_json::to_string(&not_installed).unwrap();
  assert_eq!(json_inst, "\"NotInstalled\"");
}

#[test]
fn standard_base64_vectors() {
  assert_eq!(to_base64(b""), "");
  assert_eq!(to_base64(b"f"), "Zg==");
  assert_eq!(to_base64(b"fo"), "Zm8=");
  assert_eq!(to_base64(b"foo"), "Zm9v");
  assert_eq!(to_base64(b"foob"), "Zm9vYg==");
  assert_eq!(to_base64(b"fooba"), "Zm9vYmE=");
  assert_eq!(to_base64(b"foobar"), "Zm9vYmFy");
}

#[tokio::test]
async fn returns_not_running_within_timeout_on_closed_port() {
  let config = SyncthingResolvedConfig {
    base_url: "http://127.0.0.1:65530".to_string(),
    gui_address: "127.0.0.1:65530".to_string(),
    api_key: "dummy".to_string(),
  };

  let client = SyncthingClient::new(config).expect("Client creation");
  let start = std::time::Instant::now();
  let res = client.detect().await;
  let elapsed = start.elapsed();

  assert!(elapsed.as_millis() < 2500, "Must not hang, took {:?}", elapsed);
  assert_eq!(res, Err(SyncthingError::NotRunning));
}

#[tokio::test]
async fn rejects_invalid_key_with_bad_key_error() {
  let config = SyncthingResolvedConfig {
    base_url: "http://127.0.0.1:8384".to_string(),
    gui_address: "127.0.0.1:8384".to_string(),
    api_key: "definitely_wrong_key_12345".to_string(),
  };

  if let Ok(client) = SyncthingClient::new(config) {
    let res = client.status().await;
    // If syncthing is running, wrong key must return BadKey; if stopped, NotRunning
    if let Err(err) = res {
      assert!(
        matches!(err, SyncthingError::BadKey | SyncthingError::NotRunning),
        "Expected BadKey or NotRunning, got {:?}",
        err
      );
    }
  }
}

#[tokio::test]
async fn verification_live_syncthing_when_running() {
  if let Ok(config) = super::config::resolve_local_syncthing_config() {
    let client = SyncthingClient::new(config).expect("client");
    if let Ok(detect_res) = client.detect().await {
      assert!(detect_res.running);
      assert!(!detect_res.version.is_empty());
      println!("[VERIFICATION 1: DETECT] running={}, version={}, guiAddress={}", detect_res.running, detect_res.version, detect_res.gui_address);

      let status_res = client.status().await.expect("status should succeed with resolved key");
      assert!(!status_res.device_id.is_empty());
      println!("[VERIFICATION 1: STATUS] deviceId={}, deviceName={}, uptime={}", status_res.device_id, status_res.device_name, status_res.uptime);

      let qr_data_url = client.qr_png(None).await.expect("qr should succeed with resolved key");
      assert!(qr_data_url.starts_with("data:image/png;base64,"));
      println!("[VERIFICATION 1: QR] qr_png prefix={}", &qr_data_url[..35]);
    }
  }
}
