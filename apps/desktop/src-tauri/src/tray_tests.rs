#[cfg(test)]
mod tests {
  use std::path::Path;
  use std::sync::atomic::Ordering;
  use crate::tray::{
    TraySettingsState, CLEAN_QUIT_EVENT, TRAY_DAILY_NOTE_EVENT, TRAY_NEW_NOTE_EVENT,
    TRAY_OPEN_NOTE_EVENT, TRAY_OPEN_VAULT_EVENT, TRAY_QUIT_EVENT, WINDOW_HIDDEN_EVENT,
  };
  use crate::tray_menu::{
    disambiguate_titles, sanitize_title, validate_recent_note_path, RecentNoteItem,
  };

  #[test]
  fn tray_settings_state_initializes_with_default() {
    let state_true = TraySettingsState::new(true);
    assert!(state_true.keep_in_tray.load(Ordering::SeqCst));
    assert!(!state_true.is_quitting.load(Ordering::SeqCst));

    let state_false = TraySettingsState::new(false);
    assert!(!state_false.keep_in_tray.load(Ordering::SeqCst));
    assert!(!state_false.is_quitting.load(Ordering::SeqCst));
  }

  #[test]
  fn tray_settings_state_can_toggle_keep_in_tray() {
    let state = TraySettingsState::new(true);
    state.keep_in_tray.store(false, Ordering::SeqCst);
    assert!(!state.keep_in_tray.load(Ordering::SeqCst));
    state.keep_in_tray.store(true, Ordering::SeqCst);
    assert!(state.keep_in_tray.load(Ordering::SeqCst));
  }

  #[test]
  fn tray_settings_state_sets_quitting_atomic_flag() {
    let state = TraySettingsState::new(true);
    assert!(!state.is_quitting.swap(true, Ordering::SeqCst));
    assert!(state.is_quitting.load(Ordering::SeqCst));
    assert!(state.is_quitting.swap(true, Ordering::SeqCst));
  }

  #[test]
  fn tray_event_names_are_stable() {
    assert_eq!(TRAY_NEW_NOTE_EVENT, "davinci-tray-new-note");
    assert_eq!(TRAY_DAILY_NOTE_EVENT, "davinci-tray-daily-note");
    assert_eq!(TRAY_OPEN_NOTE_EVENT, "davinci-tray-open-note");
    assert_eq!(TRAY_OPEN_VAULT_EVENT, "davinci-tray-open-vault");
    assert_eq!(TRAY_QUIT_EVENT, "davinci-tray-quit");
    assert_eq!(CLEAN_QUIT_EVENT, "davinci-clean-quit");
    assert_eq!(WINDOW_HIDDEN_EVENT, "davinci-window-hidden");
  }

  #[test]
  fn sanitize_title_handles_whitespace_truncation_and_unicode() {
    assert_eq!(sanitize_title(""), "Untitled");
    assert_eq!(sanitize_title("   \n\t  "), "Untitled");
    assert_eq!(sanitize_title("Simple Title"), "Simple Title");
    assert_eq!(sanitize_title("Line 1\nLine 2"), "Line 1 Line 2");

    let long_title = "This is a very long title that definitely exceeds forty characters by a wide margin";
    let sanitized = sanitize_title(long_title);
    assert_eq!(sanitized.chars().count(), 40);
    assert!(sanitized.ends_with("..."));

    let emoji_title = "🦀 Rust Notes with emoji 🚀";
    assert_eq!(sanitize_title(emoji_title), emoji_title);
  }

  #[test]
  fn disambiguate_titles_adds_parent_folder_for_duplicates() {
    let items = vec![
      RecentNoteItem { path: "work/project/spec.md".into(), title: "spec".into() },
      RecentNoteItem { path: "personal/spec.md".into(), title: "spec".into() },
      RecentNoteItem { path: "readme.md".into(), title: "readme".into() },
    ];
    let titles = disambiguate_titles(&items);
    assert_eq!(titles, vec![
      "spec (work/project)",
      "spec (personal)",
      "readme",
    ]);

    let root_duplicates = vec![
      RecentNoteItem { path: "notes.md".into(), title: "notes".into() },
      RecentNoteItem { path: "archive/notes.md".into(), title: "notes".into() },
    ];
    let root_titles = disambiguate_titles(&root_duplicates);
    assert_eq!(root_titles, vec![
      "notes (root)",
      "notes (archive)",
    ]);
  }

  #[test]
  fn validate_recent_note_path_enforces_safety() {
    let vault = Path::new("/Users/user/Vault");

    assert!(validate_recent_note_path("note.md", Some(vault)));
    assert!(validate_recent_note_path("folder/sub/note.md", Some(vault)));
    assert!(validate_recent_note_path("note.md", None));

    assert!(!validate_recent_note_path("", Some(vault)));
    assert!(!validate_recent_note_path("/etc/passwd", Some(vault)));
    assert!(!validate_recent_note_path("../outside.md", Some(vault)));
    assert!(!validate_recent_note_path("sub/../../outside.md", Some(vault)));
  }
}
