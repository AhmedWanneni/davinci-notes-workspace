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
  UseListeningSessionReturn,
} from "./listeningTypes";
import { saveMeetingNoteToVault } from "../../vault/meetingNoteActions";
import { useAudioLevels } from "./useAudioLevels";
import { rerunAudioTranscription } from "./rerunAudioTranscription";
import { useAIListeningEngine } from "./useAIListeningEngine";

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
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [isAIListeningActive, setIsAIListeningActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecording = status === "recording";

  const ai = useAIListeningEngine({
    isRecording,
    isActive: isAIListeningActive,
    segments,
  });

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
      ai.resetAI();
    } catch (err) {
      console.error("Failed to start recording:", err);
      setStatus("error");
    }
  }, [ai]);

  const pauseSession = useCallback(async () => {
    try {
      await pauseMeetingRecording();
      setStatus("paused");
      // Trigger an AI step at pause point if active
      if (isAIListeningActive) {
        void ai.triggerStep();
      }
    } catch (err) {
      console.error("Failed to pause recording:", err);
    }
  }, [ai, isAIListeningActive]);

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
        const tempWav =
          audioResult?.wavFilePath ||
          (audioResult as unknown as { wav_file_path?: string })
            ?.wav_file_path ||
          (audioResult as unknown as { wav_path?: string })?.wav_path;

        const savedAnswers = ai.answers
          .filter((a) => a.status === "saved")
          .map((a) => ({
            question: a.question,
            answer: a.answer,
            timestamp: a.timestamp,
          }));

        const savedQuestions = ai.questions
          .filter((q) => q.status === "saved")
          .map((q) => ({ question: q.question, timestamp: q.timestamp }));

        const savedPath = await saveMeetingNoteToVault(
          {
            title,
            startedAt: startedAt ?? Date.now(),
            durationMs,
            segments,
            suggestedLinks,
            actionItems,
            summary: ai.liveSummary || summary,
            answers: savedAnswers,
            questions: savedQuestions,
          },
          existingPaths,
          tempWav,
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
      ai,
    ],
  );

  const discardSession = useCallback(async () => {
    try {
      await stopMeetingRecording().catch(() => {});
      setStatus("idle");
      setDurationMs(0);
      setSegments([]);
      setSuggestedLinks([]);
      ai.resetAI();
    } catch (err) {
      console.error("Failed to discard recording:", err);
      setStatus("idle");
    }
  }, [ai]);

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
    isTranscriptVisible,
    isAIListeningActive,
    liveSummary: ai.liveSummary,
    answers: ai.answers,
    questions: ai.questions,
    aiStatus: ai.aiStatus,
    aiError: ai.aiError,
    aiRequestCount: ai.requestCount,
    setIsTranscriptVisible,
    setIsAIListeningActive,
    saveAnswer: ai.saveAnswer,
    dismissAnswer: ai.dismissAnswer,
    saveQuestion: ai.saveQuestion,
    dismissQuestion: ai.dismissQuestion,
    triggerAIStep: ai.triggerStep,
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
