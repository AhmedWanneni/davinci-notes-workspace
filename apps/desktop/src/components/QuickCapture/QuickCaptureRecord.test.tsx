// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuickCaptureRecord } from "./QuickCaptureRecord";
import * as transcriptionClient from "../../adapters/transcriptionClient";

vi.mock("../../adapters/transcriptionClient", () => ({
  startMeetingRecording: vi.fn(),
  pauseMeetingRecording: vi.fn(),
  resumeMeetingRecording: vi.fn(),
  stopMeetingRecording: vi.fn(),
  saveRecordedAudioToVault: vi.fn(),
}));

describe("QuickCaptureRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders idle state with record button and title input", () => {
    render(
      <QuickCaptureRecord
        onSaveRecord={vi.fn()}
        onDismiss={vi.fn()}
        folder="Voice Notes"
        onFolderChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Ready to record")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Start recording" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Voice note title")).toBeTruthy();
  });

  it("handles record, pause, resume, and stop flow", async () => {
    vi.mocked(transcriptionClient.startMeetingRecording).mockResolvedValue();
    vi.mocked(transcriptionClient.pauseMeetingRecording).mockResolvedValue();
    vi.mocked(transcriptionClient.resumeMeetingRecording).mockResolvedValue();
    vi.mocked(transcriptionClient.stopMeetingRecording).mockResolvedValue({
      wavFilePath: "/tmp/test-audio.wav",
      durationSeconds: 12,
      totalSamples: 192000,
      sampleRate: 16000,
    });

    render(
      <QuickCaptureRecord
        onSaveRecord={vi.fn()}
        onDismiss={vi.fn()}
        folder="Voice Notes"
        onFolderChange={vi.fn()}
      />,
    );

    const recordBtn = screen.getByRole("button", { name: "Start recording" });
    fireEvent.click(recordBtn);

    await waitFor(() => {
      expect(screen.getByText("Recording audio...")).toBeTruthy();
    });
    expect(transcriptionClient.startMeetingRecording).toHaveBeenCalledTimes(1);

    const pauseBtn = screen.getByRole("button", { name: "Pause recording" });
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(screen.getByText("Recording paused")).toBeTruthy();
    });

    const resumeBtn = screen.getByRole("button", { name: "Resume recording" });
    fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(screen.getByText("Recording audio...")).toBeTruthy();
    });

    const stopBtn = screen.getByRole("button", { name: "Stop recording" });
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(screen.getByText("Audio captured")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Save audio note" }),
      ).toBeTruthy();
    });
  });

  it("saves audio file and markdown note content with wikilink embed", async () => {
    const handleSaveRecord = vi.fn();
    vi.mocked(transcriptionClient.startMeetingRecording).mockResolvedValue();
    vi.mocked(transcriptionClient.stopMeetingRecording).mockResolvedValue({
      wavFilePath: "/tmp/recorded-audio.wav",
      durationSeconds: 15,
      totalSamples: 240000,
      sampleRate: 16000,
    });
    vi.mocked(transcriptionClient.saveRecordedAudioToVault).mockResolvedValue(
      "attachments/My Thoughts.wav",
    );

    render(
      <QuickCaptureRecord
        onSaveRecord={handleSaveRecord}
        onDismiss={vi.fn()}
        folder="Voice Notes"
        onFolderChange={vi.fn()}
      />,
    );

    const titleInput = screen.getByLabelText("Voice note title");
    fireEvent.change(titleInput, { target: { value: "My Thoughts" } });

    fireEvent.click(screen.getByRole("button", { name: "Start recording" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Stop recording" }),
      ).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save audio note" }),
      ).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Save audio note" }));

    await waitFor(() => {
      expect(handleSaveRecord).toHaveBeenCalledWith(
        expect.stringContaining("![[My Thoughts.wav]]"),
        "My Thoughts.md",
        "Voice Notes",
        "attachments/My Thoughts.wav",
      );
    });
  });
});
