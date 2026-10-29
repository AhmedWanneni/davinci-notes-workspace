use tauri::{AppHandle, State, WebviewWindow};

use crate::audio_capture::AudioCaptureManager;
use crate::audio_types::{MeetingAudioResult, RecordingStatusResponse};
use crate::command_auth::reject_plugin_runner;

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
