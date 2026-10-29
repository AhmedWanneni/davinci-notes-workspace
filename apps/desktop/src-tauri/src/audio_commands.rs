use tauri::{AppHandle, Manager, State, WebviewWindow};

use crate::audio_capture::AudioCaptureManager;
use crate::audio_types::{MeetingAudioResult, RecordingStatusResponse};
use crate::command_auth::reject_plugin_runner;
use crate::fs::resolve_in_vault;
use crate::state::VaultState;

#[tauri::command]
pub fn start_meeting_recording(
  window: WebviewWindow,
  app: AppHandle,
  manager: State<AudioCaptureManager>,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  manager.start(app)
}

#[tauri::command]
pub fn pause_meeting_recording(
  window: WebviewWindow,
  manager: State<AudioCaptureManager>,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  manager.pause()
}

#[tauri::command]
pub fn resume_meeting_recording(
  window: WebviewWindow,
  manager: State<AudioCaptureManager>,
) -> Result<(), String> {
  reject_plugin_runner(&window)?;
  manager.resume()
}

#[tauri::command]
pub fn stop_meeting_recording(
  window: WebviewWindow,
  manager: State<AudioCaptureManager>,
) -> Result<MeetingAudioResult, String> {
  reject_plugin_runner(&window)?;
  manager.stop()
}

#[tauri::command]
pub fn get_meeting_recording_status(
  window: WebviewWindow,
  manager: State<AudioCaptureManager>,
) -> Result<RecordingStatusResponse, String> {
  reject_plugin_runner(&window)?;
  let status = manager.get_status();
  let elapsed = manager.get_elapsed_seconds();
  let sample_count = manager
    .pcm_buffer
    .lock()
    .map(|b| b.len())
    .unwrap_or(0);

  Ok(RecordingStatusResponse {
    status,
    elapsed_seconds: elapsed,
    sample_count,
  })
}

#[tauri::command]
pub fn list_audio_input_devices(window: WebviewWindow) -> Result<Vec<String>, String> {
  reject_plugin_runner(&window)?;
  AudioCaptureManager::list_devices()
}

#[tauri::command]
pub fn save_recorded_audio_to_vault(
  window: WebviewWindow,
  app: AppHandle,
  temp_wav_path: String,
  destination_rel_path: String,
) -> Result<String, String> {
  reject_plugin_runner(&window)?;
  let vault_root = app.state::<VaultState>().get_root()?;
  let dest_abs = resolve_in_vault(&vault_root, &destination_rel_path)?;
  if let Some(parent) = dest_abs.parent() {
    let _ = std::fs::create_dir_all(parent);
  }
  std::fs::copy(&temp_wav_path, &dest_abs)
    .map_err(|e| format!("Failed to copy WAV audio: {e}"))?;
  Ok(destination_rel_path)
}
