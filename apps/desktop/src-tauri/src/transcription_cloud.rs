use reqwest::multipart::{Form, Part};
use serde_json::Value;

use crate::transcription::TranscriptSegment;

pub async fn send_whisper_transcription(
  wav_bytes: Vec<u8>,
  api_key: &str,
  endpoint_override: Option<&str>,
  model_override: Option<&str>,
) -> Result<Vec<TranscriptSegment>, String> {
  let endpoint = endpoint_override.unwrap_or("https://api.groq.com/openai/v1/audio/transcriptions");
  let model = model_override.unwrap_or("whisper-large-v3");

  let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(45))
    .build()
    .map_err(|e| e.to_string())?;

  let part = Part::bytes(wav_bytes)
    .file_name("audio.wav")
    .mime_str("audio/wav")
    .map_err(|e| e.to_string())?;

  let form = Form::new()
    .part("file", part)
    .text("model", model.to_string())
    .text("response_format", "verbose_json".to_string());

  let response = client
    .post(endpoint)
    .header("Authorization", format!("Bearer {}", api_key.trim()))
    .multipart(form)
    .send()
    .await
    .map_err(|e| format!("Transcription network error: {e}"))?;

  let status = response.status();
  let text = response.text().await.map_err(|e| e.to_string())?;

  if !status.is_success() {
    return Err(format!("Transcription failed (HTTP {status}): {text}"));
  }

  let json: Value = serde_json::from_str(&text).map_err(|e| format!("Invalid JSON response: {e}"))?;

  let mut segments = Vec::new();
  if let Some(segs) = json.get("segments").and_then(|s| s.as_array()) {
    for (idx, item) in segs.iter().enumerate() {
      let seg_text = item
        .get("text")
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .trim()
        .to_string();

      let start_sec = item.get("start").and_then(|s| s.as_f64()).unwrap_or(0.0);
      let end_sec = item.get("end").and_then(|s| s.as_f64()).unwrap_or(0.0);

      if !seg_text.is_empty() {
        segments.push(TranscriptSegment {
          id: idx as u32,
          text: seg_text,
          start_ms: (start_sec * 1000.0) as u64,
          end_ms: (end_sec * 1000.0) as u64,
          speaker: None,
        });
      }
    }
  } else if let Some(full_text) = json.get("text").and_then(|t| t.as_str()) {
    let trimmed = full_text.trim();
    if !trimmed.is_empty() {
      segments.push(TranscriptSegment {
        id: 0,
        text: trimmed.to_string(),
        start_ms: 0,
        end_ms: 0,
        speaker: None,
      });
    }
  }

  Ok(segments)
}
