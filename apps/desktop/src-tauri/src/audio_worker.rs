use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use tauri::{AppHandle, Emitter};

use crate::audio_mixer::{
  calculate_rms_level, convert_to_mono, f32_to_i16_pcm, resample_linear, TARGET_SAMPLE_RATE,
};
use crate::audio_types::{AudioLevelPayload, MeetingAudioResult};

pub enum AudioWorkerMsg {
  Start {
    app: AppHandle,
    reply: Sender<Result<(), String>>,
  },
  Pause,
  Resume,
  Stop {
    reply: Sender<Result<MeetingAudioResult, String>>,
  },
}

pub fn run_audio_worker(
  rx: Receiver<AudioWorkerMsg>,
  pcm_buffer: Arc<Mutex<Vec<f32>>>,
  is_recording: Arc<AtomicBool>,
  is_paused: Arc<AtomicBool>,
  start_time: Arc<Mutex<Option<Instant>>>,
  paused_duration: Arc<Mutex<Duration>>,
  last_pause_start: Arc<Mutex<Option<Instant>>>,
) {
  let mut _stream: Option<cpal::Stream> = None;

  while let Ok(msg) = rx.recv() {
    match msg {
      AudioWorkerMsg::Start { app, reply } => {
        if is_recording.load(Ordering::SeqCst) {
          let _ = reply.send(Err("Recording already in progress".to_string()));
          continue;
        }

        let host = cpal::default_host();
        let device = match host.default_input_device() {
          Some(d) => d,
          None => {
            let _ = reply.send(Err("No default audio input device found".to_string()));
            continue;
          }
        };

        let default_config = match device.default_input_config() {
          Ok(c) => c,
          Err(e) => {
            let _ = reply.send(Err(format!("Failed to read default audio format: {e}")));
            continue;
          }
        };

        let sample_rate = default_config.sample_rate().0;
        let channels = default_config.channels();
        let format = default_config.sample_format();

        if let Ok(mut buf) = pcm_buffer.lock() {
          buf.clear();
        }

        let buf_ref = Arc::clone(&pcm_buffer);
        let paused_ref = Arc::clone(&is_paused);
        let app_handle = app.clone();

        let built_stream = match format {
          SampleFormat::F32 => {
            let err_fn = |err| log::error!("Audio stream error: {}", err);
            device.build_input_stream(
              &default_config.into(),
              move |data: &[f32], _: &_| {
                if paused_ref.load(Ordering::Relaxed) {
                  return;
                }
                let mono = convert_to_mono(data, channels);
                let rms = calculate_rms_level(&mono);
                let resampled = resample_linear(&mono, sample_rate, TARGET_SAMPLE_RATE);
                if let Ok(mut b) = buf_ref.lock() {
                  b.extend_from_slice(&resampled);
                }
                let _ = app_handle.emit(
                  "davinci-audio-levels",
                  AudioLevelPayload {
                    mic_level: rms,
                    sys_level: 0.0,
                    elapsed_seconds: 0,
                  },
                );
              },
              err_fn,
              None,
            )
          }
          _ => {
            let _ = reply.send(Err(format!("Unsupported audio sample format: {format:?}")));
            continue;
          }
        };

        match built_stream {
          Ok(s) => match s.play() {
            Ok(()) => {
              _stream = Some(s);
              *start_time.lock().unwrap_or_else(|e| e.into_inner()) = Some(Instant::now());
              *paused_duration.lock().unwrap_or_else(|e| e.into_inner()) = Duration::ZERO;
              *last_pause_start.lock().unwrap_or_else(|e| e.into_inner()) = None;
              is_paused.store(false, Ordering::SeqCst);
              is_recording.store(true, Ordering::SeqCst);
              let _ = reply.send(Ok(()));
            }
            Err(e) => {
              let _ = reply.send(Err(format!("Failed to play audio stream: {e}")));
            }
          },
          Err(e) => {
            let _ = reply.send(Err(format!("Failed to build input stream: {e}")));
          }
        }
      }
      AudioWorkerMsg::Pause => {
        if is_recording.load(Ordering::SeqCst) && !is_paused.load(Ordering::SeqCst) {
          is_paused.store(true, Ordering::SeqCst);
          *last_pause_start.lock().unwrap_or_else(|e| e.into_inner()) = Some(Instant::now());
        }
      }
      AudioWorkerMsg::Resume => {
        if is_recording.load(Ordering::SeqCst) && is_paused.load(Ordering::SeqCst) {
          if let Some(pause_start) = last_pause_start.lock().unwrap_or_else(|e| e.into_inner()).take() {
            let mut total_paused = paused_duration.lock().unwrap_or_else(|e| e.into_inner());
            *total_paused += pause_start.elapsed();
          }
          is_paused.store(false, Ordering::SeqCst);
        }
      }
      AudioWorkerMsg::Stop { reply } => {
        if !is_recording.load(Ordering::SeqCst) {
          let _ = reply.send(Err("No active recording to stop".to_string()));
          continue;
        }

        _stream = None;
        is_recording.store(false, Ordering::SeqCst);
        is_paused.store(false, Ordering::SeqCst);

        let samples = {
          let mut buf = pcm_buffer.lock().unwrap_or_else(|e| e.into_inner());
          std::mem::take(&mut *buf)
        };

        let total_samples = samples.len();
        let duration_seconds = total_samples as f64 / TARGET_SAMPLE_RATE as f64;
        let i16_samples = f32_to_i16_pcm(&samples);
        let pcm_bytes: Vec<u8> = i16_samples.iter().flat_map(|&s| s.to_le_bytes()).collect();

        let header = crate::audio_mixer::create_wav_header(pcm_bytes.len(), TARGET_SAMPLE_RATE, 1);
        let temp_dir = std::env::temp_dir();
        let filename = format!("meeting-recording-{}.wav", chrono::Utc::now().timestamp_millis());
        let file_path = temp_dir.join(filename);

        let mut full_file = Vec::with_capacity(44 + pcm_bytes.len());
        full_file.extend_from_slice(&header);
        full_file.extend_from_slice(&pcm_bytes);

        match std::fs::write(&file_path, full_file) {
          Ok(()) => {
            let _ = reply.send(Ok(MeetingAudioResult {
              wav_file_path: file_path.to_string_lossy().to_string(),
              duration_seconds,
              total_samples,
              sample_rate: TARGET_SAMPLE_RATE,
            }));
          }
          Err(e) => {
            let _ = reply.send(Err(format!("Failed to write WAV file: {e}")));
          }
        }
      }
    }
  }
}
