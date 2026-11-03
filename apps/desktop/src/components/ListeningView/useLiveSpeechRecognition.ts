import { useEffect, useRef, useCallback } from "react";
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

export interface UseLiveSpeechRecognitionProps {
  isRecording: boolean;
  isPaused: boolean;
  startedAt: number | null;
  onSegment: (segment: Omit<TranscriptSegmentItem, "id">) => void;
}

export function useLiveSpeechRecognition({
  isRecording,
  isPaused,
  startedAt,
  onSegment,
}: UseLiveSpeechRecognitionProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;

  const handleSegment = useCallback(
    (text: string, speaker = "Speaker") => {
      const clean = text.trim();
      if (!clean) return;
      const now = Date.now();
      const sessionStart = startedAtRef.current || now;
      const timestampMs = Math.max(0, now - sessionStart);

      onSegment({
        text: clean,
        speaker,
        timestampMs,
      });
    },
    [onSegment],
  );

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
              handleSegment(transcript);
            }
          }
        }
      };

      recognizer.onerror = () => {
        // Non-blocking speech error
      };

      recognizer.onend = () => {
        // Auto-restart if still recording and not paused
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
