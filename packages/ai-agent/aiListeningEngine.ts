import type { AIProvider, ChatRequest } from "@app/ai-api";
import type {
  AIListeningOutput,
  AIListeningAnswerItem,
  AIListeningFollowupQuestion,
  RollingTranscriptSegment,
} from "./aiListeningTypes.js";

const DEFAULT_ROLLING_WINDOW_MS = 150_000; // 2.5 minutes

export function extractRollingWindow(
  segments: RollingTranscriptSegment[],
  windowMs: number = DEFAULT_ROLLING_WINDOW_MS,
): RollingTranscriptSegment[] {
  if (segments.length === 0) return [];
  const latestMs = Math.max(...segments.map((s) => s.endMs || s.startMs || 0));
  const cutoff = Math.max(0, latestMs - windowMs);
  return segments.filter((s) => (s.endMs || s.startMs || 0) >= cutoff);
}

export function buildAIListeningPrompt(
  rollingSegments: RollingTranscriptSegment[],
  previousSummary: string,
): string {
  const transcriptLines = rollingSegments.map((s) => {
    const speaker = s.speaker ?? "speaker";
    return `[${speaker}]: ${s.text}`;
  });

  return [
    "You are a real-time AI meeting assistant.",
    "Analyze the rolling transcript and current summary. Return a strict JSON object with this exact shape:",
    "{",
    '  "summary": "Continuously updated 1-3 sentence summary of the discussion.",',
    '  "answers": [',
    '    { "question": "Question asked in meeting", "answer": "Concise suggested answer" }',
    "  ],",
    '  "suggestedQuestions": [',
    '    "Relevant follow-up question the user could ask"',
    "  ]",
    "}",
    "",
    "Rules:",
    "1. Keep the summary concise, factual, and updated with recent points.",
    "2. If no questions were asked in the rolling transcript, keep 'answers' empty.",
    "3. Provide 1 to 3 insightful follow-up questions that help the meeting.",
    "4. Return ONLY valid JSON, with no other commentary or markdown formatting.",
    "",
    previousSummary ? `Previous Running Summary:\n${previousSummary}\n` : "",
    "Recent Transcript Window:",
    transcriptLines.join("\n") || "(No recent speech)",
  ].join("\n");
}

export function parseAIListeningJson(
  rawText: string,
): Partial<AIListeningOutput> {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      summary?: string;
      answers?: Array<{ question: string; answer: string }>;
      suggestedQuestions?: string[];
    };

    const now = Date.now();
    const answers: AIListeningAnswerItem[] = Array.isArray(parsed.answers)
      ? parsed.answers.map((a, idx) => ({
          id: `ans_${now}_${idx}`,
          timestamp: now,
          question: a.question || "",
          answer: a.answer || "",
          status: "suggested",
        }))
      : [];

    const suggestedQuestions: AIListeningFollowupQuestion[] = Array.isArray(
      parsed.suggestedQuestions,
    )
      ? parsed.suggestedQuestions.map((q, idx) => ({
          id: `q_${now}_${idx}`,
          timestamp: now,
          question: typeof q === "string" ? q : "",
          status: "suggested",
        }))
      : [];

    return {
      summary: parsed.summary?.trim() || "",
      answers,
      suggestedQuestions,
    };
  } catch {
    return {
      summary: rawText.slice(0, 300).trim(),
      answers: [],
      suggestedQuestions: [],
    };
  }
}

export async function processAIListeningStep(params: {
  provider: AIProvider;
  rollingSegments: RollingTranscriptSegment[];
  previousSummary: string;
  signal?: AbortSignal;
}): Promise<AIListeningOutput> {
  const { provider, rollingSegments, previousSummary, signal } = params;
  if (rollingSegments.length === 0) {
    return {
      summary: previousSummary,
      answers: [],
      suggestedQuestions: [],
    };
  }

  const prompt = buildAIListeningPrompt(rollingSegments, previousSummary);
  const request: ChatRequest = {
    messages: [
      {
        role: "system",
        content:
          "You are an intelligent real-time meeting assistant. Always output JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  };

  if (signal?.aborted) {
    throw new Error("AI listening step aborted");
  }

  const response = await provider.complete(request);
  const parsed = parseAIListeningJson(response.content);

  return {
    summary: parsed.summary || previousSummary,
    answers: parsed.answers || [],
    suggestedQuestions: parsed.suggestedQuestions || [],
  };
}
