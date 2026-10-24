//! Validation for a clip received over the loopback listener (plan §3, §5).
//!
//! The extension renders the clip; the desktop *verifies* it. The desktop does
//! not re-sanitise, it **rejects**: a clip whose names are not already
//! normalised is either a bug or an attack, and silently writing a different
//! name than the user saw is worse than a loud `invalid-path`.
//!
//! Path safety itself lives in `clipper_name_rules`; this module is the bounds
//! and shape check over every other hostile field.

use crate::clipper_name_rules::{
  is_safe_relative_path, normalize_folder, normalize_note_name, resolve_clip_path, utf16_len,
};
use crate::clipper_payload::{
  ClipError, ClipPayload, ClipPropertyValue, CLIP_BEHAVIORS, CLIP_MODES, CLIP_PAYLOAD_VERSION,
};

/// Hard cap on a request body (plan §4). Enforced before the body is read.
pub const MAX_BODY_BYTES: usize = 2 * 1024 * 1024;
/// Hard cap on the request head, so a header flood cannot exhaust memory.
pub const MAX_HEADER_BYTES: usize = 16 * 1024;

/// A joined folder path is far longer than any segment, but still bounded.
pub const MAX_FOLDER_LEN: usize = 512;

pub const MAX_PROPERTY_COUNT: usize = 256;
pub const MAX_PROPERTY_KEY_LEN: usize = 128;
pub const MAX_PROPERTY_VALUE_LEN: usize = 4096;
pub const MAX_PROPERTY_LIST_LEN: usize = 256;

pub const MAX_TAG_COUNT: usize = 64;
pub const MAX_TAG_LEN: usize = 128;

pub const MAX_HIGHLIGHT_COUNT: usize = 500;
pub const MAX_HIGHLIGHT_TEXT_LEN: usize = 8192;
pub const MAX_ATTACHMENT_COUNT: usize = 100;
pub const MAX_ATTACHMENT_NAME_LEN: usize = 256;

pub const MAX_ID_LEN: usize = 128;
pub const MAX_URL_LEN: usize = 2048;
pub const MAX_SHORT_TEXT_LEN: usize = 4096;

