//! Shared fixtures for the clipper receiver tests.
//!
//! Kept out of the individual suites so each stays readable: the socket harness
//! is reusable, and the payload fixture is the same shape the extension sends.

use std::collections::BTreeMap;
use std::io::{Read, Write};
use std::net::{Ipv4Addr, Shutdown, TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use std::thread;

use crate::clipper_dispatch::ClipDispatcher;
use crate::clipper_payload::{
  ClipAck, ClipAckStatus, ClipError, ClipPayload, ClipSource, ClipTarget,
};
use crate::clipper_routes::{handle_connection, CLIP_ROUTE};
use crate::clipper_validate::ValidatedClip;

/// Obviously-not-secret fixture token; 64 hex characters like a real one.
pub(crate) const TOKEN: &str =
  "5f2a7c1d9e4b8a3061c5d2e7f4a9b8c3d6e1f0a2b5c8d7e4f1a0b9c8d7e6f5a4";

pub(crate) fn body_json(body: &str) -> serde_json::Value {
  serde_json::from_str(body).expect("response body is JSON")
}

/// The clip the extension would render for a title, as a validated payload.
pub(crate) fn clip_payload(note_name: &str, folder: &str) -> ClipPayload {
  ClipPayload {
    version: 1,
    clip_id: "11111111-1111-4111-8111-111111111111".to_string(),
    captured_at: "2026-10-17T10:00:00.000Z".to_string(),
    mode: "full".to_string(),
    template_id: "article".to_string(),
    behavior: "create".to_string(),
    target: ClipTarget {
      vault_id: None,
      folder: folder.to_string(),
      note_name: note_name.to_string(),
    },
    source: ClipSource {
      url: "https://example.com/a".to_string(),
      title: "A title".to_string(),
      site: None,
      domain: None,
      author: None,
      published: None,
      description: None,
      image: None,
      favicon: None,
      language: None,
      word_count: Some(120),
    },
    properties: BTreeMap::new(),
    tags: vec!["clippings".to_string()],
    body: "# A title\n\nHello.".to_string(),
    content_hash: "0f1e2d".to_string(),
    highlights: None,
    attachments: None,
  }
}

/// Stands in for the webview: records what reached the writer, and reports back.
pub(crate) struct RecordingDispatcher {
  outcome: ClipAckStatus,
  error: Option<ClipError>,
  paths: Mutex<Vec<String>>,
}

impl RecordingDispatcher {
  pub(crate) fn writing() -> Arc<Self> {
    Arc::new(Self {
      outcome: ClipAckStatus::Written,
      error: None,
      paths: Mutex::new(Vec::new()),
    })
  }

  pub(crate) fn rejecting(error: ClipError) -> Arc<Self> {
    Arc::new(Self {
      outcome: ClipAckStatus::Rejected,
      error: Some(error),
      paths: Mutex::new(Vec::new()),
    })
  }

  /// Empty means the request never reached the writer — the point of most tests.
  pub(crate) fn dispatched(&self) -> Vec<String> {
    self.paths.lock().expect("paths lock").clone()
  }
}

impl ClipDispatcher for RecordingDispatcher {
  fn dispatch(&self, clip: &ValidatedClip) -> ClipAck {
    self
      .paths
      .lock()
      .expect("paths lock")
      .push(clip.relative_path.clone());
    match self.outcome {
      ClipAckStatus::Rejected => ClipAck::rejected(
        clip.payload.clip_id.clone(),
        self.error.unwrap_or(ClipError::InvalidPayload),
      ),
      _ => ClipAck::written(clip.payload.clip_id.clone(), clip.relative_path.clone()),
    }
  }
}

/// A raw request the tests can bend one field of at a time.
pub(crate) struct ClipRequest {
  method: String,
  route: String,
  host: Option<String>,
  origin: Option<String>,
  authorization: Option<String>,
  body: String,
}

impl ClipRequest {
  pub(crate) fn post(body: &str) -> Self {
    Self {
      method: "POST".to_string(),
      route: CLIP_ROUTE.to_string(),
      host: None,
      origin: None,
      authorization: Some(format!("Bearer {TOKEN}")),
      body: body.to_string(),
    }
  }

  pub(crate) fn without_authorization(mut self) -> Self {
    self.authorization = None;
    self
  }

  pub(crate) fn with_authorization(mut self, value: &str) -> Self {
    self.authorization = Some(value.to_string());
    self
  }

  pub(crate) fn with_origin(mut self, origin: &str) -> Self {
    self.origin = Some(origin.to_string());
    self
  }

  pub(crate) fn with_host(mut self, host: &str) -> Self {
    self.host = Some(host.to_string());
    self
  }

  pub(crate) fn with_method(mut self, method: &str) -> Self {
    self.method = method.to_string();
    self
  }

  pub(crate) fn with_route(mut self, route: &str) -> Self {
    self.route = route.to_string();
    self
  }

  pub(crate) fn render(&self, port: u16) -> String {
    let host = self
      .host
      .clone()
      .unwrap_or_else(|| format!("127.0.0.1:{port}"));
    let mut head = format!(
      "{} {} HTTP/1.1\r\nHost: {host}\r\nContent-Type: application/json\r\nContent-Length: {}",
      self.method,
      self.route,
      self.body.len()
    );
    if let Some(origin) = &self.origin {
      head.push_str(&format!("\r\nOrigin: {origin}"));
    }
    if let Some(authorization) = &self.authorization {
      head.push_str(&format!("\r\nAuthorization: {authorization}"));
    }
    format!("{head}\r\nConnection: close\r\n\r\n{}", self.body)
  }
}

/// Serve exactly one request on a real loopback socket and return `(status, body)`.
pub(crate) fn exchange<D: ClipDispatcher>(
  build: impl FnOnce(u16) -> String,
  active_token: Option<&str>,
  dispatcher: Arc<D>,
) -> (u16, String) {
  let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).expect("bind loopback");
  let port = listener.local_addr().expect("local addr").port();
  let request = build(port);
  let token = Arc::new(Mutex::new(active_token.map(str::to_string)));

  let server = {
    let token = Arc::clone(&token);
    thread::spawn(move || {
      let (mut stream, _) = listener.accept().expect("accept");
      handle_connection(&mut stream, port, &token, &*dispatcher);
    })
  };

  let mut client = TcpStream::connect((Ipv4Addr::LOCALHOST, port)).expect("connect");
  client.write_all(request.as_bytes()).expect("write request");
  client.flush().expect("flush");
  client.shutdown(Shutdown::Write).expect("shutdown write");
  let mut response = String::new();
  client.read_to_string(&mut response).expect("read response");
  server.join().expect("server thread");

  let status = response
    .lines()
    .next()
    .and_then(|line| line.split(' ').nth(1))
    .and_then(|code| code.parse::<u16>().ok())
    .expect("status line");
  let body = response
    .split_once("\r\n\r\n")
    .map(|(_, body)| body.to_string())
    .unwrap_or_default();
  (status, body)
}

pub(crate) fn clip_json(note_name: &str, folder: &str) -> String {
  clip_json_with(note_name, folder, serde_json::json!({}))
}

pub(crate) fn clip_json_with(note_name: &str, folder: &str, properties: serde_json::Value) -> String {
  serde_json::json!({
    "version": 1,
    "clipId": "clip-1",
    "capturedAt": "2026-10-17T10:00:00Z",
    "mode": "full",
    "templateId": "article",
    "behavior": "create",
    "target": { "folder": folder, "noteName": note_name },
    "source": { "url": "https://example.com/a", "title": "A title" },
    "properties": properties,
    "tags": ["clippings"],
    "body": "hello",
    "contentHash": "abc123"
  })
  .to_string()
}
