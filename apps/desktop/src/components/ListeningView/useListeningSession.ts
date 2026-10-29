import { useState, useEffect, useRef, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  startMeetingRecording,
  pauseMeetingRecording,
  resumeMeetingRecording,
  stopMeetingRecording,
} from "../../adapters/transcriptionClient";
import type { AudioLevelPayload } from "../../adapters/transcriptionClient";
import type { ListeningStatus } from "./listeningConstants";
import type { TranscriptSegmentItem } from "./listeningTypes";

export interface UseListeningSessionReturn {
  status: ListeningStatus;
  title: string;
  durationMs: number;
  micLevel: number;
  systemLevel: number;
  segments: TranscriptSegmentItem[];
  setTitle: (title: string) => void;
  startSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  discardSession: () => Promise<void>;
  addSegment: (segment: Omit<TranscriptSegmentItem, "id">) => void;
}

export function useListeningSession(
  initialTitle?: string,
): UseListeningSessionReturn {
  const [status, setStatus] = useState<ListeningStatus>("idle");
  const [title, setTitle] = useState<string>(
    () =>
      initialTitle ||
      `Meeting — ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
  );
  const [durationMs, setDurationMs] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);
  const [segments, setSegments] = useState<TranscriptSegmentItem[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => {
        setDurationMs((prev) => prev + 1000);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    try {
      listen<AudioLevelPayload>("davinci-audio-levels", (event) => {
        if (event.payload) {
          setMicLevel(event.payload.mic_rms);
          setSystemLevel(event.payload.system_rms);
        }
      })
        .then((dispose) => {
          unlisten = dispose;
        })
        .catch(() => {
          // Not running in Tauri or mock environment
        });
    } catch {
      // Safe fallback
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const addSegment = useCallback((seg: Omit<TranscriptSegmentItem, "id">) => {
    const newSeg: TranscriptSegmentItem = {
      ...seg,
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setSegments((prev) => [...prev, newSeg]);
  }, []);

  const startSession = useCallback(async () => {
    try {
      await startMeetingRecording();
      setStatus("recording");
      setDurationMs(0);
      setSegments([]);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setStatus("error");
    }
  }, []);

  const pauseSession = useCallback(async () => {
    try {
      await pauseMeetingRecording();
      setStatus("paused");
    } catch (err) {
      console.error("Failed to pause recording:", err);
    }
  }, []);

  const resumeSession = useCallback(async () => {
    try {
      await resumeMeetingRecording();
      setStatus("recording");
    } catch (err) {
      console.error("Failed to resume recording:", err);
    }
  }, []);

  const stopSession = useCallback(async () => {
    try {
      setStatus("processing");
      await stopMeetingRecording();
      setStatus("idle");
    } catch (err) {
      console.error("Failed to stop recording:", err);
      setStatus("idle");
    }
  }, []);

  const discardSession = useCallback(async () => {
    try {
      await stopMeetingRecording().catch(() => {});
      setStatus("idle");
      setDurationMs(0);
      setSegments([]);
    } catch (err) {
      console.error("Failed to discard recording:", err);
      setStatus("idle");
    }
  }, []);

  return {
    status,
    title,
    durationMs,
    micLevel,
    systemLevel,
    segments,
    setTitle,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
    addSegment,
  };
}
