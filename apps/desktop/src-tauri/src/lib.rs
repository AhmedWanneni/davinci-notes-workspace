mod db;
mod ai_auth;
mod fs;
mod git;
mod manifest;
mod oauth;
mod state;
mod watcher;

use state::VaultState;
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
    .invoke_handler(tauri::generate_handler![
      fs::open_vault,
      fs::start_vault_watcher,
      fs::set_vault_watcher_paused,
      fs::list_notes,
      manifest::list_manifest_files,
      manifest::hash_manifest_file,
      fs::list_folders,
      fs::get_file_tree,
      fs::read_note,
      fs::write_note,
      fs::write_binary_file,
      fs::create_folder,
      fs::rename_note,
      fs::rename_folder,
      fs::delete_note,
      git::initialize_local_git_repository,
      git::create_local_git_version,
      oauth::start_oauth_listener,
      oauth::wait_for_oauth_callback,
      oauth::open_external_url,
      oauth::save_drive_token,
      oauth::load_drive_token,
      oauth::clear_drive_token,
      ai_auth::save_ai_key,
      ai_auth::load_ai_key,
      ai_auth::clear_ai_key,
    ])
    .setup(|app| {
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
