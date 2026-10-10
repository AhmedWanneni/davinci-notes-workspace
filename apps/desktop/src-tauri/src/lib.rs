mod db;
mod ai_auth;
mod command_auth;
mod folder_commands;
mod fs;
mod git;
mod git_auth;
mod git_history;
mod git_remote;
mod manifest;
mod oauth;
mod plugin_webview;
mod plugin_files;
mod plugin_network;
mod state;
mod theme_files;
mod watcher;

use state::VaultState;
use tauri::{WebviewUrl, WebviewWindowBuilder};
use watcher::VaultWatcher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations(db::DB_URL, db::migrations())
        .build(),
    )
    .manage(VaultState::new())
    .manage(VaultWatcher::new())
    .manage(oauth::OAuthListenerState::default())
    .manage(plugin_webview::PluginProbeState::default())
    .manage(plugin_network::PluginNetworkClient::new().expect("plugin network client must initialize"))
    .invoke_handler(tauri::generate_handler![
      fs::open_vault,
      fs::start_vault_watcher,
      fs::set_vault_watcher_paused,
      fs::list_notes,
      manifest::list_manifest_files,
      manifest::hash_manifest_file,
      fs::list_folders,
      plugin_files::list_plugin_directories,
      plugin_files::read_plugin_file,
      plugin_files::write_plugin_file,
      theme_files::list_theme_directories,
      fs::get_file_tree,
      fs::read_note,
      theme_files::read_theme_file,
      fs::write_note,
      fs::write_binary_file,
      fs::create_folder,
      fs::rename_note,
      fs::rename_folder,
      fs::delete_note,
      fs::delete_folder,
      git::initialize_local_git_repository,
      git::create_local_git_version,
      git_auth::save_git_pat,
      git_auth::load_git_pat,
      git_auth::clear_git_pat,
      git_remote::validate_git_remote,
      git_history::list_local_git_versions,
      git_history::read_local_git_version,
      git_history::restore_local_git_version,
      oauth::start_oauth_listener,
      oauth::wait_for_oauth_callback,
      oauth::open_external_url,
      oauth::save_drive_token,
      oauth::load_drive_token,
      oauth::clear_drive_token,
      ai_auth::save_ai_key,
      ai_auth::load_ai_key,
      ai_auth::clear_ai_key,
      plugin_network::plugin_network_request,
      plugin_webview::start_plugin_webview_probe,
      plugin_webview::ensure_plugin_webview,
      plugin_webview::plugin_webview_exists,
      plugin_webview::start_plugin_webview_synthetic_probe,
      plugin_webview::plugin_webview_booted,
      plugin_webview::plugin_webview_script_error,
      plugin_webview::plugin_webview_listening,
      plugin_webview::plugin_webview_send,
      plugin_webview::plugin_webview_request,
      plugin_webview::plugin_webview_response,
    ])
    .setup(|app| {
      let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("DaVinci Notes")
        .inner_size(1200.0, 800.0)
        .min_inner_size(640.0, 480.0)
        .resizable(true)
        .disable_drag_drop_handler()
        .fullscreen(false);

      #[cfg(target_os = "macos")]
      let window = window.decorations(false).transparent(true);

      #[cfg(target_os = "windows")]
      let window = window.decorations(false).shadow(true);

      #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
      let window = window.decorations(false);

      window.build()?;

      if std::env::var_os("DAVINCI_PLUGIN_RPC_PROBE").is_some() {
        println!("[plugin-rpc] probe requested");
        plugin_webview::create_plugin_webview(&app.handle())?;
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
