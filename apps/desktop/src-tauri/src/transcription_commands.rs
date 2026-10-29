use tauri::WebviewWindow;

use crate::command_auth::reject_plugin_runner;
use crate::transcription::TranscriptSegment;
use crate::transcription_cloud::send_whisper_transcription;

#[tauri::command]
pub async fn transcribe_audio_chunk(
  window: WebviewWindow,
  wav_bytes: Vec<u8>,
  api_key: String,
  endpoint: Option<String>,
  model: Option<String>,
) -> Result<Vec<TranscriptSegment>, String> {
  reject_plugin_runner(&window)?;
  send_whisper_transcription(
    wav_bytes,
    &api_key,
    endpoint.as_deref(),
    model.as_deref(),
  )
  .await
}

#[tauri::command]
pub async fn transcribe_audio_file(
  window: WebviewWindow,
  file_path: String,
  api_key: String,
  endpoint: Option<String>,
  model: Option<String>,
) -> Result<Vec<TranscriptSegment>, String> {
  reject_plugin_runner(&window)?;
  let path = std::path::Path::new(&file_path);
  let bytes = std::fs::read(path).map_err(|e| format!("Failed to read audio file: {e}"))?;

  send_whisper_transcription(
    bytes,
    &api_key,
    endpoint.as_deref(),
    model.as_deref(),
  )
  .await
}