/// Frontmatter keys that must never be written (mirrors `propertyName.ts`).
const RESERVED_PROPERTY_NAMES: [&str; 3] = ["__proto__", "constructor", "prototype"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ClipRejection {
  /// A size or count bound was exceeded.
  TooLarge,
  /// `folder`/`noteName` is not an already-normalised, vault-confined path.
  InvalidPath,
  /// Any other malformed or hostile field.
  InvalidPayload,
}

impl ClipRejection {
  pub fn error(self) -> ClipError {
    match self {
      Self::TooLarge => ClipError::TooLarge,
      Self::InvalidPath => ClipError::InvalidPath,
      Self::InvalidPayload => ClipError::InvalidPayload,
    }
  }

  pub fn http_status(self) -> u16 {
    match self {
      Self::TooLarge => 413,
      Self::InvalidPath | Self::InvalidPayload => 422,
    }
  }
}

/// A clip that survived validation, with the path the webview should write.
#[derive(Debug, Clone)]
pub struct ValidatedClip {
  pub payload: ClipPayload,
  pub relative_path: String,
}

fn has_control_characters(value: &str, allow_line_breaks: bool) -> bool {
  value.chars().any(|character| {
    let code = character as u32;
    let is_control = code <= 0x1f || code == 0x7f;
    if !is_control {
      return false;
    }
    !(allow_line_breaks && matches!(character, '\t' | '\n' | '\r'))
  })
}

fn check_text(value: &str, max: usize) -> Result<(), ClipRejection> {
  if has_control_characters(value, false) {
    return Err(ClipRejection::InvalidPayload);
  }
  if utf16_len(value) > max {
    return Err(ClipRejection::TooLarge);
  }
  Ok(())
}

fn check_optional_text(value: &Option<String>, max: usize) -> Result<(), ClipRejection> {
  match value {
    Some(text) => check_text(text, max),
    None => Ok(()),
  }
}

fn check_property_value(value: &ClipPropertyValue) -> Result<(), ClipRejection> {
  let items: Vec<&String> = match value {
    ClipPropertyValue::Text(text) => return check_property_line(text),
    ClipPropertyValue::List(list) => {
      if list.len() > MAX_PROPERTY_LIST_LEN {
        return Err(ClipRejection::TooLarge);
      }
      list.iter().collect()
    }
    ClipPropertyValue::Number(_) => return Ok(()),
  };
  for item in items {
    check_property_line(item)?;
  }
  Ok(())
}

fn check_property_line(value: &str) -> Result<(), ClipRejection> {
  if has_control_characters(value, true) {
    return Err(ClipRejection::InvalidPayload);
  }
  if utf16_len(value) > MAX_PROPERTY_VALUE_LEN {
    return Err(ClipRejection::TooLarge);
  }
  Ok(())
}

/// Validate a parsed payload against every hostile field (plan §5, Phase 3).
pub fn validate_clip(payload: &ClipPayload) -> Result<ValidatedClip, ClipRejection> {
  if payload.version != CLIP_PAYLOAD_VERSION {
    return Err(ClipRejection::InvalidPayload);
  }
  if !CLIP_MODES.contains(&payload.mode.as_str()) {
    return Err(ClipRejection::InvalidPayload);
  }
  if !CLIP_BEHAVIORS.contains(&payload.behavior.as_str()) {
    return Err(ClipRejection::InvalidPayload);
  }

  for identifier in [
    &payload.clip_id,
    &payload.captured_at,
    &payload.content_hash,
    &payload.template_id,
  ] {
    if identifier.is_empty() {
      return Err(ClipRejection::InvalidPayload);
    }
    check_text(identifier, MAX_ID_LEN)?;
  }

  let folder = normalize_folder(&payload.target.folder);
  if folder != payload.target.folder || folder.len() > MAX_FOLDER_LEN {
    return Err(ClipRejection::InvalidPath);
  }

  let note_name = normalize_note_name(&payload.target.note_name);
  if note_name != payload.target.note_name {
    return Err(ClipRejection::InvalidPath);
  }

  let relative_path = resolve_clip_path(&folder, &note_name);
  if !is_safe_relative_path(&relative_path) {
    return Err(ClipRejection::InvalidPath);
  }

  // Decision O4 (multi-vault) is unresolved: only the field shape is checked
  // here; which vault receives the clip is the webview's decision.
  check_optional_text(&payload.target.vault_id, MAX_ID_LEN)?;

  check_text(&payload.source.url, MAX_URL_LEN)?;
  check_text(&payload.source.title, MAX_SHORT_TEXT_LEN)?;
  for optional in [
    &payload.source.site,
    &payload.source.domain,
    &payload.source.author,
    &payload.source.published,
    &payload.source.description,
    &payload.source.image,
    &payload.source.favicon,
    &payload.source.language,
  ] {
    check_optional_text(optional, MAX_SHORT_TEXT_LEN)?;
  }

  if payload.properties.len() > MAX_PROPERTY_COUNT {
    return Err(ClipRejection::TooLarge);
  }
  for (key, value) in &payload.properties {
    if key.is_empty() || RESERVED_PROPERTY_NAMES.contains(&key.as_str()) {
      return Err(ClipRejection::InvalidPayload);
    }
    check_text(key, MAX_PROPERTY_KEY_LEN)?;
    check_property_value(value)?;
  }

  if payload.tags.len() > MAX_TAG_COUNT {
    return Err(ClipRejection::TooLarge);
  }
  for tag in &payload.tags {
    check_text(tag, MAX_TAG_LEN)?;
  }

  if utf16_len(&payload.body) > MAX_BODY_BYTES {
    return Err(ClipRejection::TooLarge);
  }

  if let Some(highlights) = &payload.highlights {
    if highlights.len() > MAX_HIGHLIGHT_COUNT {
      return Err(ClipRejection::TooLarge);
    }
    for highlight in highlights {
      check_text(&highlight.text, MAX_HIGHLIGHT_TEXT_LEN)?;
      check_optional_text(&highlight.selector, MAX_SHORT_TEXT_LEN)?;
      check_text(&highlight.created_at, MAX_ID_LEN)?;
    }
  }

  if let Some(attachments) = &payload.attachments {
    if attachments.len() > MAX_ATTACHMENT_COUNT {
      return Err(ClipRejection::TooLarge);
    }
    for attachment in attachments {
      check_text(&attachment.source_url, MAX_URL_LEN)?;
      check_text(&attachment.suggested_name, MAX_ATTACHMENT_NAME_LEN)?;
      check_optional_text(&attachment.alt, MAX_SHORT_TEXT_LEN)?;
    }
  }

  Ok(ValidatedClip {
    payload: payload.clone(),
    relative_path,
  })
}
