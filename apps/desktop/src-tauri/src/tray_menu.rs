use std::path::Path;
use serde::{Deserialize, Serialize};
#[cfg(target_os = "macos")]
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
#[cfg(target_os = "macos")]
use tauri::{AppHandle, Wry};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RecentNoteItem {
  pub path: String,
  pub title: String,
}

pub const MAX_RECENT_NOTES: usize = 5;
pub const MAX_TITLE_CHARS: usize = 40;

pub fn sanitize_title(raw: &str) -> String {
  let single_line = raw.replace(['\r', '\n'], " ");
  let trimmed = single_line.trim();
  if trimmed.is_empty() {
    return "Untitled".to_string();
  }
  let char_count = trimmed.chars().count();
  if char_count > MAX_TITLE_CHARS {
    let truncated: String = trimmed.chars().take(MAX_TITLE_CHARS - 3).collect();
    format!("{truncated}...")
  } else {
    trimmed.to_string()
  }
}

pub fn disambiguate_titles(items: &[RecentNoteItem]) -> Vec<String> {
  let mut titles = Vec::with_capacity(items.len());
  for (i, item) in items.iter().enumerate() {
    let base_title = sanitize_title(&item.title);
    let has_duplicate = items
      .iter()
      .enumerate()
      .any(|(j, other)| i != j && sanitize_title(&other.title) == base_title);

    if has_duplicate {
      let parent = Path::new(&item.path)
        .parent()
        .and_then(|p| p.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("root");
      titles.push(format!("{base_title} ({parent})"));
    } else {
      titles.push(base_title);
    }
  }
  titles
}

pub fn validate_recent_note_path(path: &str, vault_root: Option<&Path>) -> bool {
  if path.is_empty() {
    return false;
  }
  let p = Path::new(path);
  if p.is_absolute() {
    return false;
  }
  for component in p.components() {
    if let std::path::Component::ParentDir = component {
      return false;
    }
  }
  if let Some(root) = vault_root {
    let full = root.join(p);
    if !full.starts_with(root) {
      return false;
    }
  }
  true
}

#[cfg(target_os = "macos")]
pub fn build_tray_menu(
  app: &AppHandle,
  has_vault: bool,
  recent_notes: &[RecentNoteItem],
) -> tauri::Result<Menu<Wry>> {
  let menu = Menu::new(app)?;
  let show_hide = MenuItem::with_id(app, "tray-show-hide", "Show/Hide window", true, None::<&str>)?;
  let quick_capture = MenuItem::with_id(app, "tray-quick-capture", "Quick capture", true, None::<&str>)?;
  let new_note = MenuItem::with_id(app, "tray-new-note", "New note", has_vault, None::<&str>)?;
  let daily_note = MenuItem::with_id(
    app,
    "tray-daily-note",
    "Open today's daily note",
    has_vault,
    None::<&str>,
  )?;

  let sep1 = PredefinedMenuItem::separator(app)?;
  let sep2 = PredefinedMenuItem::separator(app)?;
  let sep3 = PredefinedMenuItem::separator(app)?;

  let open_vault = MenuItem::with_id(app, "tray-open-vault", "Open vault...", true, None::<&str>)?;
  let quit = MenuItem::with_id(app, "tray-quit", "Quit", true, None::<&str>)?;

  menu.append(&show_hide)?;
  menu.append(&quick_capture)?;
  menu.append(&new_note)?;
  menu.append(&daily_note)?;
  menu.append(&sep1)?;

  let display_titles = disambiguate_titles(recent_notes);
  let capped_count = recent_notes.len().min(MAX_RECENT_NOTES);

  if capped_count == 0 {
    let empty_label = if has_vault {
      "No recent notes"
    } else {
      "No vault open"
    };
    let empty_item = MenuItem::with_id(app, "tray-recent-empty", empty_label, false, None::<&str>)?;
    menu.append(&empty_item)?;
  } else {
    for idx in 0..capped_count {
      let item_id = format!("tray-recent:{idx}");
      let title = &display_titles[idx];
      let menu_item = MenuItem::with_id(app, item_id, title, true, None::<&str>)?;
      menu.append(&menu_item)?;
    }
  }

  menu.append(&sep2)?;
  menu.append(&open_vault)?;
  menu.append(&sep3)?;
  menu.append(&quit)?;

  Ok(menu)
}
