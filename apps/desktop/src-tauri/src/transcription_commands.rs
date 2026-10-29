use tauri::{AppHandle, Manager, WebviewWindow};

use crate::command_auth::reject_plugin_runner;
use crate::fs::resolve_in_vault;
use crate::state::VaultState;
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
  app: AppHandle,
  file_path: String,
  api_key: String,
  endpoint: Option<String>,
  model: Option<String>,
) -> Result<Vec<TranscriptSegment>, String> {
  reject_plugin_runner(&window)?;
  let candidate_path = std::path::Path::new(&file_path);
  let resolved_path = if candidate_path.exists() {
    candidate_path.to_path_buf()
  } else if let Some(vault) = app.try_state::<VaultState>() {
    let root = vault.get_root()?;
    resolve_in_vault(&root, &file_path)?
  } else {
    candidate_path.to_path_buf()
  };

  let bytes = std::fs::read(&resolved_path)
    .map_err(|e| format!("Failed to read audio file at {}: {e}", resolved_path.display()))?;

  send_whisper_transcription(
    bytes,
    &api_key,
    endpoint.as_deref(),
    model.as_deref(),
  )
  .await
}
