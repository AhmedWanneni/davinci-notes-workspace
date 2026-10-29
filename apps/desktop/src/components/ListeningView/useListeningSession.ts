import { useState, useEffect, useRef, useCallback } from "react";
import {
  startMeetingRecording,
  pauseMeetingRecording,
  resumeMeetingRecording,
  stopMeetingRecording,
} from "../../adapters/transcriptionClient";
import type { ListeningStatus } from "./listeningConstants";
import type {
  TranscriptSegmentItem,
  SuggestedLinkItem,
} from "./listeningTypes";
import { saveMeetingNoteToVault } from "../../vault/meetingNoteActions";
import { useAudioLevels } from "./useAudioLevels";
import { rerunAudioTranscription } from "./rerunAudioTranscription";

export interface UseListeningSessionReturn {
  status: ListeningStatus;
  title: string;
  durationMs: number;
  micLevel: number;
  systemLevel: number;
  segments: TranscriptSegmentItem[];
  suggestedLinks: SuggestedLinkItem[];
  actionItems: string[];
  summary: string;
  createdNotePath: string | null;
  setTitle: (title: string) => void;
  startSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: (existingPaths?: string[]) => Promise<string | null>;
  discardSession: () => Promise<void>;
  addSegment: (segment: Omit<TranscriptSegmentItem, "id">) => void;
  acceptLink: (id: string) => void;
  dismissLink: (id: string) => void;
  retranscribeAudio: (filePath: string) => Promise<void>;
  setSuggestedLinks: React.Dispatch<React.SetStateAction<SuggestedLinkItem[]>>;
  setActionItems: React.Dispatch<React.SetStateAction<string[]>>;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
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
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const { micLevel, systemLevel } = useAudioLevels();
  const [segments, setSegments] = useState<TranscriptSegmentItem[]>([]);
  const [suggestedLinks, setSuggestedLinks] = useState<SuggestedLinkItem[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [createdNotePath, setCreatedNotePath] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(
        () => setDurationMs((p) => p + 1000),
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

  const addSegment = useCallback((seg: Omit<TranscriptSegmentItem, "id">) => {
    const newSeg: TranscriptSegmentItem = {
      ...seg,
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setSegments((prev) => [...prev, newSeg]);
  }, []);

  const acceptLink = useCallback((id: string) => {
    setSuggestedLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, accepted: true } : l)),
    );
  }, []);

  const dismissLink = useCallback((id: string) => {
    setSuggestedLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, accepted: false } : l)),
    );
  }, []);

  const startSession = useCallback(async () => {
    try {
      await startMeetingRecording();
      setStatus("recording");
      setStartedAt(Date.now());
      setDurationMs(0);
      setSegments([]);
      setSuggestedLinks([]);
      setActionItems([]);
      setCreatedNotePath(null);
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

  const stopSession = useCallback(
    async (existingPaths: string[] = []): Promise<string | null> => {
      try {
        setStatus("processing");
        const audioResult = await stopMeetingRecording().catch(() => null);
        const savedPath = await saveMeetingNoteToVault(
          {
            title,
            startedAt: startedAt ?? Date.now(),
            durationMs,
            segments,
            suggestedLinks,
            actionItems,
            summary,
          },
          existingPaths,
          audioResult?.wav_path,
        );
        setCreatedNotePath(savedPath);
        setStatus("idle");
        return savedPath;
      } catch (err) {
        console.error("Failed to stop and save note:", err);
        setStatus("idle");
        return null;
      }
    },
    [
      title,
      startedAt,
      durationMs,
      segments,
      suggestedLinks,
      actionItems,
      summary,
    ],
  );

  const discardSession = useCallback(async () => {
    try {
      await stopMeetingRecording().catch(() => {});
      setStatus("idle");
      setDurationMs(0);
      setSegments([]);
      setSuggestedLinks([]);
    } catch (err) {
      console.error("Failed to discard recording:", err);
      setStatus("idle");
    }
  }, []);

  const retranscribeAudio = useCallback(async (filePath: string) => {
    try {
      setStatus("processing");
      const result = await rerunAudioTranscription(filePath);
      setSegments(result.segments);
      setActionItems(result.actionItems);
      setSummary(result.summary);
      setStatus("idle");
    } catch (err) {
      console.error("Failed to rerun audio transcription:", err);
      setStatus("error");
    }
  }, []);

  return {
    status,
    title,
    durationMs,
    micLevel,
    systemLevel,
    segments,
    suggestedLinks,
    actionItems,
    summary,
    createdNotePath,
    setTitle,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
    addSegment,
    acceptLink,
    dismissLink,
    retranscribeAudio,
    setSuggestedLinks,
    setActionItems,
    setSummary,
  };
}
