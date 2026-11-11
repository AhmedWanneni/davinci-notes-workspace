import { useEffect, useRef, useCallback } from "react";
import { transcribeLiveRecordingChunk } from "../../adapters/transcriptionClient";
import { loadWhisperCredentialsAndConfig } from "./rerunAudioTranscription";
import type { TranscriptSegmentItem } from "./listeningTypes";

// Web Speech API interface definitions for TypeScript
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

export interface LiveSpeechSegmentPayload {
  text: string;
  speaker: string;
  timestampMs: number;
  startMs?: number;
  endMs?: number;
  isFinal?: boolean;
}

export interface UseLiveSpeechRecognitionProps {
  isRecording: boolean;
  isPaused?: boolean;
  startedAt?: number | null;
  onSegment: (segment: Omit<TranscriptSegmentItem, "id"> | LiveSpeechSegmentPayload) => void;
}

export function useLiveSpeechRecognition({
  isRecording,
  isPaused = false,
  startedAt = null,
  onSegment,
}: UseLiveSpeechRecognitionProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;
  const lastSampleOffsetRef = useRef(0);
  const chunkInFlightRef = useRef(false);
  const recentTextsRef = useRef<string[]>([]);

  const handleSegment = useCallback(
    (text: string, speaker = "Speaker") => {
      const clean = text.trim();
      if (!clean) return;
      const now = Date.now();
      const sessionStart = startedAtRef.current || now;
      const timestampMs = Math.max(0, now - sessionStart);

      recentTextsRef.current = [...recentTextsRef.current.slice(-10), clean.toLowerCase()];

      onSegment({
        text: clean,
        speaker,
        timestampMs,
      });
    },
    [onSegment],
  );

  useEffect(() => {
    if (!isRecording) {
      lastSampleOffsetRef.current = 0;
      recentTextsRef.current = [];
    }
  }, [isRecording]);

  // Free tools live chunked Whisper transcription loop (Groq Whisper Free Tier + Local Whisper CLI)
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(async () => {
      if (chunkInFlightRef.current || !isRecordingRef.current || isPausedRef.current) return;
      chunkInFlightRef.current = true;
      try {
        const cfg = await loadWhisperCredentialsAndConfig().catch(() => ({
          apiKey: "",
          endpoint: undefined,
          model: undefined,
          engine: "auto",
        }));
        if (cfg.engine === "web-speech") return;

        const res = await transcribeLiveRecordingChunk(
          lastSampleOffsetRef.current,
          cfg.apiKey,
          cfg.endpoint,
          cfg.model,
        );
        if (res && typeof res.nextSample === "number") {
          lastSampleOffsetRef.current = res.nextSample;
        }
        if (res?.segments && res.segments.length > 0) {
          for (const seg of res.segments) {
            const clean = seg.text?.trim();
            if (!clean) continue;
            const norm = clean.toLowerCase();
            if (recentTextsRef.current.includes(norm)) continue;
            recentTextsRef.current = [...recentTextsRef.current.slice(-10), norm];
            onSegment({
              text: clean,
              speaker: (seg.speaker as "me" | "meeting" | "system") || "me",
              startMs: seg.startMs,
              endMs: seg.endMs || seg.startMs + 2500,
              timestampMs: seg.startMs,
              isFinal: true,
            });
          }
        }
      } catch {
        // Non-blocking fallback to Web Speech API
      } finally {
        chunkInFlightRef.current = false;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, onSegment]);

  useEffect(() => {
    if (!isRecording || isPaused) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
        .webkitSpeechRecognition;

    if (!SpeechRec) {
      return;
    }

    try {
      const recognizer = new SpeechRec();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = "en-US";

      recognizer.onresult = (event: SpeechRecognitionEventLike) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const transcript = res[0]?.transcript;
            if (transcript) {
              handleSegment(transcript, "me");
            }
          }
        }
      };

      recognizer.onerror = () => {
        // Non-blocking speech error
      };

      recognizer.onend = () => {
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            recognizer.start();
          } catch {}
        }
      };

      recognizer.start();
      recognitionRef.current = recognizer;
    } catch {}

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isRecording, isPaused, handleSegment]);

  return {
    simulateSpeechSegment: handleSegment,
  };
}
