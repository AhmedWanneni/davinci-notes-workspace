#[cfg(test)]
mod tests {
  use std::fs;
  use std::path::PathBuf;
  use std::time::{SystemTime, UNIX_EPOCH};

  use crate::syncthing::api_key::{generate_random_api_key, load_fallback_key_file, save_fallback_key_file};
  use crate::syncthing::process::{
    allocate_free_port, read_pid_file, remove_pid_file, strip_default_folder_from_config,
    write_pid_file,
  };
  use crate::syncthing::types::{redact_secrets, SyncthingLifecycleState, SyncthingLifecycleStatus};

  fn make_test_dir() -> PathBuf {
    let now = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let dir = std::env::temp_dir().join(format!("davinci_lifecycle_test_{}_{}", std::process::id(), now));
    fs::create_dir_all(&dir).expect("create test dir");
    dir
  }

  #[test]
  fn test_generate_random_api_key_format_and_entropy() {
    let key1 = generate_random_api_key();
    let key2 = generate_random_api_key();
    assert_eq!(key1.len(), 32);
    assert_eq!(key2.len(), 32);
    assert_ne!(key1, key2);
    assert!(key1.chars().all(|c| c.is_ascii_alphanumeric()));
  }

  #[test]
  fn test_fallback_key_file_round_trip_and_permissions() {
    let dir = make_test_dir();
    let key = "MySecretSyncthingKey123456789012";
    save_fallback_key_file(&dir, key).expect("save key file");

    let loaded = load_fallback_key_file(&dir);
    assert_eq!(loaded, Some(key.to_string()));

    #[cfg(unix)]
    {
      use std::os::unix::fs::PermissionsExt;
      let meta = fs::metadata(dir.join(".api_key")).expect("metadata");
      let mode = meta.permissions().mode() & 0o777;
      assert_eq!(mode, 0o600, "Permissions must be restrictive 0600 on Unix");
    }

    let _ = fs::remove_dir_all(&dir);
  }

  #[test]
  fn test_allocate_free_port_succeeds() {
    let port = allocate_free_port().expect("allocate port");
    assert!(port > 1024);
  }

  #[test]
  fn test_pid_file_lifecycle() {
    let dir = make_test_dir();
    assert_eq!(read_pid_file(&dir), None);

    write_pid_file(&dir, 12345, 8389).expect("write pid");
    assert_eq!(read_pid_file(&dir), Some((12345, 8389)));

    remove_pid_file(&dir);
    assert_eq!(read_pid_file(&dir), None);

    let _ = fs::remove_dir_all(&dir);
  }

  #[test]
  fn test_strip_default_folder_from_config_xml() {
    let dir = make_test_dir();
    let config_path = dir.join("config.xml");
    let xml = r#"<configuration version="37">
    <folder id="default" label="Default Folder" path="/home/user/Sync" type="sendreceive">
        <filesystemType>basic</filesystemType>
    </folder>
    <options>
        <listenAddress>default</listenAddress>
    </options>
</configuration>"#;
    fs::write(&config_path, xml).expect("write config");

    strip_default_folder_from_config(&config_path);

    let updated = fs::read_to_string(&config_path).expect("read updated config");
    assert!(!updated.contains(r#"<folder id="default""#));
    assert!(!updated.contains("/home/user/Sync"));
    assert!(updated.contains("<options>"));

    let _ = fs::remove_dir_all(&dir);
  }

  #[test]
  fn test_lifecycle_status_serialization() {
    let status = SyncthingLifecycleStatus {
      state: SyncthingLifecycleState::Running,
      reason: None,
      gui_address: Some("127.0.0.1:9090".to_string()),
      device_id: Some("ABC-123".to_string()),
      device_name: Some("My Node".to_string()),
      version: Some("v2.1.6".to_string()),
      last_logs: None,
    };

    let serialized = serde_json::to_string(&status).expect("serialize");
    assert!(serialized.contains(r#""state":"running""#));
    assert!(serialized.contains(r#""guiAddress":"127.0.0.1:9090""#));
    assert!(!serialized.contains("reason"));
  }

  #[test]
  fn test_api_key_redaction_never_leaks_in_errors() {
    let secret = "superSecretApiKey999999999999999";
    let error_msg = format!("HTTP 401 Unauthorized with token {}", secret);
    let redacted = redact_secrets(&error_msg, Some(secret));
    assert!(!redacted.contains(secret));
    assert!(redacted.contains("[REDACTED]"));
  }
}
