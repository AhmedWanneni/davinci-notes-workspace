pub const TARGET_SAMPLE_RATE: u32 = 16_000;

pub fn calculate_rms_level(samples: &[f32]) -> f32 {
  if samples.is_empty() {
    return 0.0;
  }
  let sum_squares: f32 = samples.iter().map(|&s| s * s).sum();
  let rms = (sum_squares / samples.len() as f32).sqrt();
  rms.clamp(0.0, 1.0)
}

pub fn convert_to_mono(interleaved: &[f32], channels: u16) -> Vec<f32> {
  if channels <= 1 {
    return interleaved.to_vec();
  }
  let ch = channels as usize;
  let frame_count = interleaved.len() / ch;
  let mut mono = Vec::with_capacity(frame_count);

  for i in 0..frame_count {
    let mut sum = 0.0;
    for c in 0..ch {
      sum += interleaved[i * ch + c];
    }
    mono.push(sum / ch as f32);
  }
  mono
}

pub fn resample_linear(input: &[f32], source_rate: u32, target_rate: u32) -> Vec<f32> {
  if source_rate == target_rate || input.is_empty() {
    return input.to_vec();
  }
  let ratio = source_rate as f64 / target_rate as f64;
  let target_len = ((input.len() as f64) / ratio).round() as usize;
  let mut output = Vec::with_capacity(target_len);

  for i in 0..target_len {
    let src_pos = i as f64 * ratio;
    let idx0 = src_pos.floor() as usize;
    let idx1 = (idx0 + 1).min(input.len() - 1);
    let frac = (src_pos - idx0 as f64) as f32;

    let s0 = input[idx0];
    let s1 = input[idx1];
    output.push(s0 + frac * (s1 - s0));
  }
  output
}

pub fn f32_to_i16_pcm(samples: &[f32]) -> Vec<i16> {
  samples
    .iter()
    .map(|&s| {
      let clamped = s.clamp(-1.0, 1.0);
      if clamped < 0.0 {
        (clamped * 32768.0) as i16
      } else {
        (clamped * 32767.0) as i16
      }
    })
    .collect()
}

pub fn create_wav_header(pcm_data_len: usize, sample_rate: u32, channels: u16) -> [u8; 44] {
  let mut header = [0u8; 44];
  let total_data_len = pcm_data_len as u32;
  let total_file_len = total_data_len + 36;
  let byte_rate = sample_rate * (channels as u32) * 2;
  let block_align = channels * 2;

  header[0..4].copy_from_slice(b"RIFF");
  header[4..8].copy_from_slice(&total_file_len.to_le_bytes());
  header[8..12].copy_from_slice(b"WAVE");

  header[12..16].copy_from_slice(b"fmt ");
  header[16..20].copy_from_slice(&16u32.to_le_bytes()); // subchunk1 size (16 for PCM)
  header[20..22].copy_from_slice(&1u16.to_le_bytes()); // PCM format (1)
  header[22..24].copy_from_slice(&channels.to_le_bytes());
  header[24..28].copy_from_slice(&sample_rate.to_le_bytes());
  header[28..32].copy_from_slice(&byte_rate.to_le_bytes());
  header[32..34].copy_from_slice(&block_align.to_le_bytes());
  header[34..36].copy_from_slice(&16u16.to_le_bytes()); // bits per sample (16)

  header[36..40].copy_from_slice(b"data");
  header[40..44].copy_from_slice(&total_data_len.to_le_bytes());

  header
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_calculate_rms() {
    assert_eq!(calculate_rms_level(&[]), 0.0);
    let silence = vec![0.0; 100];
    assert_eq!(calculate_rms_level(&silence), 0.0);
    let full = vec![1.0; 100];
    assert!((calculate_rms_level(&full) - 1.0).abs() < 1e-5);
  }

  #[test]
  fn test_convert_to_mono() {
    let stereo = vec![0.5, 0.5, -0.2, 0.2];
    let mono = convert_to_mono(&stereo, 2);
    assert_eq!(mono.len(), 2);
    assert!((mono[0] - 0.5).abs() < 1e-5);
    assert!((mono[1] - 0.0).abs() < 1e-5);
  }

  #[test]
  fn test_resample_linear() {
    let input = vec![0.0, 1.0];
    let resampled = resample_linear(&input, 48000, 16000);
    assert!(!resampled.is_empty());
  }

  #[test]
  fn test_f32_to_i16() {
    let f = vec![-1.0, 0.0, 1.0];
    let i = f32_to_i16_pcm(&f);
    assert_eq!(i, vec![-32768, 0, 32767]);
  }

  #[test]
  fn test_wav_header() {
    let header = create_wav_header(32000, 16000, 1);
    assert_eq!(&header[0..4], b"RIFF");
    assert_eq!(&header[8..12], b"WAVE");
    assert_eq!(&header[36..40], b"data");
  }
}
