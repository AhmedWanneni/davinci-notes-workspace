import { useState, useEffect, useRef } from "react";
import {
  startMeetingRecording,
  pauseMeetingRecording,
  resumeMeetingRecording,
  stopMeetingRecording,
  saveRecordedAudioToVault,
} from "../../adapters/transcriptionClient";

export type RecordState =
  "idle" | "recording" | "paused" | "recorded" | "saving";

export interface UseQuickRecordOptions {
  initialNotes?: string;
  autoStart?: boolean;
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getDefaultRecordTitle(): string {
  const now = new Date();
  const d = now.toISOString().split("T")[0];
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `Voice Note — ${d} ${h}-${m}`;
}

export function useQuickRecord(options: UseQuickRecordOptions = {}) {
  const { initialNotes = "", autoStart = false } = options;
  const [status, setStatus] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [tempWavPath, setTempWavPath] = useState<string | null>(null);
  const [title, setTitle] = useState(getDefaultRecordTitle);
  const [noteText, setNoteText] = useState(initialNotes);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (initialNotes && !noteText) {
      setNoteText(initialNotes);
    }
  }, [initialNotes]);

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(
        () => setElapsed((prev) => prev + 1),
        1000,
      );
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleStart = async () => {
    try {
      setErrorMessage(null);
      await startMeetingRecording();
      setStatus("recording");
      setElapsed(0);
    } catch {
      setErrorMessage(
        "Could not start audio recording. Check microphone permissions.",
      );
    }
  };

  useEffect(() => {
    if (autoStart && !hasAutoStartedRef.current && status === "idle") {
      hasAutoStartedRef.current = true;
      void handleStart();
    }
  }, [autoStart, status]);

  const handlePause = async () => {
    try {
      await pauseMeetingRecording();
      setStatus("paused");
    } catch {
      // Ignored
    }
  };

  const handleResume = async () => {
    try {
      await resumeMeetingRecording();
      setStatus("recording");
    } catch {
      // Ignored
    }
  };

  const handleStop = async () => {
    try {
      const res = await stopMeetingRecording();
      setStatus("recorded");
      setTempWavPath(res?.wavFilePath ?? null);
    } catch {
      setErrorMessage("Failed to stop recording audio.");
    }
  };

  const handleDiscard = async () => {
    if (status === "recording" || status === "paused") {
      await stopMeetingRecording().catch(() => {});
    }
    setStatus("idle");
    setElapsed(0);
    setTempWavPath(null);
  };

  const buildNoteContent = (
    audioTarget: string,
    cleanTitle: string,
  ): string => {
    const lines = [
      "---",
      `title: "${cleanTitle.replace(/"/g, '\\"')}"`,
      `date: ${new Date().toISOString().split("T")[0]}`,
      "tags:",
      "  - voice-note",
      "  - audio",
      `duration: "${formatTimer(elapsed)}"`,
      "---",
      "",
      `# ${cleanTitle}`,
      "",
      `![[${audioTarget}]]`,
      "",
      noteText.trim() ? `${noteText.trim()}\n` : "",
    ];
    return lines.join("\n");
  };

  return {
    status,
    setStatus,
    elapsed,
    tempWavPath,
    title,
    setTitle,
    noteText,
    setNoteText,
    errorMessage,
    setErrorMessage,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleDiscard,
    buildNoteContent,
    saveRecordedAudioToVault,
  };
}
