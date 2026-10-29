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

pub fn set_dock_icon() {
  use tauri_nspanel::objc2::msg_send;
  use tauri_nspanel::objc2::MainThreadMarker;
  use tauri_nspanel::objc2::runtime::AnyObject;
  use tauri_nspanel::objc2_app_kit::NSApplication;

  if let Some(mtm) = MainThreadMarker::new() {
    let bytes = include_bytes!("../icons/icon.png");
    unsafe {
      let data: *mut AnyObject = msg_send![
        tauri_nspanel::objc2::class!(NSData),
        dataWithBytes: bytes.as_ptr(),
        length: bytes.len()
      ];
      if !data.is_null() {
        let alloc_img: *mut AnyObject = msg_send![tauri_nspanel::objc2::class!(NSImage), alloc];
        let image: *mut AnyObject = msg_send![alloc_img, initWithData: data];
        if !image.is_null() {
          let app = NSApplication::sharedApplication(mtm);
          let _: () = msg_send![&*app, setApplicationIconImage: image];
        }
      }
    }
  }
}

pub fn setup_notification_identity() {
  let bundle_id = "com.sophia.notes";

  if let Ok(home) = std::env::var("HOME") {
    let app_dir = std::path::PathBuf::from(home).join("Applications").join("Sophia.app");
    let macos_dir = app_dir.join("Contents").join("MacOS");
    let res_dir = app_dir.join("Contents").join("Resources");
    let plist_path = app_dir.join("Contents").join("Info.plist");

    let _ = std::fs::create_dir_all(&macos_dir);
    let _ = std::fs::create_dir_all(&res_dir);

    if !plist_path.exists() {
      let plist_content = r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.sophia.notes</string>
    <key>CFBundleName</key>
    <string>Sophia</string>
    <key>CFBundleDisplayName</key>
    <string>Sophia</string>
    <key>CFBundleExecutable</key>
    <string>davinci-notes-desktop</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>0.1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
</dict>
</plist>"#;
      let _ = std::fs::write(&plist_path, plist_content);
    }

    let icns_src = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
      .join("icons")
      .join("icon.icns");
    let icns_dst = res_dir.join("icon.icns");
    if icns_src.exists() && (!icns_dst.exists() || std::fs::metadata(&icns_dst).map(|m| m.len()).unwrap_or(0) == 0) {
      let _ = std::fs::copy(&icns_src, &icns_dst);
    }

    if let Ok(exe) = std::env::current_exe() {
      let exe_dst = macos_dir.join("davinci-notes-desktop");
      if !exe_dst.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink(&exe, &exe_dst);
      }
    }

    let _ = std::process::Command::new("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister")
      .arg("-f")
      .arg(&app_dir)
      .status();
  }

  let _ = mac_notification_sys::set_application(bundle_id);

  unsafe {
    use std::ops::Deref;
    use tauri_nspanel::objc2_foundation::NSString;
    extern "C" {
      fn setApplication(newbundleIdentifier: *const NSString) -> bool;
    }
    let ns_bundle = NSString::from_str(bundle_id);
    let _ = setApplication(ns_bundle.deref());
  }
}
