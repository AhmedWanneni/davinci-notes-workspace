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
    let state_true = TraySettingsState::new(true, "capture".into());
    assert!(state_true.keep_in_tray.load(Ordering::SeqCst));
    assert_eq!(*state_true.left_click_action.lock().unwrap(), "capture");
    assert!(!state_true.is_quitting.load(Ordering::SeqCst));

    let state_false = TraySettingsState::new(false, "menu".into());
    assert!(!state_false.keep_in_tray.load(Ordering::SeqCst));
    assert_eq!(*state_false.left_click_action.lock().unwrap(), "menu");
    assert!(!state_false.is_quitting.load(Ordering::SeqCst));
  }

  #[test]
  fn tray_settings_state_can_toggle_keep_in_tray() {
    let state = TraySettingsState::new(true, "capture".into());
    state.keep_in_tray.store(false, Ordering::SeqCst);
    assert!(!state.keep_in_tray.load(Ordering::SeqCst));
    state.keep_in_tray.store(true, Ordering::SeqCst);
    assert!(state.keep_in_tray.load(Ordering::SeqCst));
  }

  #[test]
  fn tray_settings_state_sets_quitting_atomic_flag() {
    let state = TraySettingsState::new(true, "capture".into());
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

  #[test]
  fn search_result_paths_outside_vault_are_rejected() {
    let vault = Path::new("/Users/user/Vault");
    assert!(!validate_recent_note_path("../../../etc/shadow", Some(vault)));
    assert!(!validate_recent_note_path("/private/var/db", Some(vault)));
    assert!(!validate_recent_note_path("notes/../../outside.md", Some(vault)));
    assert!(validate_recent_note_path("notes/inside.md", Some(vault)));
  }

  #[test]
  fn popover_position_top_menubar_centered() {
    use crate::tray_position::{calculate_popover_position, TrayIconBounds, WorkArea};
    use tauri::PhysicalSize;

    // Icon placed at x: 600 on 1440px screen (not near edge)
    let icon = TrayIconBounds { x: 600, y: 0, width: 30, height: 25 };
    let win_size = PhysicalSize::new(520, 160);
    let work_area = WorkArea { x: 0, y: 25, width: 1440, height: 875 };
    let pos = calculate_popover_position(icon, win_size, work_area, 1.0);

    // icon center = 615, win_w/2 = 260 -> 355
    assert_eq!(pos.x, 355);
    // top menubar -> below icon: 0 + 25 + 4 = 29
    assert_eq!(pos.y, 29);
  }

  #[test]
  fn popover_position_clamped_to_screen_edges() {
    use crate::tray_position::{calculate_popover_position, TrayIconBounds, WorkArea};
    use tauri::PhysicalSize;

    let win_size = PhysicalSize::new(520, 160);
    let work_area = WorkArea { x: 0, y: 25, width: 1440, height: 875 };

    // Near right edge (x: 1420 on 1440px screen):
    let icon_right = TrayIconBounds { x: 1420, y: 0, width: 20, height: 25 };
    let pos_right = calculate_popover_position(icon_right, win_size, work_area, 1.0);
    // max_x = 1440 - 520 - 8 = 912
    assert_eq!(pos_right.x, 912);

    // Near left edge (x: 5 on 1440px screen):
    let icon_left = TrayIconBounds { x: 5, y: 0, width: 20, height: 25 };
    let pos_left = calculate_popover_position(icon_left, win_size, work_area, 1.0);
    // min_x = 0 + 8 = 8
    assert_eq!(pos_left.x, 8);
  }

  #[test]
  fn popover_position_bottom_taskbar_anchors_above() {
    use crate::tray_position::{calculate_popover_position, TrayIconBounds, WorkArea};
    use tauri::PhysicalSize;

    // Windows bottom taskbar setup: screen 1920x1080, taskbar 40px at bottom
    // Icon at x: 800 (center of taskbar, not hitting edge clamp)
    let icon = TrayIconBounds { x: 800, y: 1045, width: 30, height: 35 };
    let win_size = PhysicalSize::new(520, 160);
    let work_area = WorkArea { x: 0, y: 0, width: 1920, height: 1040 };
    let pos = calculate_popover_position(icon, win_size, work_area, 1.0);

    assert_eq!(pos.x, 800 + 15 - 260); // 555
    // icon.y (1045) is in lower half -> anchors ABOVE: clamped to work area max_y (880)
    assert_eq!(pos.y, 880);
  }


  #[test]
  fn popover_position_secondary_monitor_retina() {
    use crate::tray_position::{calculate_popover_position, TrayIconBounds, WorkArea};
    use tauri::PhysicalSize;

    // Secondary monitor offset at x=1920, scale=2.0
    let scale = 2.0;
    let icon = TrayIconBounds { x: 3000, y: 0, width: 60, height: 50 };
    let win_size = PhysicalSize::new((520.0 * scale) as u32, (160.0 * scale) as u32); // 1040 x 320
    let work_area = WorkArea { x: 1920, y: 50, width: 2880, height: 1750 };
    let pos = calculate_popover_position(icon, win_size, work_area, scale);

    // icon center = 3030, desired_x = 3030 - 520 = 2510
    assert_eq!(pos.x, 2510);
    // icon.y (0) in upper half -> des_y = 0 + 50 + 8 = 58
    assert_eq!(pos.y, 58);
  }

  #[test]
  fn capture_state_blur_debounce_tracking() {
    let state = crate::capture::CaptureState::new("Control+Alt+N".into(), "Inbox.md".into());
    assert!(!state.is_recently_blurred());

    state.record_blur();
    assert!(state.is_recently_blurred());
  }

  #[test]
  fn tray_click_action_defaults_match_design() {
    use crate::tray_config::{DEFAULT_TRAY_CLICK_ACTION_EXISTING, DEFAULT_TRAY_CLICK_ACTION_NEW};
    assert_eq!(DEFAULT_TRAY_CLICK_ACTION_NEW, "capture");
    assert_eq!(DEFAULT_TRAY_CLICK_ACTION_EXISTING, "menu");
  }
}


