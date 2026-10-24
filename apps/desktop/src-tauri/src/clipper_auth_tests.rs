//! Token and receiver-state tests (plan §5, Phase 3: checks 9 and 10).
//!
//! The keychain is replaced by an in-memory store so these run without touching
//! the OS credential store — which is also why decision O7 ("keychain vs config
//! file") can still be answered later by swapping the implementation.

use std::sync::{Arc, Mutex};

use crate::clipper_auth::{generate_token, tokens_match, ClipTokenStore};
use crate::clipper_payload::ClipAck;
use crate::clipper_server::{ClipperState, CLIPPER_DEFAULT_PORT};
use crate::clipper_test_harness::{body_json, clip_json, exchange, ClipRequest, RecordingDispatcher, TOKEN};

struct MemoryTokenStore {
  token: Mutex<Option<String>>,
}

impl MemoryTokenStore {
  fn holding(token: &str) -> Arc<Self> {
    Arc::new(Self {
      token: Mutex::new(Some(token.to_string())),
    })
  }
}

impl ClipTokenStore for MemoryTokenStore {
  fn load(&self) -> Result<Option<String>, String> {
    Ok(self.token.lock().expect("token lock").clone())
  }

  fn save(&self, token: &str) -> Result<(), String> {
    *self.token.lock().expect("token lock") = Some(token.to_string());
    Ok(())
  }

  fn clear(&self) -> Result<(), String> {
    *self.token.lock().expect("token lock") = None;
    Ok(())
  }
}

#[test]
fn generated_tokens_are_hex_and_unique() {
  let first = generate_token().expect("token");
  let second = generate_token().expect("token");
  assert_eq!(first.len(), 64);
  assert!(first.chars().all(|character| character.is_ascii_hexdigit()));
  assert_ne!(first, second);
}

#[test]
fn token_comparison_is_length_safe() {
  assert!(tokens_match(TOKEN, TOKEN));
  assert!(!tokens_match(TOKEN, "nope"));
  assert!(!tokens_match("", TOKEN));
  assert!(!tokens_match(&TOKEN[..63], TOKEN));
}

#[test]
fn rotates_the_token_and_revokes_the_previous_one() {
  let store = MemoryTokenStore::holding("old-token");
  let state = ClipperState::with_token_store(store.clone());

  let first = state.arm_token().expect("arm");
  assert_eq!(first, "old-token");
  let second = state.rotate_token().expect("rotate");
  assert_ne!(first, second);
  assert_eq!(store.load().expect("load"), Some(second.clone()));

  // The old value no longer authenticates; the new one does. The listener
  // compares against the cached token, so rotation takes effect immediately.
  let payload = clip_json("Note.md", "");
  let dispatcher = RecordingDispatcher::writing();
  let (stale_status, _) = exchange(
    |port| {
      ClipRequest::post(&payload)
        .with_authorization(&format!("Bearer {first}"))
        .render(port)
    },
    Some(&second),
    Arc::clone(&dispatcher),
  );
  assert_eq!(stale_status, 401);

  let (fresh_status, _) = exchange(
    |port| {
      ClipRequest::post(&payload)
        .with_authorization(&format!("Bearer {second}"))
        .render(port)
    },
    Some(&second),
    Arc::clone(&dispatcher),
  );
  assert_eq!(fresh_status, 200);

  state.revoke_token().expect("revoke");
  assert_eq!(store.load().expect("load"), None);
}

#[test]
fn a_result_with_nothing_waiting_is_an_error() {
  let state = ClipperState::with_token_store(MemoryTokenStore::holding(TOKEN));
  let ack = ClipAck::written("nobody-waiting", "Note.md");
  assert!(state.submit_result(&ack).is_err());
}

#[test]
fn a_disabled_clipper_holds_no_listener() {
  let state = ClipperState::with_token_store(MemoryTokenStore::holding(TOKEN));
  let status = state.status().expect("status");
  assert!(!status.enabled);
  assert_eq!(status.port, None);
  assert!(status.paired);
  assert_eq!(status.default_port, CLIPPER_DEFAULT_PORT);
}

#[test]
fn status_reports_an_unpaired_installation() {
  let store = Arc::new(MemoryTokenStore {
    token: Mutex::new(None),
  });
  let state = ClipperState::with_token_store(store);
  assert!(!state.status().expect("status").paired);
  // Arming creates and persists a token on first use.
  let armed = state.arm_token().expect("arm");
  assert_eq!(armed.len(), 64);
  assert!(state.status().expect("status").paired);
}

#[test]
fn an_unauthorized_response_leaks_nothing() {
  let dispatcher = RecordingDispatcher::writing();
  let payload = clip_json("Note.md", "");
  let (status, body) = exchange(
    |port| ClipRequest::post(&payload).without_authorization().render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 401);
  assert_eq!(body_json(&body)["error"], "unauthorized");
  assert_eq!(body_json(&body)["status"], "rejected");
  assert!(dispatcher.dispatched().is_empty());
  assert!(!body.contains(TOKEN));
}
