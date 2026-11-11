// @vitest-environment jsdom
import { describe, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ListeningView } from "./ListeningView";

vi.mock("../../adapters/transcriptionClient", () => ({
  startMeetingRecording: vi.fn().mockResolvedValue(undefined),
  pauseMeetingRecording: vi.fn().mockResolvedValue(undefined),
  resumeMeetingRecording: vi.fn().mockResolvedValue(undefined),
  stopMeetingRecording: vi.fn().mockResolvedValue({
    wavFilePath: "/tmp/mock.wav",
    durationSeconds: 10,
    totalSamples: 160000,
    sampleRate: 16000,
  }),
}));

vi.mock("../../vault", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue(null),
  getSetting: vi.fn().mockResolvedValue(null),
  withDbLock: vi.fn((fn) => fn()),
}));

describe("Trace AI Listening Pipeline", () => {
  it("traces toggle -> state -> trigger -> transcript buffer -> AI call -> UI during recording", async () => {
    vi.useFakeTimers();

    render(<ListeningView initialTitle="Trace Test Meeting" />);

    // Step 1: Start recording
    const recordBtn = screen.getByTestId("start-recording-btn");
    await act(async () => {
      fireEvent.click(recordBtn);
    });

    // Step 2: Toggle AI Listening
    const aiToggle = screen.getByTestId("ai-listening-toggle");
    await act(async () => {
      fireEvent.click(aiToggle);
    });

    // Step 3: Advance timer past throttle (25 seconds)
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    vi.useRealTimers();
  });
});
