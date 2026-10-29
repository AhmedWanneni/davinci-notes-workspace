// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ListeningView } from "./ListeningView";
import { AudioMeter } from "./AudioMeter";
import { TranscriptBubble } from "./TranscriptBubble";
import { TranscriptFeed } from "./TranscriptFeed";
import { SuggestedLinksPanel } from "./SuggestedLinksPanel";
import type { TranscriptSegmentItem } from "./listeningTypes";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("../../adapters/transcriptionClient", () => ({
  startMeetingRecording: vi.fn().mockResolvedValue(undefined),
  pauseMeetingRecording: vi.fn().mockResolvedValue(undefined),
  resumeMeetingRecording: vi.fn().mockResolvedValue(undefined),
  stopMeetingRecording: vi.fn().mockResolvedValue({
    total_samples: 16000,
    duration_secs: 1.0,
    wav_path: "/tmp/meeting.wav",
    wavFilePath: "/tmp/meeting.wav",
  }),
}));

vi.mock("../../vault/meetingNoteActions", () => ({
  saveMeetingNoteToVault: vi
    .fn()
    .mockResolvedValue("Meetings/2026-10-29 - Test Meeting.md"),
}));

describe("ListeningView Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AudioMeter", () => {
    it("renders mic and sys channels with clamped percentages", () => {
      render(
        <AudioMeter micLevel={0.42} systemLevel={0.88} isRecording={true} />,
      );
      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars).toHaveLength(2);
      expect(progressBars[0].getAttribute("aria-valuenow")).toBe("42");
      expect(progressBars[1].getAttribute("aria-valuenow")).toBe("88");
    });

    it("resets levels to 0 when not recording", () => {
      render(
        <AudioMeter micLevel={0.75} systemLevel={0.5} isRecording={false} />,
      );
      const progressBars = screen.getAllByRole("progressbar");
      expect(progressBars[0].getAttribute("aria-valuenow")).toBe("0");
      expect(progressBars[1].getAttribute("aria-valuenow")).toBe("0");
    });
  });

  describe("TranscriptBubble & Feed", () => {
    const sampleSegment: TranscriptSegmentItem = {
      id: "seg-1",
      speaker: "me",
      text: "Hello everyone, let's review the roadmap.",
      startMs: 65000,
      endMs: 68000,
      isFinal: true,
    };

    it("renders speaker name, formatted timestamp and text", () => {
      render(<TranscriptBubble segment={sampleSegment} />);
      expect(screen.getByText("You")).toBeDefined();
      expect(screen.getByText("01:05")).toBeDefined();
      expect(
        screen.getByText("Hello everyone, let's review the roadmap."),
      ).toBeDefined();
    });

    it("renders empty state when no segments exist", () => {
      render(<TranscriptFeed segments={[]} isRecording={false} />);
      expect(screen.getByTestId("transcript-empty-state")).toBeDefined();
      expect(screen.getByText("Ready to listen")).toBeDefined();
    });

    it("renders empty state listening title when recording", () => {
      render(<TranscriptFeed segments={[]} isRecording={true} />);
      expect(screen.getByText("Listening to conversation...")).toBeDefined();
    });

    it("renders bubbles when segments provided", () => {
      render(<TranscriptFeed segments={[sampleSegment]} isRecording={true} />);
      expect(screen.getAllByTestId("transcript-bubble")).toHaveLength(1);
    });
  });

  describe("ListeningView", () => {
    it("renders initial idle view with title input and start button", () => {
      render(<ListeningView initialTitle="Sprint Sync" />);
      const input = screen.getByLabelText("Meeting Title") as HTMLInputElement;
      expect(input.value).toBe("Sprint Sync");
      expect(screen.getByTestId("start-recording-btn")).toBeDefined();
    });

    it("starts recording and displays controls when start button clicked", async () => {
      render(<ListeningView initialTitle="Product Review" />);
      const startBtn = screen.getByTestId("start-recording-btn");

      await act(async () => {
        fireEvent.click(startBtn);
      });

      expect(screen.getByTestId("pause-recording-btn")).toBeDefined();
      expect(screen.getByTestId("stop-recording-btn")).toBeDefined();
      expect(screen.getByTestId("discard-recording-btn")).toBeDefined();
    });

    it("allows updating title", () => {
      render(<ListeningView initialTitle="Quarterly Planning" />);
      const input = screen.getByLabelText("Meeting Title") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Updated Planning" } });
      expect(input.value).toBe("Updated Planning");
    });

    it("stops recording and saves note with audio WAV path", async () => {
      const { saveMeetingNoteToVault } = await import(
        "../../vault/meetingNoteActions"
      );
      render(<ListeningView initialTitle="Sprint Retro" />);
      await act(async () => {
        fireEvent.click(screen.getByTestId("start-recording-btn"));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId("stop-recording-btn"));
      });
      expect(saveMeetingNoteToVault).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Sprint Retro" }),
        expect.any(Array),
        "/tmp/meeting.wav",
      );
    });
  });

  describe("SuggestedLinksPanel", () => {
    it("renders suggested links and handles accept and dismiss", () => {
      const onAccept = vi.fn();
      const onDismiss = vi.fn();
      const sampleLink = {
        id: "l-1",
        title: "Product Specs",
        path: "Specs.md",
        reason: "Matches keyword",
      };

      render(
        <SuggestedLinksPanel
          links={[sampleLink]}
          isRecording={true}
          onAccept={onAccept}
          onDismiss={onDismiss}
        />,
      );

      expect(screen.getByText("[[Product Specs]]")).toBeDefined();
      expect(screen.getByText("Matches keyword")).toBeDefined();

      fireEvent.click(screen.getByLabelText("Accept link to Product Specs"));
      expect(onAccept).toHaveBeenCalledWith("l-1");

      fireEvent.click(
        screen.getByLabelText("Dismiss suggestion for Product Specs"),
      );
      expect(onDismiss).toHaveBeenCalledWith("l-1");
    });
  });
});
