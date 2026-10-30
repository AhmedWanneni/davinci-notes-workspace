# ADR-0226: Native Desktop Dual-Channel Audio Loopback Architecture

## Status

Accepted

## Context

Meeting note-taking requires capturing two independent audio streams:
1. The user's voice from the default audio input device (Microphone).
2. The attendees' voices from meeting applications (Google Meet, Zoom, Teams, WhatsApp Desktop, Discord, etc.) routed through the system audio output (Loopback).

Webview APIs such as `navigator.mediaDevices.getDisplayMedia` are inadequate because they require user interaction with browser permission dialogues and screen-sharing popups for every single recording session, and cannot capture pure audio without screen capture in many webview runtimes. Mobile platforms sandboxing prevents loopback audio capture entirely.

## Decision

1. **Desktop-Only Native Audio Architecture**:
   - Audio capture is implemented in Rust inside `apps/desktop/src-tauri` using `cpal = "0.15"`.
   - On macOS 13+, ScreenCaptureKit and CoreAudio loopback capture system output cleanly without requiring third-party audio drivers (like BlackHole).
   - On Windows, WASAPI loopback capture is used via `cpal`.
   - On Linux, PulseAudio/PipeWire monitor streams are captured via `cpal`.
   - Mobile builds are completely excluded and untouched.

2. **Dual-Channel to Mono Mixdown**:
   - Capture microphone input and system loopback into separate lock-free ring buffers.
   - Mix down both streams in memory to standardized 16kHz, 16-bit signed integer mono PCM (the canonical input format for Whisper and modern STT engines).
   - Compute real-time RMS volume levels for microphone and system audio to feed the UI level meter via Tauri IPC events.

3. **Lifecycle and Resource Discipline**:
   - Audio hardware threads are spawned strictly on `start_recording` and stopped/dropped immediately on `stop_recording` or `pause_recording`.
   - Zero background threads or audio device locks are held when idle, complying with `PERFORMANCE.md`.

## Consequences

- Direct, non-intrusive meeting audio capture without annoying "Share your screen" browser prompts.
- Consistent 16kHz PCM audio stream feeding the transcription pipeline.
- Zero CPU/RAM usage when meeting recorder is not actively capturing.
