//! The hostile-target matrix (plan §5, Phase 3: checks 1, 2 and 4).
//!
//! Every case here is one the plan names explicitly, asserted against a real
//! socket: a rejected clip must never reach the writer, and the response must
//! say why.

use std::sync::Arc;

use crate::clipper_payload::ClipError;
use crate::clipper_test_harness::{body_json, clip_json, clip_json_with, exchange, ClipRequest, RecordingDispatcher, TOKEN};

#[test]
fn refuses_every_hostile_note_name() {
  let long_name = "a".repeat(500);
  let hostile = [
    "../../etc/x",
    "/etc/passwd",
    "C:\\Windows\\x",
    "..\\..\\x",
    "a/../../b.md",
    "CON.md",
    ".hidden",
    "x\u{0}y.md",
    long_name.as_str(),
  ];
  for note_name in hostile {
    let dispatcher = RecordingDispatcher::writing();
    let payload = clip_json(note_name, "");
    let (status, body) = exchange(
      |port| ClipRequest::post(&payload).render(port),
      Some(TOKEN),
      Arc::clone(&dispatcher),
    );
    assert_eq!(status, 422, "note name {note_name:?} -> {body}");
    assert_eq!(body_json(&body)["error"], "invalid-path", "note name {note_name:?}");
    assert!(
      dispatcher.dispatched().is_empty(),
      "note name {note_name:?} reached the writer"
    );
  }
}

#[test]
fn refuses_every_hostile_folder() {
  for folder in [".", "seg/../../..", "\\", "a/b/c/d/e/f/g/h/i"] {
    let dispatcher = RecordingDispatcher::writing();
    let payload = clip_json("Note.md", folder);
    let (status, body) = exchange(
      |port| ClipRequest::post(&payload).render(port),
      Some(TOKEN),
      Arc::clone(&dispatcher),
    );
    assert_eq!(status, 422, "folder {folder:?} -> {body}");
    assert_eq!(body_json(&body)["error"], "invalid-path", "folder {folder:?}");
    assert!(dispatcher.dispatched().is_empty(), "folder {folder:?} reached the writer");
  }
}

#[test]
fn refuses_a_huge_properties_map_without_panicking() {
  let dispatcher = RecordingDispatcher::writing();
  let mut properties = serde_json::Map::new();
  for index in 0..10_000 {
    properties.insert(format!("key{index}"), serde_json::json!("value"));
  }
  let payload = clip_json_with("Note.md", "", serde_json::Value::Object(properties));
  let (status, body) = exchange(
    |port| ClipRequest::post(&payload).render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 413);
  assert_eq!(body_json(&body)["error"], "too-large");
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn maps_a_webview_verdict_onto_the_response() {
  let payload = clip_json("Note.md", "");

  let busy = RecordingDispatcher::rejecting(ClipError::AppBusy);
  let (busy_status, busy_body) = exchange(
    |port| ClipRequest::post(&payload).render(port),
    Some(TOKEN),
    Arc::clone(&busy),
  );
  assert_eq!(busy_status, 503);
  assert_eq!(body_json(&busy_body)["error"], "app-busy");

  let no_vault = RecordingDispatcher::rejecting(ClipError::VaultNotOpen);
  let (vault_status, vault_body) = exchange(
    |port| ClipRequest::post(&payload).render(port),
    Some(TOKEN),
    Arc::clone(&no_vault),
  );
  assert_eq!(vault_status, 409);
  assert_eq!(body_json(&vault_body)["error"], "vault-not-open");
}
