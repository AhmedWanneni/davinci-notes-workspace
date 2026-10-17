//! Name-rule and validation tests (plan §5 Phases 1 and 3).
//!
//! These are the shared vectors: if the TypeScript side of `safeName` /
//! `normalizeFolder` / `normalizeNoteName` drifts from the Rust port, a
//! legitimate clip starts being rejected, and these tests are where that shows up.

use crate::clipper_name_rules::{
  is_safe_relative_path, normalize_folder, normalize_note_name, resolve_clip_path, safe_name,
};
use crate::clipper_payload::{ClipAttachmentRef, ClipHighlight, ClipPropertyValue};
use crate::clipper_test_harness::clip_payload;
use crate::clipper_validate::{
  validate_clip, ClipRejection, MAX_ATTACHMENT_COUNT, MAX_BODY_BYTES, MAX_HIGHLIGHT_COUNT,
  MAX_PROPERTY_COUNT, MAX_TAG_COUNT,
};

#[test]
fn safe_name_matches_the_extension_vectors() {
  let cases = [
    ("../../etc/x", "etcx"),
    ("/etc/passwd", "etcpasswd"),
    ("..", "Untitled"),
    ("...", "Untitled"),
    ("CON", "_CON"),
    ("aux", "_aux"),
    ("My Note", "My Note"),
    ("A: B", "A B"),
    // A tab is a control character (0x09), so it is *removed*, not collapsed —
    // exactly what `stripControlCharacters` does in TypeScript.
    ("spaced\tout", "spacedout"),
    ("  spaced   out  ", "spaced out"),
    ("x\u{0}y", "xy"),
    ("a/b\\c", "abc"),
    ("..hidden..", "hidden"),
    ("dot.dot", "dot.dot"),
    ("🎉 party", "🎉 party"),
  ];
  for (input, expected) in cases {
    assert_eq!(safe_name(input), expected, "safe_name({input:?})");
  }
  // The empty result falls back, exactly as `safeName` does.
  assert_eq!(safe_name("..."), "Untitled");
  // Truncation is by UTF-16 unit, like JS `slice`.
  assert_eq!(safe_name(&"a".repeat(300)).len(), 200);
}

#[test]
fn normalize_note_name_always_ends_in_markdown() {
  assert_eq!(normalize_note_name("My Note"), "My Note.md");
  assert_eq!(normalize_note_name("My Note.md"), "My Note.md");
  assert_eq!(normalize_note_name("note.MD"), "note.md");
  assert_eq!(normalize_note_name(""), "Untitled.md");
  assert_eq!(normalize_note_name("NUL"), "_NUL.md");
  assert_eq!(normalize_note_name("../../etc/x"), "etcx.md");
  assert_eq!(normalize_note_name("/etc/passwd"), "etcpasswd.md");
}

#[test]
fn normalize_folder_drops_traversal_and_caps_depth() {
  assert_eq!(normalize_folder(""), "");
  assert_eq!(normalize_folder("Clippings"), "Clippings");
  assert_eq!(normalize_folder("a/b/c"), "a/b/c");
  assert_eq!(normalize_folder("a\\b"), "a/b");
  assert_eq!(normalize_folder("./a/../b"), "a/b");
  assert_eq!(normalize_folder("//a//"), "a");
  assert_eq!(normalize_folder("seg/../../.."), "seg");
  assert_eq!(normalize_folder("\\"), "");
  assert_eq!(normalize_folder("a/b/c/d/e/f/g/h/i"), "a/b/c/d/e/f/g/h");
}

#[test]
fn safe_relative_path_rejects_every_escape() {
  assert!(is_safe_relative_path("a/b.md"));
  assert!(is_safe_relative_path("b.md"));
  assert!(!is_safe_relative_path(""));
  assert!(!is_safe_relative_path("/a.md"));
  assert!(!is_safe_relative_path("a\\b.md"));
  assert!(!is_safe_relative_path("a/../b.md"));
  assert!(!is_safe_relative_path("a//b.md"));
  assert_eq!(resolve_clip_path("", "Note.md"), "Note.md");
  assert_eq!(resolve_clip_path("Clippings", "Note.md"), "Clippings/Note.md");
}

#[test]
fn accepts_a_well_formed_clip() {
  let clip = validate_clip(&clip_payload("My Note.md", "Clippings")).expect("valid clip");
  assert_eq!(clip.relative_path, "Clippings/My Note.md");
}

