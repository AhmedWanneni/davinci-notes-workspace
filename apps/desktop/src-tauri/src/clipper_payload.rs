//! Wire types for the extension → desktop clip contract (plan §4, ADR-0176).
//!
//! Mirrors `packages/clipper-core/ClipPayload.ts`. **Everything in here is
//! hostile input.** These types exist so a payload can be *parsed and then
//! rejected*; nothing here is trusted, and `deny_unknown_fields` means an extra
//! key is a rejection rather than something that silently rides along.
//!
//! A change to this file is a change to the TypeScript definition, and the other
//! way round. `CLIP_PAYLOAD_VERSION` is the guard that lets that happen safely.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// The only wire version. Anything else is refused with `invalid-payload`.
pub const CLIP_PAYLOAD_VERSION: u32 = 1;

/// Allowed `mode` values (mirrors `ClipMode`).
pub const CLIP_MODES: [&str; 4] = ["full", "selection", "highlights", "bookmark"];

/// Allowed `behavior` values (mirrors `CLIP_BEHAVIORS`).
pub const CLIP_BEHAVIORS: [&str; 6] = [
  "create",
  "append-bottom",
  "append-top",
  "prepend",
  "daily-append",
  "daily-prepend",
];

/// A rendered frontmatter value: `string | string[] | number` on the wire.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ClipPropertyValue {
  Text(String),
  List(Vec<String>),
  Number(serde_json::Number),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipTarget {
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub vault_id: Option<String>,
  /// Untrusted: re-validated in `clipper_validate`.
  pub folder: String,
  /// Untrusted: re-validated in `clipper_validate`.
  pub note_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipSource {
  pub url: String,
  pub title: String,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub site: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub domain: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub author: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub published: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub description: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub image: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub favicon: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub language: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub word_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipHighlight {
  pub text: String,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub selector: Option<String>,
  pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipAttachmentRef {
  pub source_url: String,
  pub suggested_name: String,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub alt: Option<String>,
}

/// The clip the extension renders and the desktop re-validates (plan §4).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipPayload {
  pub version: u32,
  pub clip_id: String,
  pub captured_at: String,
  pub mode: String,
  pub template_id: String,
  pub behavior: String,
  pub target: ClipTarget,
  pub source: ClipSource,
  pub properties: BTreeMap<String, ClipPropertyValue>,
  pub tags: Vec<String>,
  pub body: String,
  pub content_hash: String,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub highlights: Option<Vec<ClipHighlight>>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub attachments: Option<Vec<ClipAttachmentRef>>,
}

/// Outcome the extension records against a queue entry (ADR-0178).
///
/// `Queued` is part of the contract for the cold-start buffer (ADR-0177), which
/// is not built yet — Rust has no writer that would emit it today.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ClipAckStatus {
  Written,
  #[allow(dead_code)]
  Queued,
  Rejected,
}

/// The rejection reasons the ack may carry (plan §4).
///
/// `Duplicate` and `VaultNotOpen` are produced by the dedupe ledger and the
/// multi-vault rule (ADR-0178, open decision O4) — both land in a later phase,
/// so here they exist only so a payload carrying them round-trips.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ClipError {
  Unauthorized,
  TooLarge,
  InvalidPath,
  #[allow(dead_code)]
  VaultNotOpen,
  #[allow(dead_code)]
  Duplicate,
  InvalidPayload,
  AppBusy,
}

/// The response body for `POST /clipper/clip`.
///
/// `clip_id` is empty when the request failed before the payload could be
/// parsed (bad token, bad host, malformed JSON) — the extension only needs the
/// id to correlate a *successful* attempt.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipAck {
  pub clip_id: String,
  pub status: ClipAckStatus,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub path: Option<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub error: Option<ClipError>,
}

impl ClipAck {
  /// Only tests construct a success ack today: in production the webview
  /// reports the outcome and Rust deserialises it (the dedupe ledger in
  /// ADR-0178 will build its own).
  #[allow(dead_code)]
  pub fn written(clip_id: impl Into<String>, path: impl Into<String>) -> Self {
    Self {
      clip_id: clip_id.into(),
      status: ClipAckStatus::Written,
      path: Some(path.into()),
      error: None,
    }
  }

  pub fn rejected(clip_id: impl Into<String>, error: ClipError) -> Self {
    Self {
      clip_id: clip_id.into(),
      status: ClipAckStatus::Rejected,
      path: None,
      error: Some(error),
    }
  }
}

/// Event the main webview consumes to perform the write (ADR-0177).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClipReceivedEvent {
  pub clip_id: String,
  pub payload: ClipPayload,
  /// Vault-relative path to write, e.g. `Clippings/Note.md`.
  pub relative_path: String,
}
