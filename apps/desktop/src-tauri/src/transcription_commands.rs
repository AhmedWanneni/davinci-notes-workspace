use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State, WebviewWindow};

use crate::ai_auth::resolve_whisper_api_key;
use crate::audio_capture::AudioCaptureManager;
use crate::audio_mixer::{
  calculate_rms_level, create_wav_header, f32_to_i16_pcm, TARGET_SAMPLE_RATE,
};
use crate::command_auth::reject_plugin_runner;
use crate::fs::resolve_in_vault;
use crate::state::VaultState;
use crate::transcription::TranscriptSegment;
use crate::transcription_cloud::send_whisper_transcription;
use crate::transcription_local::find_local_whisper_binary;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveChunkTranscriptionResult {
  pub next_sample: usize,
  pub segments: Vec<TranscriptSegment>,
  pub engine_used: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionToolsStatus {
  pub groq_configured: bool,
  pub local_whisper_installed: bool,
  pub local_whisper_binary: Option<String>,
}

#[tauri::command]
pub fn detect_transcription_tools(window: WebviewWindow) -> Result<TranscriptionToolsStatus, String> {
  reject_plugin_runner(&window)?;
  let groq_configured = resolve_whisper_api_key("").is_some();
  let local = find_local_whisper_binary();
  Ok(TranscriptionToolsStatus {
    groq_configured,
    local_whisper_installed: local.is_some(),
    local_whisper_binary: local.map(|(name, _)| name),
  })
}

#[tauri::command]
pub async fn transcribe_live_recording_chunk(
  window: WebviewWindow,
  manager: State<'_, AudioCaptureManager>,
  start_sample: usize,
  api_key: Option<String>,
  endpoint: Option<String>,
  model: Option<String>,
) -> Result<LiveChunkTranscriptionResult, String> {
  reject_plugin_runner(&window)?;

  let (slice, next_sample) = {
    let buf = manager
      .pcm_buffer
      .lock()
      .map_err(|_| "Failed to lock audio buffer".to_string())?;
    let total = buf.len();
    if total <= start_sample || (total - start_sample) < (TARGET_SAMPLE_RATE as usize * 2) {
      return Ok(LiveChunkTranscriptionResult {
        next_sample: start_sample,
        segments: Vec::new(),
        engine_used: "idle".to_string(),
      });
    }
    (buf[start_sample..total].to_vec(), total)
  };

  let rms = calculate_rms_level(&slice);
  if rms < 0.0035 {
    return Ok(LiveChunkTranscriptionResult {
      next_sample,
      segments: Vec::new(),
      engine_used: "silence".to_string(),
    });
  }

  let i16_samples = f32_to_i16_pcm(&slice);
  let pcm_bytes: Vec<u8> = i16_samples.iter().flat_map(|&s| s.to_le_bytes()).collect();
  let header = create_wav_header(pcm_bytes.len(), TARGET_SAMPLE_RATE, 1);
  let mut wav_bytes = Vec::with_capacity(44 + pcm_bytes.len());
  wav_bytes.extend_from_slice(&header);
  wav_bytes.extend_from_slice(&pcm_bytes);

  let key_str = api_key.unwrap_or_default();
  let has_cloud_key = resolve_whisper_api_key(&key_str).is_some();
  let engine_used = if endpoint.as_deref() == Some("local") || model.as_deref() == Some("local-whisper") {
    "local-whisper".to_string()
  } else if has_cloud_key {
    "groq-whisper".to_string()
  } else {
    "local-whisper".to_string()
  };

  let offset_ms = ((start_sample as f64 / TARGET_SAMPLE_RATE as f64) * 1000.0).round() as u64;
  let chunk_dur_ms = ((slice.len() as f64 / TARGET_SAMPLE_RATE as f64) * 1000.0).round() as u64;

  let mut segments = send_whisper_transcription(
    wav_bytes,
    &key_str,
    endpoint.as_deref(),
    model.as_deref(),
  )
  .await?;

  for seg in &mut segments {
    seg.start_ms += offset_ms;
    seg.end_ms = if seg.end_ms > 0 {
      seg.end_ms + offset_ms
    } else {
      offset_ms + chunk_dur_ms
    };
  }

  Ok(LiveChunkTranscriptionResult {
    next_sample,
    segments,
    engine_used,
  })
}

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
