import { useState, useEffect, useRef, useCallback } from "react";
import type {
  AIListeningAnswerItem,
  AIListeningFollowupQuestion,
  RollingTranscriptSegment,
} from "@app/ai-agent";
import { extractRollingWindow, processAIListeningStep } from "@app/ai-agent";
import { loadAISubsystem } from "../../ai/loadAISubsystem";
import { getVaultIndexDb, getSetting, withDbLock } from "../../vault";
import {
  AI_LISTENING_PROVIDER_KEY,
  AI_LISTENING_THROTTLE_KEY,
  type AIListeningProviderId,
} from "../SettingsDialog/AIListeningSettingsTab";

export interface UseAIListeningEngineProps {
  isRecording: boolean;
  isActive: boolean;
  segments: RollingTranscriptSegment[];
}

export function useAIListeningEngine({
  isRecording,
  isActive,
  segments,
}: UseAIListeningEngineProps) {
  const [liveSummary, setLiveSummary] = useState("");
  const [answers, setAnswers] = useState<AIListeningAnswerItem[]>([]);
  const [questions, setQuestions] = useState<AIListeningFollowupQuestion[]>([]);
  const [aiStatus, setAiStatus] = useState<
    "idle" | "streaming" | "throttled" | "error"
  >("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRunTimeRef = useRef<number>(0);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const summaryRef = useRef(liveSummary);
  summaryRef.current = liveSummary;

  const runAIStep = useCallback(async (force = false) => {
    if (!isActive || segmentsRef.current.length === 0) return;
    if (!isRecording && !force) return;

    // Cancel in-flight request if newer one starts
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiStatus("streaming");
    setAiError(null);

    try {
      const db = await getVaultIndexDb().catch(() => null);
      let providerId = "gemini";
      if (db) {
        const saved = await withDbLock(() =>
          getSetting(db, AI_LISTENING_PROVIDER_KEY),
        ).catch(() => null);
        if (saved) providerId = saved;
      }

      const ai = await loadAISubsystem();
      const provider = await ai
        .createConfiguredProvider(providerId as AIListeningProviderId)
        .catch(async () => {
          // Fallback to active system provider
          const current = await ai.loadSelectedProvider();
          return ai.createConfiguredProvider(current);
        });

      const rolling = extractRollingWindow(segmentsRef.current, 150_000);
      if (rolling.length === 0) {
        setAiStatus("idle");
        return;
      }

      setRequestCount((c) => c + 1);
      const output = await processAIListeningStep({
        provider,
        rollingSegments: rolling,
        previousSummary: summaryRef.current,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        if (output.summary) setLiveSummary(output.summary);
        if (output.answers && output.answers.length > 0) {
          setAnswers((prev) => {
            const existingQ = new Set(
              prev.map((a) => a.question.toLowerCase().trim()),
            );
            const fresh = output.answers.filter(
              (a) => !existingQ.has(a.question.toLowerCase().trim()),
            );
            return [...prev, ...fresh];
          });
        }
        if (output.suggestedQuestions && output.suggestedQuestions.length > 0) {
          setQuestions((prev) => {
            const existingQ = new Set(
              prev.map((q) => q.question.toLowerCase().trim()),
            );
            const fresh = output.suggestedQuestions.filter(
              (q) => !existingQ.has(q.question.toLowerCase().trim()),
            );
            return [...prev, ...fresh];
          });
        }
        setAiStatus("idle");
      }
    } catch (err: unknown) {
      if (
        (err as Error)?.name === "AbortError" ||
        (err as Error)?.message?.includes("aborted")
      ) {
        // Normal supersession cancellation
        return;
      }
      // Non-blocking status: keep recording and transcribing
      setAiStatus("error");
      setAiError((err as Error)?.message || "AI listening error");
    }
  }, [isActive, isRecording]);

  // Periodic throttled loop
  useEffect(() => {
    if (!isActive || !isRecording) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setAiStatus("idle");
      return;
    }

    const interval = setInterval(async () => {
      const now = Date.now();
      const db = await getVaultIndexDb().catch(() => null);
      let throttleMs = 25000;
      if (db) {
        const saved = await withDbLock(() =>
          getSetting(db, AI_LISTENING_THROTTLE_KEY),
        ).catch(() => null);
        if (saved && !isNaN(Number(saved))) throttleMs = Number(saved) * 1000;
      }

      if (now - lastRunTimeRef.current >= throttleMs) {
        lastRunTimeRef.current = now;
        void runAIStep();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, isRecording, runAIStep]);

  const saveAnswer = useCallback((id: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "saved" } : a)),
    );
  }, []);

  const dismissAnswer = useCallback((id: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "dismissed" } : a)),
    );
  }, []);

  const saveQuestion = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "saved" } : q)),
    );
  }, []);

  const dismissQuestion = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "dismissed" } : q)),
    );
  }, []);

  const resetAI = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLiveSummary("");
    setAnswers([]);
    setQuestions([]);
    setRequestCount(0);
    setAiStatus("idle");
    setAiError(null);
  }, []);

  // Auto-run AI step when segments arrive or update from audio file
  useEffect(() => {
    if (isActive && segments.length > 0 && !isRecording) {
      void runAIStep(true);
    }
  }, [isActive, segments, isRecording, runAIStep]);

  const triggerStep = useCallback(() => {
    void runAIStep(true);
  }, [runAIStep]);

  return {
    liveSummary,
    answers,
    questions,
    aiStatus,
    aiError,
    requestCount,
    saveAnswer,
    dismissAnswer,
    saveQuestion,
    dismissQuestion,
    triggerStep,
    resetAI,
  };
}
