use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecordingStatus {
  Idle,
  Recording,
  Paused,
  Processing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioLevelPayload {
  pub mic_level: f32,
  pub sys_level: f32,
  pub elapsed_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingStatusResponse {
  pub status: RecordingStatus,
  pub elapsed_seconds: u64,
  pub sample_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeetingAudioResult {
  pub wav_file_path: String,
  pub duration_seconds: f64,
  pub total_samples: usize,
  pub sample_rate: u32,
}
