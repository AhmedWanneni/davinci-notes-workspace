//! Token authentication for the loopback clipper listener (ADR-0173).
//!
//! One random per-install token guards `POST /clipper/clip`. The token is stored
//! in the OS keychain through a trait so open decision O7 ("keychain vs config
//! file") can be answered later by swapping the implementation, not by rewriting
//! the listener.
//!
//! The comparison is constant time (`constant_time_eq`, already compiled in the
//! tree via `blake3`): a byte-at-a-time comparison leaks how much of a guessed
//! token was right, which is exactly the signal an attacker wants.

use constant_time_eq::constant_time_eq;
use keyring::Entry;

/// Keychain service/account pair, mirroring the ADR-0120 pattern in `oauth.rs`.
pub const SERVICE: &str = "com.davinci.notes.web-clipper";
pub const ACCOUNT: &str = "loopback-token";

/// 256 bits of OS randomness, hex-encoded to 64 characters.
pub const TOKEN_BYTES: usize = 32;

/// Where the per-install token lives. O7 is open, so this is a seam.
pub trait ClipTokenStore: Send + Sync + 'static {
  fn load(&self) -> Result<Option<String>, String>;
  fn save(&self, token: &str) -> Result<(), String>;
  fn clear(&self) -> Result<(), String>;
}

/// The default store: the OS keychain (ADR-0173, ADR-0120 pattern).
pub struct KeychainClipTokenStore;

impl ClipTokenStore for KeychainClipTokenStore {
  fn load(&self) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())?;
    match entry.get_password() {
      Ok(token) => Ok(Some(token)),
      Err(keyring::Error::NoEntry) => Ok(None),
      Err(error) => Err(error.to_string()),
    }
  }

  fn save(&self, token: &str) -> Result<(), String> {
    Entry::new(SERVICE, ACCOUNT)
      .map_err(|error| error.to_string())?
      .set_password(token)
      .map_err(|error| error.to_string())
  }

  fn clear(&self) -> Result<(), String> {
    let entry = Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())?;
    match entry.delete_credential() {
      Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
      Err(error) => Err(error.to_string()),
    }
  }
}

/// A fresh random token, hex-encoded.
pub fn generate_token() -> Result<String, String> {
  let mut bytes = [0_u8; TOKEN_BYTES];
  getrandom::getrandom(&mut bytes)
    .map_err(|error| format!("could not read OS randomness: {error}"))?;
  Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
}

/// Constant-time token comparison.
pub fn tokens_match(provided: &str, expected: &str) -> bool {
  constant_time_eq(provided.as_bytes(), expected.as_bytes())
}

/// Return the stored token, creating and persisting one on first use.
pub fn ensure_token(store: &dyn ClipTokenStore) -> Result<String, String> {
  if let Some(token) = store.load()? {
    if !token.is_empty() {
      return Ok(token);
    }
  }
  let token = generate_token()?;
  store.save(&token)?;
  Ok(token)
}

/// Issue a new token, replacing the stored one (revokes the old value).
pub fn rotate_token(store: &dyn ClipTokenStore) -> Result<String, String> {
  let token = generate_token()?;
  store.save(&token)?;
  Ok(token)
}
