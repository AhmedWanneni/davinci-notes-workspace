use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use cpal::traits::{DeviceTrait, HostTrait};
use tauri::AppHandle;

use crate::audio_mixer::TARGET_SAMPLE_RATE;
use crate::audio_types::{MeetingAudioResult, RecordingStatus};
use crate::audio_worker::{run_audio_worker, AudioWorkerMsg};

pub struct AudioCaptureManager {
  tx: Mutex<Sender<AudioWorkerMsg>>,
  pub is_recording: Arc<AtomicBool>,
  pub is_paused: Arc<AtomicBool>,
  pub pcm_buffer: Arc<Mutex<Vec<f32>>>,
  pub start_time: Arc<Mutex<Option<Instant>>>,
  pub paused_duration: Arc<Mutex<Duration>>,
  pub last_pause_start: Arc<Mutex<Option<Instant>>>,
}

impl Default for AudioCaptureManager {
  fn default() -> Self {
    let (tx, rx) = channel::<AudioWorkerMsg>();
    let is_recording = Arc::new(AtomicBool::new(false));
    let is_paused = Arc::new(AtomicBool::new(false));
    let pcm_buffer = Arc::new(Mutex::new(Vec::with_capacity(TARGET_SAMPLE_RATE as usize * 60)));
    let start_time = Arc::new(Mutex::new(None));
    let paused_duration = Arc::new(Mutex::new(Duration::ZERO));
    let last_pause_start = Arc::new(Mutex::new(None));

    let buf_clone = Arc::clone(&pcm_buffer);
    let rec_clone = Arc::clone(&is_recording);
    let paused_clone = Arc::clone(&is_paused);
    let start_clone = Arc::clone(&start_time);
    let paused_dur_clone = Arc::clone(&paused_duration);
    let last_pause_clone = Arc::clone(&last_pause_start);

    std::thread::Builder::new()
      .name("davinci-audio-worker".into())
      .spawn(move || {
        run_audio_worker(
          rx,
          buf_clone,
          rec_clone,
          paused_clone,
          start_clone,
          paused_dur_clone,
          last_pause_clone,
        );
      })
      .expect("failed to spawn audio worker thread");

    Self {
      tx: Mutex::new(tx),
      is_recording,
      is_paused,
      pcm_buffer,
      start_time,
      paused_duration,
      last_pause_start,
    }
  }
}

impl AudioCaptureManager {
  pub fn get_status(&self) -> RecordingStatus {
    if !self.is_recording.load(Ordering::SeqCst) {
      RecordingStatus::Idle
    } else if self.is_paused.load(Ordering::SeqCst) {
      RecordingStatus::Paused
    } else {
      RecordingStatus::Recording
    }
  }

  pub fn get_elapsed_seconds(&self) -> u64 {
    let start = self.start_time.lock().unwrap_or_else(|e| e.into_inner());
    let mut paused = *self.paused_duration.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(pause_start) = *self.last_pause_start.lock().unwrap_or_else(|e| e.into_inner()) {
      paused += pause_start.elapsed();
    }
    match *start {
      Some(t) => {
        let total = t.elapsed();
        if total > paused {
          (total - paused).as_secs()
        } else {
          0
        }
      }
      None => 0,
    }
  }

  pub fn list_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let devices = host.input_devices().map_err(|e| e.to_string())?;
    let mut names = Vec::new();
    for dev in devices {
      if let Ok(name) = dev.name() {
        names.push(name);
      }
    }
    Ok(names)
  }

  pub fn start(&self, app: AppHandle) -> Result<(), String> {
    let (reply_tx, reply_rx) = channel();
    let sender = self.tx.lock().map_err(|e| e.to_string())?;
    sender
      .send(AudioWorkerMsg::Start { app, reply: reply_tx })
      .map_err(|e| e.to_string())?;
    reply_rx.recv().map_err(|e| e.to_string())?
  }

  pub fn pause(&self) -> Result<(), String> {
    if !self.is_recording.load(Ordering::SeqCst) {
      return Err("Not currently recording".to_string());
    }
    let sender = self.tx.lock().map_err(|e| e.to_string())?;
    sender.send(AudioWorkerMsg::Pause).map_err(|e| e.to_string())
  }

  pub fn resume(&self) -> Result<(), String> {
    if !self.is_recording.load(Ordering::SeqCst) {
      return Err("Not currently recording".to_string());
    }
    let sender = self.tx.lock().map_err(|e| e.to_string())?;
    sender.send(AudioWorkerMsg::Resume).map_err(|e| e.to_string())
  }

  pub fn stop(&self) -> Result<MeetingAudioResult, String> {
    let (reply_tx, reply_rx) = channel();
    let sender = self.tx.lock().map_err(|e| e.to_string())?;
    sender
      .send(AudioWorkerMsg::Stop { reply: reply_tx })
      .map_err(|e| e.to_string())?;
    reply_rx.recv().map_err(|e| e.to_string())?
  }
}
