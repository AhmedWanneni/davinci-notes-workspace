import { useState, useEffect, useRef, useCallback } from "react";
import {
  startMeetingRecording, pauseMeetingRecording, resumeMeetingRecording, stopMeetingRecording,
} from "../../adapters/transcriptionClient";
import type { ListeningStatus } from "./listeningConstants";
import type { TranscriptSegmentItem, SuggestedLinkItem, UseListeningSessionReturn } from "./listeningTypes";
import { saveMeetingNoteToVault } from "../../vault/meetingNoteActions";
import { useAudioLevels } from "./useAudioLevels";
import { rerunAudioTranscription, normalizeSpeechSegment, transcribeRemainingAudioOnStop } from "./rerunAudioTranscription";
import { useAIListeningEngine } from "./useAIListeningEngine";
import { useLiveSpeechRecognition, type LiveSpeechSegmentPayload } from "./useLiveSpeechRecognition";
import { useLiveSummaries } from "./useLiveSummaries";
import { useMeetingAgentChat } from "./useMeetingAgentChat";

export function useListeningSession(initialTitle?: string): UseListeningSessionReturn {
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

  const addSegment = useCallback(
    (seg: Omit<TranscriptSegmentItem, "id"> | LiveSpeechSegmentPayload) => {
      setSegments((prev) => [...prev, normalizeSpeechSegment(seg as any)]);
    },
    [],
  );

  const speech = useLiveSpeechRecognition({
    isRecording,
    isPaused: status === "paused",
    startedAt,
    onSegment: addSegment,
  });
  const ai = useAIListeningEngine({ isRecording, isActive: isAIListeningActive, segments });
  const summaries = useLiveSummaries({ isRecording, isActive: isAIListeningActive, segments, durationMs });
  const agentChat = useMeetingAgentChat({
    meetingTitle: title,
    meetingNotePath: createdNotePath || `Meetings/${title.replace(/[/\\?%*:|"<>]/g, "-")}.md`,
    segments,
    summaries: summaries.rollingSummaries,
  });

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => setDurationMs((p) => p + 1000), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

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
      summaries.resetSummaries();
    } catch {
      setStatus("error");
    }
  }, [ai, summaries]);

  const pauseSession = useCallback(async () => {
    try {
      await pauseMeetingRecording();
      setStatus("paused");
      if (isAIListeningActive) void summaries.summarizeNow();
    } catch {}
  }, [isAIListeningActive, summaries]);

  const resumeSession = useCallback(async () => {
    try {
      await resumeMeetingRecording();
      setStatus("recording");
    } catch {}
  }, []);

  const stopSession = useCallback(
    async (existingPaths: string[] = []): Promise<string | null> => {
      try {
        setStatus("processing");
        const res = await stopMeetingRecording().catch(() => null);
        const tempWav =
          res?.wavFilePath ||
          (res as unknown as { wav_file_path?: string })?.wav_file_path ||
          (res as unknown as { wav_path?: string })?.wav_path;

        let finalSegments = segments;
        if (finalSegments.length === 0 && tempWav) {
          const fallbackSegs = await transcribeRemainingAudioOnStop(tempWav);
          if (fallbackSegs.length > 0) {
            finalSegments = fallbackSegs;
            setSegments(finalSegments);
          }
        }

        let finalSummary = summaries.finalSummary || ai.liveSummary || summary;
        if (finalSegments.length > 0) {
          const fullText = finalSegments.map((s) => `${s.speaker}: ${s.text}`).join("\n");
          const generated = await summaries.generateFinalSummary(fullText);
          if (generated) finalSummary = generated;
        }

        const savedAnswers = ai.answers
          .filter((a) => a.status === "saved")
          .map((a) => ({ question: a.question, answer: a.answer, timestamp: a.timestamp }));
        const savedQuestions = ai.questions
          .filter((q) => q.status === "saved")
          .map((q) => ({ question: q.question, timestamp: q.timestamp }));

        const savedPath = await saveMeetingNoteToVault(
          {
            title,
            startedAt: startedAt ?? Date.now(),
            durationMs,
            segments: finalSegments,
            suggestedLinks,
            actionItems,
            summary: finalSummary,
            answers: savedAnswers,
            questions: savedQuestions,
          },
          existingPaths,
          tempWav,
        );
        setCreatedNotePath(savedPath);
        setStatus("idle");
        return savedPath;
      } catch {
        setStatus("idle");
        return null;
      }
    },
    [title, startedAt, durationMs, segments, suggestedLinks, actionItems, summary, ai, summaries],
  );

  const discardSession = useCallback(async () => {
    await stopMeetingRecording().catch(() => {});
    setStatus("idle");
    setDurationMs(0);
    setSegments([]);
    setSuggestedLinks([]);
    ai.resetAI();
    summaries.resetSummaries();
  }, [ai, summaries]);

  const retranscribeAudio = useCallback(async (filePath: string) => {
    try {
      setStatus("processing");
      const result = await rerunAudioTranscription(filePath);
      setSegments(result.segments);
      setActionItems(result.actionItems);
      setSummary(result.summary);
      setStatus("idle");
    } catch {
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
    liveSummary:
      summaries.rollingSummaries[summaries.rollingSummaries.length - 1]?.summary ||
      ai.liveSummary,
    answers: ai.answers,
    questions: ai.questions,
    aiStatus: summaries.status === "streaming" ? "streaming" : ai.aiStatus,
    aiError: summaries.error || ai.aiError,
    aiRequestCount: summaries.requestCount + ai.requestCount,
    setIsTranscriptVisible,
    setIsAIListeningActive,
    saveAnswer: ai.saveAnswer,
    dismissAnswer: ai.dismissAnswer,
    saveQuestion: ai.saveQuestion,
    dismissQuestion: ai.dismissQuestion,
    triggerAIStep: async () => {
      await summaries.summarizeNow();
    },
    setTitle,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
    addSegment,
    acceptLink: (id) =>
      setSuggestedLinks((p) => p.map((l) => (l.id === id ? { ...l, accepted: true } : l))),
    dismissLink: (id) =>
      setSuggestedLinks((p) => p.map((l) => (l.id === id ? { ...l, accepted: false } : l))),
    retranscribeAudio,
    setSuggestedLinks,
    setActionItems,
    setSummary,
    rollingSummaries: summaries.rollingSummaries,
    summaryInterval: summaries.intervalSetting,
    setSummaryInterval: summaries.setIntervalSetting,
    summarizeNow: summaries.summarizeNow,
    isAIListeningPaused: summaries.isPaused,
    togglePauseAI: () => summaries.setIsPaused((p) => !p),
    summaryStatusMessage: summaries.error,
    chatMessages: agentChat.messages,
    isChatExecuting: agentChat.isStreaming,
    askChatQuestion: agentChat.askQuestion,
    agentConversationId: agentChat.conversationId || "",
    simulateSpeechSegment: speech.simulateSpeechSegment,
  };
}
