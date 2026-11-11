// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useAIListeningEngine } from "./useAIListeningEngine";
import type { RollingTranscriptSegment } from "@app/ai-agent";

vi.mock("../../vault", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  getSetting: vi.fn().mockResolvedValue("gemini"),
  withDbLock: vi
    .fn()
    .mockImplementation(async (cb: () => Promise<unknown>) => cb()),
}));

const mockComplete = vi.fn();

vi.mock("../../ai/loadAISubsystem", () => ({
  loadAISubsystem: () =>
    Promise.resolve({
      createConfiguredProvider: vi.fn().mockResolvedValue({
        id: "mock-gemini",
        complete: mockComplete,
      }),
      loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
    }),
}));

describe("useAIListeningEngine", () => {
  const sampleSegments: RollingTranscriptSegment[] = [
    {
      id: "s1",
      text: "Welcome to the meeting.",
      startMs: 0,
      endMs: 5000,
      speaker: "me",
    },
    {
      id: "s2",
      text: "What are our deliverables?",
      startMs: 10000,
      endMs: 15000,
      speaker: "meeting",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockComplete.mockResolvedValue({
      content: JSON.stringify({
        summary: "Meeting started with focus on deliverables.",
        answers: [
          {
            question: "What are our deliverables?",
            answer: "Sprint features.",
          },
        ],
        suggestedQuestions: ["Who is testing sprint features?"],
      }),
    });
  });

  it("does not dispatch AI requests when toggle is off (isActive = false)", async () => {
    const { result } = renderHook(() =>
      useAIListeningEngine({
        isRecording: true,
        isActive: false,
        segments: sampleSegments,
      }),
    );

    await act(async () => {
      await result.current.triggerStep();
    });

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.current.requestCount).toBe(0);
    expect(result.current.liveSummary).toBe("");
  });

  it("dispatches AI request when isActive is true and updates live insights", async () => {
    const { result } = renderHook(() =>
      useAIListeningEngine({
        isRecording: true,
        isActive: true,
        segments: sampleSegments,
      }),
    );

    await act(async () => {
      await result.current.triggerStep();
    });

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(result.current.requestCount).toBe(1);
    expect(result.current.liveSummary).toBe(
      "Meeting started with focus on deliverables.",
    );
    expect(result.current.answers).toHaveLength(1);
    expect(result.current.answers[0].question).toBe(
      "What are our deliverables?",
    );
    expect(result.current.questions).toHaveLength(1);
    expect(result.current.questions[0].question).toBe(
      "Who is testing sprint features?",
    );
  });

  it("allows saving and dismissing answers and questions", async () => {
    const { result } = renderHook(() =>
      useAIListeningEngine({
        isRecording: true,
        isActive: true,
        segments: sampleSegments,
      }),
    );

    await act(async () => {
      await result.current.triggerStep();
    });

    const ansId = result.current.answers[0].id;
    const qId = result.current.questions[0].id;

    act(() => {
      result.current.saveAnswer(ansId);
      result.current.dismissQuestion(qId);
    });

    expect(result.current.answers.find((a) => a.id === ansId)?.status).toBe(
      "saved",
    );
    expect(result.current.questions.find((q) => q.id === qId)?.status).toBe(
      "dismissed",
    );
  });
});
