use std::path::{Path, PathBuf};
use std::process::Command;

use crate::transcription::TranscriptSegment;

const LOCAL_WHISPER_CANDIDATES: &[&str] = &["mlx_whisper", "whisper-cli", "whisper-cpp", "whisper"];

pub fn find_local_whisper_binary() -> Option<(String, PathBuf)> {
  let extra_dirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
  ];
  let home_local = std::env::var("HOME")
    .ok()
    .map(|h| PathBuf::from(h).join(".local/bin"));

  for &name in LOCAL_WHISPER_CANDIDATES {
    if let Ok(path_var) = std::env::var("PATH") {
      for dir in std::env::split_paths(&path_var) {
        let candidate = dir.join(name);
        if candidate.is_file() {
          return Some((name.to_string(), candidate));
        }
      }
    }
    for dir in &extra_dirs {
      let candidate = Path::new(dir).join(name);
      if candidate.is_file() {
        return Some((name.to_string(), candidate));
      }
    }
    if let Some(ref hl) = home_local {
      let candidate = hl.join(name);
      if candidate.is_file() {
        return Some((name.to_string(), candidate));
      }
    }
  }
  None
}

pub fn is_whisper_hallucination(text: &str) -> bool {
  let lower = text.trim().to_lowercase();
  if lower.is_empty() {
    return true;
  }
  let hallucinations = [
    "thank you.",
    "thank you",
    "thanks for watching.",
    "thanks for watching!",
    "subtitles by",
    "amara.org",
    "you",
    ".",
    "...",
  ];
  hallucinations.contains(&lower.as_str())
}

pub fn transcribe_wav_with_local_whisper(wav_bytes: &[u8]) -> Result<Vec<TranscriptSegment>, String> {
  let (bin_name, bin_path) = find_local_whisper_binary().ok_or_else(|| {
    "No local Whisper CLI found (install mlx_whisper, whisper-cli, or openai-whisper, or configure a free Groq API key)".to_string()
  })?;

  let temp_dir = std::env::temp_dir();
  let stamp = chrono::Utc::now().timestamp_millis();
  let wav_path = temp_dir.join(format!("davinci-whisper-{stamp}.wav"));
  std::fs::write(&wav_path, wav_bytes)
    .map_err(|e| format!("Failed to write temp WAV for local Whisper: {e}"))?;

  let result = run_whisper_cli(&bin_name, &bin_path, &wav_path, &temp_dir);
  let _ = std::fs::remove_file(&wav_path);
  result
}

fn run_whisper_cli(
  bin_name: &str,
  bin_path: &Path,
  wav_path: &Path,
  temp_dir: &Path,
) -> Result<Vec<TranscriptSegment>, String> {
  let output = if bin_name == "whisper-cli" || bin_name == "whisper-cpp" {
    Command::new(bin_path)
      .arg("-f")
      .arg(wav_path)
      .arg("-np")
      .arg("-nt")
      .output()
      .map_err(|e| format!("Failed to execute {bin_name}: {e}"))?
  } else {
    Command::new(bin_path)
      .arg(wav_path)
      .arg("--output_format")
      .arg("txt")
      .arg("--output_dir")
      .arg(temp_dir)
      .output()
      .map_err(|e| format!("Failed to execute {bin_name}: {e}"))?
  };

  let mut text = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if let Some(stem) = wav_path.file_stem().and_then(|s| s.to_str()) {
    let txt_file = temp_dir.join(format!("{stem}.txt"));
    if txt_file.exists() {
      if let Ok(file_text) = std::fs::read_to_string(&txt_file) {
        if !file_text.trim().is_empty() {
          text = file_text.trim().to_string();
        }
      }
      let _ = std::fs::remove_file(&txt_file);
    }
  }

  let cleaned: Vec<String> = text
    .lines()
    .map(|l| l.trim())
    .filter(|l| !l.is_empty() && !is_whisper_hallucination(l))
    .map(|l| l.to_string())
    .collect();

  if cleaned.is_empty() {
    return Ok(Vec::new());
  }

  Ok(vec![TranscriptSegment {
    id: 0,
    text: cleaned.join(" "),
    start_ms: 0,
    end_ms: 3000,
    speaker: Some("me".to_string()),
  }])
}
