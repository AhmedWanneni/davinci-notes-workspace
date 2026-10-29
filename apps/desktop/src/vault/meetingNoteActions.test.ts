// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  renderMeetingMarkdown,
  saveMeetingNoteToVault,
} from "./meetingNoteActions";
import type { MeetingNoteParams } from "./meetingNoteActions";

vi.mock("./createNoteInVault", () => ({
  createNoteInVault: vi
    .fn()
    .mockImplementation((path: string) => Promise.resolve(path)),
}));

vi.mock("../adapters/transcriptionClient", () => ({
  saveRecordedAudioToVault: vi.fn().mockResolvedValue("attachments/audio.wav"),
}));

describe("meetingNoteActions", () => {
  const baseParams: MeetingNoteParams = {
    title: "Weekly Product Sync",
    startedAt: 1714000000000,
    durationMs: 95000,
    summary: "Discussed release timelines and blockers.",
    actionItems: ["Deploy staging build", "Review design specs"],
    attendees: ["Alice", "Bob"],
    suggestedLinks: [
      {
        id: "1",
        title: "Product Roadmap",
        path: "Roadmap.md",
        reason: "Discussed milestones",
        accepted: true,
      },
      {
        id: "2",
        title: "Old Arch",
        path: "Arch.md",
        reason: "Rejected topic",
        accepted: false,
      },
    ],
    segments: [
      {
        id: "s1",
        speaker: "me",
        text: "Let's kick off with Q3 goals.",
        startMs: 0,
        endMs: 4000,
        isFinal: true,
      },
      {
        id: "s2",
        speaker: "meeting",
        text: "Agreed, we are ready.",
        startMs: 5000,
        endMs: 8000,
        isFinal: true,
      },
    ],
  };

  it("renders canonical meeting markdown frontmatter and sections", () => {
    const md = renderMeetingMarkdown(baseParams);

    expect(md).toContain('title: "Weekly Product Sync"');
    expect(md).toContain("tags:\n  - meeting");
    expect(md).toContain("duration_seconds: 95");
    expect(md).toContain('- "Alice"');
    expect(md).toContain("# Weekly Product Sync");
    expect(md).toContain(
      "## Summary\nDiscussed release timelines and blockers.",
    );
    expect(md).toContain("- [ ] Deploy staging build");
    expect(md).toContain("- [[Product Roadmap]] — Discussed milestones");
    // Rejected link should not be present
    expect(md).not.toContain("- [[Old Arch]]");
    // Transcript check
    expect(md).toContain("### 00:00 — Me\nLet's kick off with Q3 goals.");
    expect(md).toContain("### 00:05 — Meeting\nAgreed, we are ready.");
  });

  it("creates note path with collision resolution", async () => {
    const existing = ["Meetings/2024-04-24 - Weekly Product Sync.md"];
    const created = await saveMeetingNoteToVault(baseParams, existing);
    expect(created).toMatch(
      /Meetings\/\d{4}-\d{2}-\d{2} - Weekly Product Sync \(1\)\.md/,
    );
  });

  it("renders audio recording wikilink embed and saves audio to vault", async () => {
    const paramsWithAudio: MeetingNoteParams = {
      ...baseParams,
      audioRelPath: "attachments/2024-04-24 - Weekly Product Sync.wav",
    };
    const md = renderMeetingMarkdown(paramsWithAudio);
    expect(md).toContain("## Audio Recording");
    expect(md).toContain("![[2024-04-24 - Weekly Product Sync.wav]]");
  });

  it("saves audio to attachments folder so meetings folder contains only the note", async () => {
    const { saveRecordedAudioToVault } =
      await import("../adapters/transcriptionClient");
    const created = await saveMeetingNoteToVault(
      baseParams,
      [],
      "/tmp/audio.wav",
    );
    expect(created).toMatch(
      /Meetings\/\d{4}-\d{2}-\d{2} - Weekly Product Sync\.md/,
    );
    expect(saveRecordedAudioToVault).toHaveBeenCalledWith(
      "/tmp/audio.wav",
      expect.stringMatching(
        /^attachments\/\d{4}-\d{2}-\d{2} - Weekly Product Sync\.wav$/,
      ),
    );
  });
});
