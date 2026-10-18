use std::fs;
use std::path::Path;

const KEYCHAIN_SERVICE: &str = "com.davinci.notes.syncthing";
const KEYCHAIN_USER: &str = "api-key";

pub fn generate_random_api_key() -> String {
  const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let mut key = String::with_capacity(32);
  let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .unwrap_or_default()
    .as_nanos();
  let mut seed = (now ^ 0x5bf03635) as u64;

  for i in 0..32 {
    seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407 + i as u64);
    let idx = (seed as usize) % CHARSET.len();
    key.push(CHARSET[idx] as char);
  }
  key
}

pub fn save_fallback_key_file(home_dir: &Path, key: &str) -> std::io::Result<()> {
  let file_path = home_dir.join(".api_key");
  fs::write(&file_path, key)?;

  #[cfg(unix)]
  {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = fs::metadata(&file_path)?.permissions();
    perms.set_mode(0o600);
    fs::set_permissions(&file_path, perms)?;
  }

  Ok(())
}

pub fn load_fallback_key_file(home_dir: &Path) -> Option<String> {
  let file_path = home_dir.join(".api_key");
  if !file_path.exists() {
    return None;
  }
  let content = fs::read_to_string(&file_path).ok()?;
  let trimmed = content.trim().to_string();
  if trimmed.is_empty() {
    None
  } else {
    Some(trimmed)
  }
}

pub fn load_keychain_api_key() -> Option<String> {
  let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_USER).ok()?;
  let key = entry.get_password().ok()?;
  let trimmed = key.trim().to_string();
  if trimmed.is_empty() {
    None
  } else {
    Some(trimmed)
  }
}

pub fn save_keychain_api_key(key: &str) -> Result<(), String> {
  let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_USER)
    .map_err(|e| format!("Failed to access keychain: {e}"))?;
  entry
    .set_password(key)
    .map_err(|e| format!("Failed to set keychain password: {e}"))
}

pub fn get_or_create_managed_api_key(home_dir: &Path) -> String {
  if let Some(key) = load_keychain_api_key() {
    return key;
  }
  if let Some(key) = load_fallback_key_file(home_dir) {
    let _ = save_keychain_api_key(&key);
    return key;
  }

  let new_key = generate_random_api_key();
  let _ = save_keychain_api_key(&new_key);
  let _ = save_fallback_key_file(home_dir, &new_key);
  new_key
}
