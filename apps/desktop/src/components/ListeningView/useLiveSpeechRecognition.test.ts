// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLiveSpeechRecognition } from "./useLiveSpeechRecognition";

describe("useLiveSpeechRecognition", () => {
  it("formats and feeds speech segments with timestamp offset", () => {
    const onSegment = vi.fn();
    const startedAt = Date.now() - 5000;

    const { result } = renderHook(() =>
      useLiveSpeechRecognition({
        isRecording: true,
        isPaused: false,
        startedAt,
        onSegment,
      }),
    );

    act(() => {
      result.current.simulateSpeechSegment("Hello world, this is our project kick-off.", "Alice");
    });

    expect(onSegment).toHaveBeenCalledTimes(1);
    expect(onSegment).toHaveBeenCalledWith({
      text: "Hello world, this is our project kick-off.",
      speaker: "Alice",
      timestampMs: expect.any(Number),
    });
  });

  it("ignores empty whitespace speech segments", () => {
    const onSegment = vi.fn();
    const { result } = renderHook(() =>
      useLiveSpeechRecognition({
        isRecording: true,
        isPaused: false,
        startedAt: Date.now(),
        onSegment,
      }),
    );

    act(() => {
      result.current.simulateSpeechSegment("   ");
    });

    expect(onSegment).not.toHaveBeenCalled();
  });
});
