#[cfg(test)]
mod tests {
  use crate::tray::{TraySettingsState, CLEAN_QUIT_EVENT, TRAY_NEW_NOTE_EVENT, TRAY_QUIT_EVENT, WINDOW_HIDDEN_EVENT};
  use std::sync::atomic::Ordering;

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
    // Second swap returns true
    assert!(state.is_quitting.swap(true, Ordering::SeqCst));
  }

  #[test]
  fn tray_event_names_are_stable() {
    assert_eq!(TRAY_NEW_NOTE_EVENT, "davinci-tray-new-note");
    assert_eq!(TRAY_QUIT_EVENT, "davinci-tray-quit");
    assert_eq!(CLEAN_QUIT_EVENT, "davinci-clean-quit");
    assert_eq!(WINDOW_HIDDEN_EVENT, "davinci-window-hidden");
  }
}
