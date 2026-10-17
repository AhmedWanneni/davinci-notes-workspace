//! Vault-safe names — the Rust half of `packages/clipper-core/safeName.ts`.
//!
//! The extension renders names; the desktop verifies them. Both sides must agree
//! byte for byte, or a legitimate clip would be rejected, so this port is
//! deliberately literal — including the parts that look odd. `clipper_tests`
//! pins the shared vectors in both languages.
//!
//! The rules are a *safety* function, not a prettifier: after `normalize_folder`
//! and `normalize_note_name`, a path can only ever point inside the vault.

/// Mirrors `safeName`'s `DEFAULT_MAX_LENGTH`, counted in UTF-16 units as JS does.
pub const MAX_NOTE_NAME_LEN: usize = 200;
/// Mirrors `normalizeFolder`'s `MAX_FOLDER_DEPTH`.
pub const MAX_FOLDER_DEPTH: usize = 8;

const DEFAULT_NAME_FALLBACK: &str = "Untitled";
const FOLDER_SEGMENT_FALLBACK: &str = "Folder";

/// Windows device names are invalid even with an extension (mirrors `safeName`).
const RESERVED_NAMES: [&str; 22] = [
  "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
  "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/// JS `String.prototype.length`, which counts UTF-16 code units, not characters.
pub(crate) fn utf16_len(value: &str) -> usize {
  value.chars().map(char::len_utf16).sum()
}

/// Truncate to `max` UTF-16 units, matching JS `String.prototype.slice`.
fn truncate_utf16(value: &str, max: usize) -> String {
  let mut out = String::with_capacity(value.len());
  let mut used = 0;
  for character in value.chars() {
    let width = character.len_utf16();
    if used + width > max {
      break;
    }
    out.push(character);
    used += width;
  }
  out
}

fn strip_control_characters(value: &str) -> String {
  // Exactly the JS check: `code <= 0x1f || code === 0x7f`.
  value
    .chars()
    .filter(|character| {
      let code = *character as u32;
      code > 0x1f && code != 0x7f
    })
    .collect()
}

fn strip_illegal_characters(name: &str) -> String {
  // The conservative default in `stripIllegalCharacters`: Windows rules apply.
  name
    .chars()
    .filter(|character| !matches!(character, '/' | '\\' | '<' | '>' | ':' | '"' | '|' | '?' | '*'))
    .collect()
}

/// `name.replace(/\.\.+/g, ".")` — a run of dots collapses to one.
fn collapse_dot_runs(name: &str) -> String {
  let mut out = String::with_capacity(name.len());
  let mut dots = 0_usize;
  for character in name.chars() {
    if character == '.' {
      dots += 1;
      if dots == 1 {
        out.push('.');
      }
    } else {
      dots = 0;
      out.push(character);
    }
  }
  out
}

fn trim_dots_and_spaces(value: &str) -> String {
  let is_edge = |character: char| character == '.' || character.is_whitespace();
  value.trim_matches(is_edge).to_string()
}

/// The shared body of `safeName`; `fallback`/`max` differ per call site.
///
/// NB: `safeName` also applies Unicode NFC. Rust's std cannot, and a
/// normalisation crate is a new dependency for no security gain (composition
/// cannot introduce a separator), so the Rust side stays NFC-agnostic.
pub(crate) fn safe_name_with(input: &str, max_length: usize, fallback: &str) -> String {
  let mut name = strip_illegal_characters(&strip_control_characters(input));
  name = collapse_dot_runs(&name);
  name = name.split_whitespace().collect::<Vec<_>>().join(" ");
  name = trim_dots_and_spaces(&name);

  if !name.is_empty() {
    let stem = name.split('.').next().unwrap_or_default().to_ascii_uppercase();
    if RESERVED_NAMES.contains(&stem.as_str()) {
      name = format!("_{name}");
    }
  }

  if utf16_len(&name) > max_length {
    name = trim_dots_and_spaces(&truncate_utf16(&name, max_length));
  }

  if name.is_empty() {
    return fallback.to_string();
  }
  name
}

/// Rust port of `packages/clipper-core/safeName.ts`.
pub fn safe_name(input: &str) -> String {
  safe_name_with(input, MAX_NOTE_NAME_LEN, DEFAULT_NAME_FALLBACK)
}

fn strip_md_extension(value: &str) -> &str {
  match value
    .len()
    .checked_sub(3)
    .and_then(|index| value.get(index..).map(|tail| (index, tail)))
  {
    Some((index, tail)) if tail.eq_ignore_ascii_case(".md") => &value[..index],
    _ => value,
  }
}

/// Rust port of `normalizeNoteName` — always ends in `.md`, never a separator.
pub fn normalize_note_name(raw: &str) -> String {
  let stem = strip_md_extension(raw.trim());
  format!("{}.md", safe_name(stem))
}

/// Rust port of `normalizeFolder` — `/`-joined safe segments, never escaping.
pub fn normalize_folder(folder: &str) -> String {
  folder
    .replace('\\', "/")
    .split('/')
    .map(str::trim)
    .filter(|segment| !segment.is_empty() && *segment != "." && *segment != "..")
    .map(|segment| safe_name_with(segment, MAX_NOTE_NAME_LEN, FOLDER_SEGMENT_FALLBACK))
    .take(MAX_FOLDER_DEPTH)
    .collect::<Vec<_>>()
    .join("/")
}

/// Rust port of `isSafeRelativePath`.
pub fn is_safe_relative_path(path: &str) -> bool {
  if path.is_empty() || path.starts_with('/') || path.contains('\\') {
    return false;
  }
  path
    .split('/')
    .all(|segment| !segment.is_empty() && segment != "." && segment != "..")
}

/// `folder/noteName`, or just `noteName` at the vault root.
pub fn resolve_clip_path(folder: &str, note_name: &str) -> String {
  if folder.is_empty() {
    note_name.to_string()
  } else {
    format!("{folder}/{note_name}")
  }
}
