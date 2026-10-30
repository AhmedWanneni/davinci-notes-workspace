import { describe, it, expect, vi, beforeEach } from "vitest";
import { rerunAudioTranscription } from "./rerunAudioTranscription";
import * as transcriptionClient from "../../adapters/transcriptionClient";
import * as secretStore from "../../ai/desktopAISecretStore";

vi.mock("../../adapters/transcriptionClient", () => ({
  transcribeAudioFile: vi.fn(),
}));

vi.mock("../../ai/desktopAISecretStore", () => ({
  createDesktopAISecretStore: vi.fn(),
}));

describe("rerunAudioTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads API key, transcribes audio file, extracts action items and summary", async () => {
    vi.mocked(secretStore.createDesktopAISecretStore).mockReturnValue({
      load: vi.fn().mockResolvedValue("test-key-123"),
      save: vi.fn(),
      clear: vi.fn(),
    });

    vi.mocked(transcriptionClient.transcribeAudioFile).mockResolvedValue([
      {
        id: 1,
        text: "We need to finish the design system docs tomorrow.",
        startMs: 0,
        endMs: 3000,
        speaker: "me",
      },
      {
        id: 2,
        text: "Make sure to review pull request 42.",
        startMs: 3100,
        endMs: 6000,
        speaker: "meeting",
      },
    ]);

    const result = await rerunAudioTranscription("Meetings/call.wav");

    expect(transcriptionClient.transcribeAudioFile).toHaveBeenCalledWith(
      "Meetings/call.wav",
      "test-key-123",
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toContain("finish the design system");
    expect(result.actionItems.length).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });
});
