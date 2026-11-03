// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLiveSummaries } from "./useLiveSummaries";
import type { TranscriptSegmentItem } from "./listeningTypes";

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn().mockResolvedValue({
    content: "- Key decision: ship the feature on Friday.\n- Action: update documentation.",
  }),
}));

vi.mock("../../ai/loadAISubsystem", () => ({
  loadAISubsystem: vi.fn().mockResolvedValue({
    loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
    createConfiguredProvider: vi.fn().mockResolvedValue({
      complete: mockComplete,
    }),
  }),
}));

vi.mock("../../vault", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue(null),
  getSetting: vi.fn().mockResolvedValue(null),
  withDbLock: vi.fn((fn) => fn()),
}));

describe("useLiveSummaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleSegments: TranscriptSegmentItem[] = [
    {
      id: "seg-1",
      speaker: "Alice",
      text: "We are reviewing the progress of the desktop application UI and design tokens integration.",
      timestampMs: 10000,
    },
    {
      id: "seg-2",
      speaker: "Bob",
      text: "The audio recorder progress bar now supports full width acoustic waveform visualization.",
      timestampMs: 25000,
    },
  ];

  it("sends zero summary requests when AI Listening is inactive", async () => {
    const { result } = renderHook(() =>
      useLiveSummaries({
        isRecording: true,
        isActive: false,
        segments: sampleSegments,
        durationMs: 30000,
      }),
    );

    await act(async () => {
      await result.current.summarizeNow();
    });

    expect(mockComplete).not.toHaveBeenCalled();
    expect(result.current.requestCount).toBe(0);
  });

  it("triggers manual summary on demand via summarizeNow()", async () => {
    const { result } = renderHook(() =>
      useLiveSummaries({
        isRecording: true,
        isActive: true,
        segments: sampleSegments,
        durationMs: 30000,
      }),
    );

    await act(async () => {
      const summary = await result.current.summarizeNow();
      expect(summary).toContain("Key decision");
    });

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(result.current.requestCount).toBe(1);
    expect(result.current.rollingSummaries.length).toBe(1);
    expect(result.current.rollingSummaries[0].timeRange).toBe("00:00 - 00:30");
  });

  it("respects pause toggle and does not trigger while paused", async () => {
    const { result } = renderHook(() =>
      useLiveSummaries({
        isRecording: true,
        isActive: true,
        segments: sampleSegments,
        durationMs: 30000,
      }),
    );

    act(() => {
      result.current.setIsPaused(true);
    });

    await act(async () => {
      await result.current.summarizeNow();
    });

    expect(mockComplete).not.toHaveBeenCalled();
  });

  it("generates final summary on stop from full raw transcript", async () => {
    const { result } = renderHook(() =>
      useLiveSummaries({
        isRecording: false,
        isActive: true,
        segments: sampleSegments,
        durationMs: 30000,
      }),
    );

    await act(async () => {
      const final = await result.current.generateFinalSummary();
      expect(final).toBeDefined();
    });

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockComplete.mock.calls[0][0].messages[1].content).toContain("Full raw transcript");
  });
});
