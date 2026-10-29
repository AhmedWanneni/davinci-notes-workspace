# ADR-0227: Lazy-Loaded Transcription Pipeline and Sidecar Contract

## Status

Accepted

## Context

Transcribing continuous meeting audio in real time presents significant performance and resource challenges. Running a full local model like Whisper locally on every machine consumes substantial CPU/Metal resources and requires downloading large neural weights (~140MB for `base.en`, ~460MB for `small.en`), which can cause laptop fans to spin up and degrade call quality during active meetings. Conversely, cloud-only transcription requires network connectivity and an active API key.

## Decision

1. **Hybrid Transcription Subsystem**:
   - Primary default: Fast Cloud Speech-to-Text API (Groq Whisper / OpenAI Whisper) transmitting small 15–30s compressed PCM audio chunks. Sub-second latency, zero client CPU load.
   - Secondary opt-in: Local `whisper.cpp` standalone sidecar binary with `base.en` (~140MB). This sidecar is **never** bundled in the main installer; it is downloaded strictly on demand if the user explicitly turns on "Offline Local Transcription" in Settings.

2. **Chunking and Monotonic Timestamping**:
   - The audio stream is chunked into 20-second overlapping audio frames (with 1.5s sliding overlap to prevent truncating words at boundaries).
   - Segments are sequentially numbered with monotonically increasing start/end millisecond timestamps.
   - Segments are streamed directly to the frontend webview via `davinci-transcript-segment` events.

3. **Audio Retention Policy**:
   - In accordance with Decision D6, raw audio is buffered in memory or temporary cache during the meeting and discarded immediately upon note generation, unless the user toggles "Retain raw audio in vault attachments" in settings.

## Consequences

- 0 MB added to the application installer bundle.
- Fast, near real-time transcript streaming during calls.
- Full offline capability available on-demand for privacy-focused users.
- Vault size and sync storage are protected from multi-gigabyte audio bloating.
