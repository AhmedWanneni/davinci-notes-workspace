mod ai_auth;
mod audio_capture;
mod audio_commands;
mod audio_mixer;
mod audio_types;
mod audio_worker;
#[cfg(test)]
mod audio_tests;
mod browser_bookmarks;
mod capture;
mod capture_commands;
mod capture_format;
mod capture_validation;
mod capture_writer;
mod clipper_attachments;
mod clipper_auth;
mod clipper_commands;
mod clipper_dispatch;
mod clipper_http;
mod clipper_ledger;
mod clipper_name_rules;
mod clipper_payload;
mod clipper_routes;
mod clipper_server;
mod clipper_validate;
#[cfg(test)]
mod capture_tests;
#[cfg(test)]
mod capture_options_tests;
mod command_auth;
mod db;
mod folder_commands;
mod fs;
mod git;
mod git_auth;
mod git_history;
mod git_manager_commands;
mod git_manager_ops;
mod git_manager_diff;
mod git_manager_log;
mod git_manager_branches;
mod git_manager_stash;
mod git_manager_remote;
mod git_manager_sync;
mod git_manager_conflicts;
mod git_manager_clone;
#[cfg(test)]
mod git_manager_conflict_tests;
mod git_remote;
#[cfg(target_os = "macos")]
mod macos_panel;
mod manifest;
mod notification_auth;
mod oauth;
mod plugin_files;
mod plugin_network;
mod plugin_webview;
mod recent_vaults;
#[cfg(test)]
mod recent_vaults_tests;
mod reminder_commands;
mod reminder_db;
mod reminder_notify;
mod reminder_scheduler;
#[cfg(test)]
mod reminder_tests;
mod state;
mod syncthing;
mod theme_files;
mod transcription;
mod transcription_cloud;
mod transcription_commands;
mod tray;
mod tray_commands;
mod tray_config;
mod tray_menu;
mod tray_position;
#[cfg(test)]
mod fs_tests;
#[cfg(test)]
mod tray_tests;
#[cfg(test)]
mod clipper_attachments_tests;
#[cfg(test)]
mod clipper_ledger_tests;
#[cfg(test)]
mod clipper_auth_tests;
#[cfg(test)]
mod clipper_target_tests;
#[cfg(test)]
mod clipper_test_harness;
#[cfg(test)]
mod clipper_transport_tests;
#[cfg(test)]
mod clipper_validate_tests;
mod watcher;

