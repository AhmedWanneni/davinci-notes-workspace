import { useState, useRef, useCallback, useEffect } from "react";
import type { TranscriptSegmentItem } from "./listeningTypes";
import { resolveRecordPageAIProvider } from "./resolveRecordPageAIProvider";

export interface RollingSummaryItem {
  id: string;
  timeRange: string;
  timestampMs: number;
  summary: string;
}

export type SummaryInterval = "1m" | "2m" | "5m" | "manual";

export interface UseLiveSummariesProps {
  isRecording: boolean;
  isActive: boolean;
  segments: TranscriptSegmentItem[];
  durationMs: number;
}

export function formatMinSec(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const INTERVAL_MS_MAP: Record<SummaryInterval, number> = {
  "1m": 60_000,
  "2m": 120_000,
  "5m": 300_000,
  manual: Infinity,
};

export function useLiveSummaries({
  isRecording,
  isActive,
  segments,
  durationMs,
}: UseLiveSummariesProps) {
  const [rollingSummaries, setRollingSummaries] = useState<RollingSummaryItem[]>([]);
  const [finalSummary, setFinalSummary] = useState<string>("");
  const [intervalSetting, setIntervalSetting] = useState<SummaryInterval>("2m");
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState<"idle" | "streaming" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  const inFlightRef = useRef(false);
  const lastSummaryTimeMsRef = useRef(0);
  const lastSummaryIndexRef = useRef(0);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const durationMsRef = useRef(durationMs);
  durationMsRef.current = durationMs;

  const runSummaryStep = useCallback(
    async (force = false): Promise<string | null> => {
      if (inFlightRef.current) return null;
      if (!isActive || isPaused) return null;
      if (segmentsRef.current.length === 0) return null;

      const newSegments = segmentsRef.current.slice(lastSummaryIndexRef.current);
      if (newSegments.length === 0) return null;

      const newText = newSegments.map((s) => `${s.speaker}: ${s.text}`).join("\n");
      const wordCount = countWords(newText);

      // Check threshold: at least 150 words unless explicitly forced (e.g. "Summarize now")
      if (!force && wordCount < 150) {
        return null;
      }

      inFlightRef.current = true;
      setStatus("streaming");
      setError(null);

      const startTimeMs = lastSummaryTimeMsRef.current;
      const endTimeMs = durationMsRef.current || (segmentsRef.current[segmentsRef.current.length - 1]?.timestampMs ?? 0);
      const timeRange = `${formatMinSec(startTimeMs)} - ${formatMinSec(endTimeMs)}`;

      try {
        const provider = await resolveRecordPageAIProvider();

        const previousSummary = rollingSummaries[rollingSummaries.length - 1]?.summary || "";
        const prompt = `You are a real-time meeting summarizer. Given the previous summary and the new transcript segment, produce a concise, high-value summary of what was discussed in this interval. Keep it brief (2-4 bullet points or sentences).

${previousSummary ? `Previous running summary:\n${previousSummary}\n\n` : ""}New discussion (${timeRange}):
${newText}`;

        setRequestCount((c) => c + 1);
        const response = await provider.complete({
          messages: [
            {
              role: "system",
              content: "You are an intelligent real-time meeting summarizer. Always output clean, concise markdown bullet points.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        });

        const summaryText = response.content.trim();
        const item: RollingSummaryItem = {
          id: `sum_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timeRange,
          timestampMs: endTimeMs,
          summary: summaryText,
        };

        setRollingSummaries((prev) => [...prev, item]);
        lastSummaryTimeMsRef.current = endTimeMs;
        lastSummaryIndexRef.current = segmentsRef.current.length;
        setStatus("idle");
        return summaryText;
      } catch (err: unknown) {
        setStatus("error");
        setError((err as Error)?.message || "Live summary failed");
        return null;
      } finally {
        inFlightRef.current = false;
      }
    },
    [isActive, isPaused, rollingSummaries],
  );

  // Periodic interval trigger
  useEffect(() => {
    if (!isRecording || !isActive || isPaused || intervalSetting === "manual") {
      return;
    }

    const intervalMs = INTERVAL_MS_MAP[intervalSetting];
    const timer = setInterval(() => {
      const elapsedSinceLast = durationMsRef.current - lastSummaryTimeMsRef.current;
      if (elapsedSinceLast >= intervalMs) {
        void runSummaryStep(false);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isRecording, isActive, isPaused, intervalSetting, runSummaryStep]);

  // Generates final summary on stop from the full raw transcript
  const generateFinalSummary = useCallback(async (): Promise<string> => {
    if (segmentsRef.current.length === 0) return "";

    setStatus("streaming");
    setError(null);

    const fullTranscript = segmentsRef.current
      .map((s) => `[${formatMinSec(s.timestampMs)}] ${s.speaker}: ${s.text}`)
      .join("\n");

    try {
      const provider = await resolveRecordPageAIProvider();

      const response = await provider.complete({
        messages: [
          {
            role: "system",
            content: "You are an executive assistant. Generate a comprehensive final meeting summary from the full raw transcript. Include executive overview, key decisions, and takeaways in markdown.",
          },
          {
            role: "user",
            content: `Meeting duration: ${formatMinSec(durationMsRef.current)}\n\nFull raw transcript:\n${fullTranscript}`,
          },
        ],
        temperature: 0.2,
      });

      const finalResult = response.content.trim();
      setFinalSummary(finalResult);
      setStatus("idle");
      return finalResult;
    } catch (err: unknown) {
      setStatus("error");
      setError((err as Error)?.message || "Final summary failed");
      return "";
    }
  }, []);

  const resetSummaries = useCallback(() => {
    setRollingSummaries([]);
    setFinalSummary("");
    setStatus("idle");
    setError(null);
    setRequestCount(0);
    lastSummaryTimeMsRef.current = 0;
    lastSummaryIndexRef.current = 0;
    inFlightRef.current = false;
  }, []);

  return {
    rollingSummaries,
    finalSummary,
    intervalSetting,
    setIntervalSetting,
    isPaused,
    setIsPaused,
    status,
    error,
    requestCount,
    summarizeNow: () => runSummaryStep(true),
    generateFinalSummary,
    resetSummaries,
  };
}