#[test]
fn accepts_the_extension_output_for_awkward_titles() {
  // Whatever the extension produces must survive the desktop's check.
  let cases = [
    ("Untitled.md", ""),
    ("A B.md", "Clippings"),
    ("_CON.md", ""),
    ("_aux.md", "Clippings/a/b"),
    ("🎉 party.md", "Clippings"),
    ("dot.dot.md", "Clippings"),
  ];
  for (note_name, folder) in cases {
    let clip = validate_clip(&clip_payload(note_name, folder))
      .unwrap_or_else(|error| panic!("({note_name:?}, {folder:?}) rejected: {error:?}"));
    assert_eq!(clip.relative_path, resolve_clip_path(folder, note_name));
  }
}

#[test]
fn rejects_hostile_note_names_as_invalid_paths() {
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
    assert_eq!(
      validate_clip(&clip_payload(note_name, "")).err(),
      Some(ClipRejection::InvalidPath),
      "note name {note_name:?} should be rejected"
    );
  }
}

#[test]
fn rejects_hostile_folders() {
  for folder in [".", "seg/../../..", "\\", "a/b/c/d/e/f/g/h/i"] {
    assert!(
      matches!(
        validate_clip(&clip_payload("Note.md", folder)),
        Err(ClipRejection::InvalidPath)
      ),
      "folder {folder:?} should be rejected"
    );
  }
  // An empty folder is the vault root, not an error.
  assert!(validate_clip(&clip_payload("Note.md", "")).is_ok());
}

#[test]
fn rejects_a_payload_that_breaks_the_contract() {
  let mut version = clip_payload("Note.md", "");
  version.version = 2;
  assert_eq!(validate_clip(&version).err(), Some(ClipRejection::InvalidPayload));

  let mut mode = clip_payload("Note.md", "");
  mode.mode = "raw".to_string();
  assert_eq!(validate_clip(&mode).err(), Some(ClipRejection::InvalidPayload));

  let mut behavior = clip_payload("Note.md", "");
  behavior.behavior = "overwrite".to_string();
  assert_eq!(validate_clip(&behavior).err(), Some(ClipRejection::InvalidPayload));

  let mut blank_id = clip_payload("Note.md", "");
  blank_id.clip_id = String::new();
  assert_eq!(validate_clip(&blank_id).err(), Some(ClipRejection::InvalidPayload));

  let mut reserved = clip_payload("Note.md", "");
  reserved
    .properties
    .insert("__proto__".to_string(), ClipPropertyValue::Text("x".to_string()));
  assert_eq!(validate_clip(&reserved).err(), Some(ClipRejection::InvalidPayload));
}

#[test]
fn rejects_oversized_collections() {
  let mut properties = clip_payload("Note.md", "");
  for index in 0..=MAX_PROPERTY_COUNT {
    properties
      .properties
      .insert(format!("k{index}"), ClipPropertyValue::Text("v".to_string()));
  }
  assert_eq!(validate_clip(&properties).err(), Some(ClipRejection::TooLarge));

  let mut tags = clip_payload("Note.md", "");
  tags.tags = (0..=MAX_TAG_COUNT).map(|index| format!("tag{index}")).collect();
  assert_eq!(validate_clip(&tags).err(), Some(ClipRejection::TooLarge));

  let mut body = clip_payload("Note.md", "");
  body.body = "x".repeat(MAX_BODY_BYTES + 1);
  assert_eq!(validate_clip(&body).err(), Some(ClipRejection::TooLarge));

  let mut highlights = clip_payload("Note.md", "");
  highlights.highlights = Some(
    (0..=MAX_HIGHLIGHT_COUNT)
      .map(|_| ClipHighlight {
        text: "quoted".to_string(),
        selector: None,
        created_at: "2026-10-17T10:00:00Z".to_string(),
      })
      .collect(),
  );
  assert_eq!(validate_clip(&highlights).err(), Some(ClipRejection::TooLarge));

  let mut attachments = clip_payload("Note.md", "");
  attachments.attachments = Some(
    (0..=MAX_ATTACHMENT_COUNT)
      .map(|index| ClipAttachmentRef {
        source_url: format!("https://example.com/{index}.png"),
        suggested_name: format!("image-{index}.png"),
        alt: None,
      })
      .collect(),
  );
  assert_eq!(validate_clip(&attachments).err(), Some(ClipRejection::TooLarge));
}
