use crate::command_auth::reject_plugin_runner;
#[cfg(target_os = "macos")]
use tauri::{
  image::Image,
  menu::{Menu, MenuItem, PredefinedMenuItem},
  tray::TrayIconBuilder,
  Emitter, Manager,
};
use tauri::{AppHandle, WebviewWindow};

#[cfg(target_os = "macos")]
const MAIN_WINDOW: &str = "main";
#[cfg(target_os = "macos")]
const TRAY_NEW_NOTE_EVENT: &str = "davinci-tray-new-note";
#[cfg(target_os = "macos")]
const TRAY_QUIT_EVENT: &str = "davinci-tray-quit";

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
  #[cfg(target_os = "macos")]
  setup_macos_tray(app)?;
  #[cfg(not(target_os = "macos"))]
  let _ = app;
  Ok(())
}

#[cfg(target_os = "macos")]
fn setup_macos_tray(app: &AppHandle) -> tauri::Result<()> {
  let show_hide = MenuItem::with_id(app, "tray-show-hide", "Show/Hide window", true, None::<&str>)?;
  let new_note = MenuItem::with_id(app, "tray-new-note", "New note", true, None::<&str>)?;
  let quit = MenuItem::with_id(app, "tray-quit", "Quit", true, None::<&str>)?;
  let separator = PredefinedMenuItem::separator(app)?;
  let menu = Menu::with_items(app, &[&show_hide, &new_note, &separator, &quit])?;
  let icon = Image::new(include_bytes!("../icons/tray-icon@2x.rgba"), 44, 44);

  TrayIconBuilder::with_id("davinci-tray")
    .icon(icon)
    .icon_as_template(true)
    .tooltip("DaVinci Notes")
    .menu(&menu)
    .show_menu_on_left_click(true)
    .on_menu_event(|app, event| match event.id.as_ref() {
      "tray-show-hide" => toggle_main_window(app),
      "tray-new-note" => new_note_from_tray(app),
      "tray-quit" => request_quit_from_tray(app),
      _ => {}
    })
    .build(app)?;

  Ok(())
}

#[cfg(target_os = "macos")]
fn toggle_main_window(app: &AppHandle) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
    return;
  };
  let minimized = window.is_minimized().unwrap_or(false);
  let visible = window.is_visible().unwrap_or(false);
  if visible && !minimized {
    let _ = window.hide();
    return;
  }
  show_main_window(&window);
}

#[cfg(target_os = "macos")]
fn show_main_window(window: &WebviewWindow) {
  let _ = window.unminimize();
  let _ = window.show();
  let _ = window.set_focus();
}

#[cfg(target_os = "macos")]
fn new_note_from_tray(app: &AppHandle) {
  let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
    return;
  };
  show_main_window(&window);
  let _ = window.emit(TRAY_NEW_NOTE_EVENT, ());
}

#[cfg(target_os = "macos")]
fn request_quit_from_tray(app: &AppHandle) {
  if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
    let _ = window.emit(TRAY_QUIT_EVENT, ());
    return;
  }
  app.exit(0);
}

#[tauri::command]
pub fn request_app_exit(window: WebviewWindow, app: AppHandle) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  app.exit(0);
  Ok(())
}
