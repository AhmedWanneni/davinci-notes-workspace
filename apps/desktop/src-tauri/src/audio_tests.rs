#[cfg(test)]
mod tests {
  use std::sync::atomic::Ordering;
  use std::time::Duration;

  use crate::audio_capture::AudioCaptureManager;
  use crate::audio_mixer::{
    calculate_rms_level, convert_to_mono, create_wav_header, f32_to_i16_pcm, resample_linear,
    TARGET_SAMPLE_RATE,
  };
  use crate::audio_types::RecordingStatus;

  #[test]
  fn test_audio_manager_initial_state() {
    let manager = AudioCaptureManager::default();
    assert_eq!(manager.get_status(), RecordingStatus::Idle);
    assert_eq!(manager.get_elapsed_seconds(), 0);
    assert!(manager.stop().is_err());
    assert!(manager.pause().is_err());
    assert!(manager.resume().is_err());
  }

  #[test]
  fn test_audio_manager_state_transitions() {
    let manager = AudioCaptureManager::default();
    manager.is_recording.store(true, Ordering::SeqCst);
    assert_eq!(manager.get_status(), RecordingStatus::Recording);

    manager.is_paused.store(true, Ordering::SeqCst);
    assert_eq!(manager.get_status(), RecordingStatus::Paused);

    manager.is_paused.store(false, Ordering::SeqCst);
    assert_eq!(manager.get_status(), RecordingStatus::Recording);

    manager.is_recording.store(false, Ordering::SeqCst);
    assert_eq!(manager.get_status(), RecordingStatus::Idle);
  }

  #[test]
  fn test_audio_pcm_pipeline_and_wav_generation() {
    // Generate 1 second of 440Hz sine wave at 48kHz
    let source_rate = 48000;
    let duration_secs = 0.5;
    let num_samples = (source_rate as f64 * duration_secs) as usize;
    let mut stereo_samples = Vec::with_capacity(num_samples * 2);

    for i in 0..num_samples {
      let t = i as f32 / source_rate as f32;
      let sample = (2.0 * std::f32::consts::PI * 440.0 * t).sin() * 0.8;
      stereo_samples.push(sample);
      stereo_samples.push(sample);
    }

    let mono = convert_to_mono(&stereo_samples, 2);
    assert_eq!(mono.len(), num_samples);

    let rms = calculate_rms_level(&mono);
    assert!(rms > 0.4 && rms < 0.7);

    let resampled = resample_linear(&mono, source_rate, TARGET_SAMPLE_RATE);
    let expected_len = (TARGET_SAMPLE_RATE as f64 * duration_secs).round() as usize;
    assert!((resampled.len() as isize - expected_len as isize).abs() <= 2);

    let i16_samples = f32_to_i16_pcm(&resampled);
    let pcm_bytes: Vec<u8> = i16_samples.iter().flat_map(|&s| s.to_le_bytes()).collect();

    let header = create_wav_header(pcm_bytes.len(), TARGET_SAMPLE_RATE, 1);
    assert_eq!(&header[0..4], b"RIFF");
    assert_eq!(&header[8..12], b"WAVE");

    let temp_dir = std::env::temp_dir();
    let test_file = temp_dir.join("test-audio-output.wav");
    let mut full = Vec::new();
    full.extend_from_slice(&header);
    full.extend_from_slice(&pcm_bytes);

    std::fs::write(&test_file, full).expect("WAV file write should succeed");
    assert!(test_file.exists());
    let metadata = std::fs::metadata(&test_file).expect("file metadata should exist");
    assert_eq!(metadata.len() as usize, 44 + pcm_bytes.len());
    let _ = std::fs::remove_file(&test_file);
  }

  #[test]
  fn test_list_devices() {
    let res = AudioCaptureManager::list_devices();
    assert!(res.is_ok());
  }

  #[test]
  fn test_elapsed_seconds_paused_duration() {
    let manager = AudioCaptureManager::default();
    *manager.start_time.lock().unwrap() = Some(std::time::Instant::now() - Duration::from_secs(10));
    *manager.paused_duration.lock().unwrap() = Duration::from_secs(3);
    assert!(manager.get_elapsed_seconds() >= 6 && manager.get_elapsed_seconds() <= 8);
  }
}
