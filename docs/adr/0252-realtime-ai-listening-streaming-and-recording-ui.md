# ADR-0252: Real-time AI Listening Streaming Engine and Recording Page UI

## Status

Accepted

## Context

Users recording meetings in Davinci Notes require:
1. High-fidelity audio capture with live audio level visualization and standard recording controls (Record, Pause, Resume, Stop, Discard).
2. An optional live transcript feed directly under the controls with smart auto-scrolling that pauses when the user scrolls up.
3. An optional real-time **AI Listening** stream that continuously produces:
   - Live summary of ongoing discussion.
   - Suggested answers to questions asked during the meeting.
   - Follow-up questions the user can ask to steer discussion.
   - Ability to save or dismiss individual items.
4. Lightweight resource constraints:
   - When AI Listening is OFF, zero AI requests must be made and the panel must be lazy-loaded.
   - When ON, requests must be throttled (every 20–30s or at speech pauses), sending only a rolling window (last 2–3 minutes + prior summary) and cancelling in-flight requests via `AbortController`.
   - Bring-your-own-key stored in OS keychain with Gemini privacy warnings.
   - Failures must be non-blocking.
5. Notes must persist the transcript, summary, accepted answers, and follow-up questions to markdown.

## Decision

1. **Three-Column Reference Layout**:
   - Left column (`MeetingsSidebar`): Quick access to My Meetings, All Meetings, Voice Agent Meetings, and Channels.
   - Center column: Top action bar (Filters / Search), `ListeningVisualizer` with waveform bars, recording timer, controls, and dual switches for `[Transcript]` and `[AI Listening]`. Below it is either `TranscriptFeed` (with scroll-up detection and jump-to-latest button) or the meeting placeholder showcase.
   - Right column (`AIListeningPanel`): Lazy-loaded panel with live summary, suggested answers, follow-up questions, and quick query box.

2. **Throttled Rolling Window Engine**:
   - `packages/ai-agent/aiListeningEngine.ts` implements `extractRollingWindow` (default 150s) and structured JSON parsing.
   - In `useAIListeningEngine.ts`, requests run on a 25s throttle timer with an active `AbortController` canceling superseded requests. Non-blocking error handling preserves audio recording integrity.

3. **Dedicated Settings Dialog Tab**:
   - Added `ai-listening` tab to `SettingsDialog` providing provider selection (Gemini, OpenAI, OpenRouter, Ollama), OS keychain storage, and Gemini privacy notice.

4. **Canonical Markdown Persistence**:
   - Extended `renderMeetingMarkdown` to include `## Q&A` and `## Suggested Follow-up Questions` alongside `## Summary` and `## Transcript`.

## Consequences

- Zero performance or bundle penalty when AI Listening is disabled.
- Predictable, low token consumption during meetings.
- Strict compliance with design system tokens and file line caps (< 250 lines).