use state::VaultState;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use watcher::VaultWatcher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[allow(unused_mut)]
  let mut builder = tauri::Builder::default();

  #[cfg(target_os = "macos")]
  {
    builder = builder.plugin(tauri_nspanel::init());
  }

  builder
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations(db::DB_URL, db::migrations())
        .build(),
    )
    .manage(VaultState::new())
    .manage(VaultWatcher::new())
    .manage(oauth::OAuthListenerState::default())
    .manage(clipper_server::ClipperState::new())
    .manage(plugin_webview::PluginProbeState::default())
    .manage(plugin_network::PluginNetworkClient::new().expect("plugin network client must initialize"))
    .manage(syncthing::SyncthingManager::new())
    .manage(audio_capture::AudioCaptureManager::default())
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
      fs::stat_note,
      theme_files::read_theme_file,
      fs::write_note,
      fs::read_binary_file,
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
      git_manager_commands::get_git_repo_info,
      git_manager_commands::init_git_repository,
      git_manager_commands::git_manager_status,
      git_manager_ops::git_manager_stage,
      git_manager_ops::git_manager_unstage,
      git_manager_ops::git_manager_discard,
      git_manager_ops::git_manager_commit,
      git_manager_diff::git_manager_get_file_diff,
      git_manager_diff::git_manager_apply_patch,
      git_manager_log::git_manager_get_log,
      git_manager_log::git_manager_get_commit_details,
      git_manager_branches::git_manager_list_branches,
      git_manager_branches::git_manager_switch_branch,
      git_manager_branches::git_manager_create_branch,
      git_manager_branches::git_manager_delete_branch,
      git_manager_stash::git_manager_stash,
      git_manager_stash::git_manager_stash_pop,
      git_manager_remote::git_manager_get_remotes,
      git_manager_remote::git_manager_set_remote,
      git_manager_remote::git_manager_get_tracking_status,
      git_manager_sync::git_manager_fetch,
      git_manager_sync::git_manager_pull,
      git_manager_sync::git_manager_push,
      git_manager_conflicts::git_manager_get_conflict_details,
      git_manager_conflicts::git_manager_resolve_conflict,
      git_manager_conflicts::git_manager_abort_merge,
      git_manager_conflicts::git_manager_continue_merge,
      git_manager_clone::git_manager_clone_repo,
      oauth::start_oauth_listener,
      oauth::wait_for_oauth_callback,
      oauth::open_external_url,
      oauth::save_drive_token,
      oauth::load_drive_token,
      oauth::clear_drive_token,
      clipper_commands::clipper_enable,
      clipper_commands::clipper_disable,
      clipper_commands::clipper_status,
      clipper_commands::clipper_reveal_token,
      clipper_commands::clipper_rotate_token,
      clipper_commands::clipper_revoke_token,
      clipper_commands::clipper_submit_result,
      clipper_attachments::clipper_fetch_attachment,
      clipper_ledger::clipper_check_duplicate,
      clipper_ledger::clipper_record_written,
      oauth::save_calendar_token,
      oauth::load_calendar_token,
      oauth::clear_calendar_token,
      ai_auth::save_ai_key,
      ai_auth::load_ai_key,
      ai_auth::clear_ai_key,
      notification_auth::save_notification_secret,
      notification_auth::load_notification_secret,
      notification_auth::clear_notification_secret,
      reminder_notify::send_desktop_notification_command,
      audio_commands::start_meeting_recording,
      audio_commands::pause_meeting_recording,
      audio_commands::resume_meeting_recording,
      audio_commands::stop_meeting_recording,
      audio_commands::get_meeting_recording_status,
      audio_commands::list_audio_input_devices,
      audio_commands::save_recorded_audio_to_vault,
      transcription_commands::transcribe_audio_chunk,
      transcription_commands::transcribe_audio_file,
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
      tray_commands::get_keep_in_tray, tray_commands::set_keep_in_tray,
      tray_commands::get_tray_click_action, tray_commands::set_tray_click_action,
      tray_commands::update_tray_recent_notes, tray_commands::update_tray_reminders,
      tray_commands::request_app_exit,
      capture_commands::quick_capture_save, capture_commands::quick_capture_dismiss,
      capture_commands::reclamp_capture_popover, capture_commands::list_vault_folders_for_capture,
      capture_commands::open_note_from_capture, capture_commands::quick_capture_bring_to_front,
      capture_commands::get_capture_shortcut, capture_commands::set_capture_shortcut,
      capture_commands::get_capture_target, capture_commands::set_capture_target,
      recent_vaults::get_recent_vaults, recent_vaults::record_recent_vault,
      recent_vaults::remove_recent_vault, recent_vaults::check_vault_exists,
      recent_vaults::stop_vault_watcher,
      reminder_commands::reschedule_reminders, reminder_commands::snooze_reminder,
      reminder_commands::dismiss_reminder,
      syncthing::syncthing_detect, syncthing::syncthing_status, syncthing::syncthing_qr_png,
      syncthing::syncthing_add_device, syncthing::syncthing_pending_devices,
      syncthing::syncthing_accept_device, syncthing::syncthing_dismiss_pending_device,
      syncthing::syncthing_share_vault_folder, syncthing::syncthing_pending_folders,
      syncthing::syncthing_accept_folder, syncthing::syncthing_check_sync,
      syncthing::syncthing_start, syncthing::syncthing_stop,
      syncthing::syncthing_restart, syncthing::syncthing_lifecycle_status,
      syncthing::syncthing_ensure_vault_registered,
      browser_bookmarks::detect_browser_bookmarks,
      browser_bookmarks::read_browser_bookmarks,
    ])
    .on_window_event(|window, event| {
      if window.label() == tray::MAIN_WINDOW {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
          if tray::handle_window_close_requested(window) {
            api.prevent_close();
          } else if let Some(mgr) = window.app_handle().try_state::<syncthing::SyncthingManager>() {
            mgr.shutdown_on_exit(window.app_handle());
          }
        }
      } else if window.label() == command_auth::CAPTURE_WINDOW_LABEL {
        match event {
          tauri::WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            #[cfg(target_os = "macos")]
            let _ = macos_panel::hide_capture_panel(window);
            #[cfg(not(target_os = "macos"))]
            let _ = window.hide();
          }
          tauri::WindowEvent::Focused(false) => {
            if let Some(state) = window.app_handle().try_state::<capture::CaptureState>() {
              state.record_blur();
            }
            #[cfg(target_os = "macos")]
            let _ = macos_panel::hide_capture_panel(window);
            #[cfg(not(target_os = "macos"))]
            let _ = window.hide();
          }
          tauri::WindowEvent::Focused(true) => {
            capture::make_window_topmost(window);
          }
          _ => {}
        }
      }
    })
    .setup(|app| {
      let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("Sophia")
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

      #[cfg(target_os = "macos")]
      {
        macos_panel::set_dock_icon();
        macos_panel::setup_notification_identity();
      }

      tray::setup(app.handle())?;
      capture::setup(app.handle())?;

      if let Some(db_path) = reminder_db::get_db_path(app.handle()) {
        let scheduler = std::sync::Arc::new(reminder_scheduler::ReminderScheduler::new(
          app.handle().clone(),
          db_path,
        ));
        app.manage(scheduler.clone());
        scheduler.start();
      }

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
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| match event {
      tauri::RunEvent::ExitRequested { code, api, .. } => {
        if code.is_none() {
          let tray_state = app_handle.try_state::<tray::TraySettingsState>();
          let is_quitting = tray_state
            .as_ref()
            .map(|s| s.is_quitting.load(std::sync::atomic::Ordering::SeqCst))
            .unwrap_or(false);
          if !is_quitting {
            api.prevent_exit();
            tray::trigger_clean_quit(app_handle);
          }
        }
      }
      #[cfg(target_os = "macos")]
      tauri::RunEvent::Reopen {
        has_visible_windows,
        ..
      } => {
        if !has_visible_windows {
          if let Some(window) = app_handle.get_webview_window(tray::MAIN_WINDOW) {
            tray::show_main_window(&window);
          }
        }
      }
      _ => {}
    });
}
