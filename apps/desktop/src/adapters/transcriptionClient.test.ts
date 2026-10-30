import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startMeetingRecording,
  pauseMeetingRecording,
  resumeMeetingRecording,
  stopMeetingRecording,
  getMeetingRecordingStatus,
  listAudioInputDevices,
  transcribeAudioFile,
} from "./transcriptionClient";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("transcriptionClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls start_meeting_recording via invoke", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(undefined as never);

    await startMeetingRecording();
    expect(invoke).toHaveBeenCalledWith("start_meeting_recording", undefined);
  });

  it("calls pause, resume, and stop recording", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue({
      wavFilePath: "/tmp/recording.wav",
      durationSeconds: 12.5,
      totalSamples: 200000,
      sampleRate: 16000,
    } as never);

    await pauseMeetingRecording();
    expect(invoke).toHaveBeenCalledWith("pause_meeting_recording", undefined);

    await resumeMeetingRecording();
    expect(invoke).toHaveBeenCalledWith("resume_meeting_recording", undefined);

    const result = await stopMeetingRecording();
    expect(result.wavFilePath).toBe("/tmp/recording.wav");
    expect(result.durationSeconds).toBe(12.5);
  });

  it("queries meeting recording status", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue({
      status: "recording",
      elapsedSeconds: 42,
      sampleCount: 672000,
    } as never);

    const status = await getMeetingRecordingStatus();
    expect(status.status).toBe("recording");
    expect(status.elapsedSeconds).toBe(42);
  });

  it("lists input audio devices", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue(["Built-in Microphone", "Headset"] as never);

    const devices = await listAudioInputDevices();
    expect(devices).toEqual(["Built-in Microphone", "Headset"]);
  });

  it("transcribes audio file with parameters", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockResolvedValue([
      { id: 1, text: "Hello world", startMs: 0, endMs: 2000 },
    ] as never);

    const segments = await transcribeAudioFile("/tmp/test.wav", "test-key");
    expect(segments).toHaveLength(1);
    expect(segments[0].text).toBe("Hello world");
    expect(invoke).toHaveBeenCalledWith("transcribe_audio_file", {
      filePath: "/tmp/test.wav",
      apiKey: "test-key",
      endpoint: undefined,
      model: undefined,
    });
  });
});
