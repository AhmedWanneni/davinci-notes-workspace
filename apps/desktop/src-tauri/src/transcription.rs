use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptSegment {
  pub id: u32,
  pub text: String,
  pub start_ms: u64,
  pub end_ms: u64,
  pub speaker: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct TranscriptionResponse {
  pub segments: Vec<TranscriptSegment>,
  pub full_text: String,
}

#[allow(dead_code)]
pub fn slice_pcm_chunks(
  pcm_samples: &[f32],
  sample_rate: u32,
  chunk_duration_secs: u32,
  overlap_duration_secs: f32,
) -> Vec<(u64, u64, Vec<f32>)> {
  if pcm_samples.is_empty() {
    return Vec::new();
  }

  let chunk_samples = (sample_rate * chunk_duration_secs) as usize;
  let overlap_samples = (sample_rate as f32 * overlap_duration_secs).round() as usize;
  let step_samples = if chunk_samples > overlap_samples {
    chunk_samples - overlap_samples
  } else {
    chunk_samples
  };

  let mut chunks = Vec::new();
  let mut start = 0;

  while start < pcm_samples.len() {
    let end = (start + chunk_samples).min(pcm_samples.len());
    let chunk = pcm_samples[start..end].to_vec();

    let start_ms = (start as f64 / sample_rate as f64 * 1000.0).round() as u64;
    let end_ms = (end as f64 / sample_rate as f64 * 1000.0).round() as u64;

    chunks.push((start_ms, end_ms, chunk));

    if end == pcm_samples.len() {
      break;
    }
    start += step_samples;
  }

  chunks
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_slice_pcm_chunks() {
    let sample_rate = 16_000;
    // 30 seconds of audio = 480,000 samples
    let samples = vec![0.1f32; sample_rate as usize * 30];

    // 10s chunk with 2s overlap
    let chunks = slice_pcm_chunks(&samples, sample_rate, 10, 2.0);
    assert!(!chunks.is_empty());
    assert_eq!(chunks[0].0, 0); // start_ms = 0
    assert_eq!(chunks[0].1, 10_000); // end_ms = 10,000
  }
}
