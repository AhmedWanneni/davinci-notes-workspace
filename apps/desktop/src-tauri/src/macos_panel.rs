use tauri::{Manager, WebviewWindow, Window};
use tauri_nspanel::objc2_app_kit::NSWindowStyleMask;
use tauri_nspanel::{
  tauri_panel, CollectionBehavior, ManagerExt, Panel, PanelLevel, WebviewWindowExt,
};

use crate::command_auth::CAPTURE_WINDOW_LABEL;

tauri_panel! {
  panel!(QuickCapturePanel {
    config: {
      can_become_key_window: true,
      is_floating_panel: true,
    }
  })
}

pub fn setup_capture_panel(window: &WebviewWindow) -> Result<(), String> {
  let panel_handle = window
    .to_panel::<QuickCapturePanel>()
    .map_err(|e| format!("Failed to convert capture window to NSPanel: {e}"))?;

  let panel = panel_handle
    .as_any()
    .downcast_ref::<QuickCapturePanel>()
    .ok_or_else(|| "Failed to downcast panel to QuickCapturePanel".to_string())?;

  panel.set_level(PanelLevel::Status.value());
  panel.set_floating_panel(true);

  let behavior = CollectionBehavior::new()
    .can_join_all_spaces()
    .full_screen_auxiliary();
  panel.set_collection_behavior(behavior.value());

  let current_mask = panel.as_panel().styleMask();
  let nonactivating_mask = current_mask | NSWindowStyleMask::NonactivatingPanel;
  let _ = panel.set_style_mask(nonactivating_mask);

  Ok(())
}

pub fn show_capture_panel(window: &WebviewWindow) -> Result<(), String> {
  let app = window.app_handle();
  if let Ok(panel_handle) = app.get_webview_panel(CAPTURE_WINDOW_LABEL) {
    if let Some(panel) = panel_handle.as_any().downcast_ref::<QuickCapturePanel>() {
      panel.order_front_regardless();
      panel.make_key_window();
      return Ok(());
    }
  }

  let _ = window.show();
  let _ = window.set_focus();
  Ok(())
}

pub fn is_capture_panel_visible(window: &Window) -> bool {
  let app = window.app_handle();
  if let Ok(panel) = app.get_webview_panel(CAPTURE_WINDOW_LABEL) {
    panel.is_visible()
  } else {
    window.is_visible().unwrap_or(false)
  }
}

pub fn hide_capture_panel(window: &Window) -> Result<(), String> {
  let app = window.app_handle();
  if let Ok(panel) = app.get_webview_panel(CAPTURE_WINDOW_LABEL) {
    panel.hide();
  } else {
    let _ = window.hide();
  }
  Ok(())
}
