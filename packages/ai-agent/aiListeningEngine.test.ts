import { describe, it, expect, vi } from "vitest";
import {
  extractRollingWindow,
  buildAIListeningPrompt,
  parseAIListeningJson,
  processAIListeningStep,
} from "./aiListeningEngine.js";
import type { RollingTranscriptSegment } from "./aiListeningTypes.js";
import type { AIProvider } from "@app/ai-api";

describe("aiListeningEngine", () => {
  const sampleSegments: RollingTranscriptSegment[] = [
    {
      id: "1",
      text: "Introduction and welcome.",
      startMs: 0,
      endMs: 10000,
      speaker: "me",
    },
    {
      id: "2",
      text: "What is our deployment target?",
      startMs: 60000,
      endMs: 70000,
      speaker: "meeting",
    },
    {
      id: "3",
      text: "We plan to ship to Cloudflare Pages.",
      startMs: 160000,
      endMs: 180000,
      speaker: "me",
    },
    {
      id: "4",
      text: "Can we finish this by Friday?",
      startMs: 200000,
      endMs: 220000,
      speaker: "meeting",
    },
  ];

  describe("extractRollingWindow", () => {
    it("returns empty array when input is empty", () => {
      expect(extractRollingWindow([])).toEqual([]);
    });

    it("extracts only segments within the rolling window threshold", () => {
      // Latest is 220_000ms. With 100_000ms window, cutoff is 120_000ms.
      const windowed = extractRollingWindow(sampleSegments, 100_000);
      expect(windowed.map((s) => s.id)).toEqual(["3", "4"]);
    });

    it("returns all segments if total duration is under the window", () => {
      const windowed = extractRollingWindow(sampleSegments, 300_000);
      expect(windowed.length).toBe(4);
    });
  });

  describe("buildAIListeningPrompt", () => {
    it("formats previous summary and transcript segments into a prompt", () => {
      const prompt = buildAIListeningPrompt(
        sampleSegments.slice(2),
        "Initial discussion held.",
      );
      expect(prompt).toContain(
        "Previous Running Summary:\nInitial discussion held.",
      );
      expect(prompt).toContain("[me]: We plan to ship to Cloudflare Pages.");
      expect(prompt).toContain("[meeting]: Can we finish this by Friday?");
      expect(prompt).toContain("Return ONLY valid JSON");
    });
  });

  describe("parseAIListeningJson", () => {
    it("parses valid JSON response into structured summary, answers, and questions", () => {
      const raw = JSON.stringify({
        summary: "The team agreed on Cloudflare Pages and Friday target.",
        answers: [
          {
            question: "Can we finish this by Friday?",
            answer: "Yes, if testing finishes tomorrow.",
          },
        ],
        suggestedQuestions: ["Who is leading the deployment?"],
      });

      const result = parseAIListeningJson(raw);
      expect(result.summary).toBe(
        "The team agreed on Cloudflare Pages and Friday target.",
      );
      expect(result.answers).toHaveLength(1);
      expect(result.answers?.[0].question).toBe(
        "Can we finish this by Friday?",
      );
      expect(result.answers?.[0].status).toBe("suggested");
      expect(result.suggestedQuestions).toHaveLength(1);
      expect(result.suggestedQuestions?.[0].question).toBe(
        "Who is leading the deployment?",
      );
    });

    it("handles markdown code fences in json output", () => {
      const raw =
        "```json\n" +
        JSON.stringify({
          summary: "Summary text",
          answers: [],
          suggestedQuestions: ["Next steps?"],
        }) +
        "\n```";

      const result = parseAIListeningJson(raw);
      expect(result.summary).toBe("Summary text");
      expect(result.suggestedQuestions?.[0].question).toBe("Next steps?");
    });

    it("falls back gracefully on malformed json", () => {
      const result = parseAIListeningJson(
        "This is a raw text response rather than json.",
      );
      expect(result.summary).toBe(
        "This is a raw text response rather than json.",
      );
      expect(result.answers).toEqual([]);
      expect(result.suggestedQuestions).toEqual([]);
    });
  });

  describe("processAIListeningStep", () => {
    it("calls provider complete and returns structured output", async () => {
      const mockProvider: AIProvider = {
        id: "mock",
        mode: "cloud",
        capabilities: new Set(["chat"]),
        embed: vi.fn(),
        dispose: vi.fn().mockResolvedValue(undefined),
        complete: vi.fn().mockResolvedValue({
          content: JSON.stringify({
            summary: "Sprint target confirmed.",
            answers: [{ question: "Target?", answer: "Friday." }],
            suggestedQuestions: ["Is QA ready?"],
          }),
          model: "mock-model",
        }),
      };

      const result = await processAIListeningStep({
        provider: mockProvider,
        rollingSegments: sampleSegments,
        previousSummary: "Started call.",
      });

      expect(mockProvider.complete).toHaveBeenCalledTimes(1);
      expect(result.summary).toBe("Sprint target confirmed.");
      expect(result.answers).toHaveLength(1);
      expect(result.suggestedQuestions).toHaveLength(1);
    });

    it("throws if signal is already aborted", async () => {
      const mockProvider: AIProvider = {
        id: "mock",
        mode: "cloud",
        capabilities: new Set(["chat"]),
        embed: vi.fn(),
        dispose: vi.fn().mockResolvedValue(undefined),
        complete: vi.fn(),
      };

      const controller = new AbortController();
      controller.abort();

      await expect(
        processAIListeningStep({
          provider: mockProvider,
          rollingSegments: sampleSegments,
          previousSummary: "",
          signal: controller.signal,
        }),
      ).rejects.toThrow("AI listening step aborted");
      expect(mockProvider.complete).not.toHaveBeenCalled();
    });
  });
});
