// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLiveSummaries } from "./useLiveSummaries";
import { useMeetingAgentChat } from "./useMeetingAgentChat";
import { searchMeetingTranscript } from "./searchMeetingTranscript";
import { useAgentStore } from "../AgentView/useAgentStore";
import type { TranscriptSegmentItem } from "./listeningTypes";

const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
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

describe("6-Minute Meeting Clip Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAgentStore.setState({ conversations: [], activeConversationId: null });
  });

  it("verifies 6-minute clip with rolling summaries, silence throttling, transcript search, agent thread, and final note summary", async () => {
    let callCount = 0;
    mockComplete.mockImplementation(async (payload: { messages?: Array<{ role: string; content: string }> }) => {
      callCount++;
      const userContent = payload?.messages?.find((m) => m.role === "user")?.content || "";
      const systemContent = payload?.messages?.find((m) => m.role === "system")?.content || "";
      if (userContent.includes("Full raw transcript") || systemContent.includes("final meeting summary")) {
        return {
          content:
            "Final Comprehensive Summary: Over the 6-minute meeting, the team reviewed the project roadmap, finalized the SQLite FTS5 universal locking strategy, and assigned QA sign-off to Alice for November 15.",
        };
      }
      if (callCount === 1) {
        return {
          content:
            "00:00 - 02:00: The team kicked off the roadmap discussion, highlighting key release targets and initial engineering deadlines.",
        };
      }
      if (callCount === 2) {
        return {
          content:
            "02:00 - 04:00: Deep dive into the SQLite FTS5 index architecture, emphasizing ADR-0168 universal write locking to prevent database contention.",
        };
      }
      return {
        content: "04:00 - 06:00: Wrap-up of action items; Alice confirmed to lead QA sign-off on November 15.",
      };
    });

    const segments: TranscriptSegmentItem[] = [];
    const words200 = "word ".repeat(200);

    // Initial render with AI listening active
    const { result, rerender } = renderHook(
      ({ isRecording, isActive, segs, durationMs }) =>
        useLiveSummaries({
          isRecording,
          isActive,
          segments: segs,
          durationMs,
        }),
      {
        initialProps: { isRecording: true, isActive: true, segs: segments, durationMs: 0 },
      },
    );

    // Segment 1 (0:00 - 2:00, 200 words)
    segments.push({
      id: "s1",
      speaker: "me",
      text: `Let's discuss the roadmap and milestone schedule. ${words200}`,
      startMs: 0,
      endMs: 120_000,
      isFinal: true,
    });
    rerender({ isRecording: true, isActive: true, segs: [...segments], durationMs: 120_000 });

    await act(async () => {
      await result.current.summarizeNow();
    });

    expect(callCount).toBe(1);
    expect(result.current.rollingSummaries.length).toBe(1);
    expect(result.current.rollingSummaries[0].summary).toContain("00:00 - 02:00");

    // Segment 2 (2:00 - 4:00, 200 words)
    segments.push({
      id: "s2",
      speaker: "meeting",
      text: `For the SQLite FTS5 locking, we must strictly obey ADR-0168 universal write lock discipline under withDbLock. ${words200}`,
      startMs: 120_000,
      endMs: 240_000,
      isFinal: true,
    });
    rerender({ isRecording: true, isActive: true, segs: [...segments], durationMs: 240_000 });

    await act(async () => {
      await result.current.summarizeNow();
    });

    expect(callCount).toBe(2);
    expect(result.current.rollingSummaries.length).toBe(2);
    expect(result.current.rollingSummaries[1].summary).toContain("02:00 - 04:00");

    // Period 3 (4:00 - 5:00): Silence period - no new words added!
    // Attempting summarizeNow during silence should be skipped (returns null)
    await act(async () => {
      await result.current.summarizeNow();
    });
    expect(callCount).toBe(2); // No request sent during silence!

    // Toggle OFF check: with isActive = false, zero requests sent
    rerender({ isRecording: true, isActive: false, segs: [...segments], durationMs: 300_000 });
    await act(async () => {
      await result.current.summarizeNow();
    });
    expect(callCount).toBe(2); // Still 2!

    // Segment 3 (5:00 - 6:00, 200 words) with toggle back ON
    rerender({ isRecording: true, isActive: true, segs: [...segments], durationMs: 360_000 });
    segments.push({
      id: "s3",
      speaker: "me",
      text: `Action items: Alice will complete the QA verification by November 15. ${words200}`,
      startMs: 300_000,
      endMs: 360_000,
      isFinal: true,
    });
    rerender({ isRecording: true, isActive: true, segs: [...segments], durationMs: 360_000 });

    await act(async () => {
      await result.current.summarizeNow();
    });

    expect(callCount).toBe(3); // Exactly 3 summary requests sent over 6-min clip!
    expect(result.current.rollingSummaries.length).toBe(3);

    // (e) Detail question answered directly from raw transcript using FTS5 search
    const ftsMatches = await searchMeetingTranscript(segments, "SQLite FTS5 locking");
    expect(ftsMatches.length).toBeGreaterThan(0);
    expect(ftsMatches[0].text).toContain("ADR-0168 universal write lock discipline");

    // (d) Path B Agent Question & Conversation Thread in useAgentStore
    const { result: chatResult } = renderHook(() =>
      useMeetingAgentChat({
        meetingTitle: "Sprint 6 Planning",
        meetingNotePath: "Meetings/Sprint-6-Planning.md",
        segments,
        summaries: result.current.rollingSummaries,
      }),
    );

    await act(async () => {
      await chatResult.current.askQuestion("Who is assigned to QA and what is the deadline?");
    });

    expect(chatResult.current.messages.length).toBe(2);
    expect(chatResult.current.messages[0].role).toBe("user");
    expect(chatResult.current.messages[1].role).toBe("assistant");

    // Verify conversation thread is stored in useAgentStore and visible on agent page
    const agentStoreConversations = useAgentStore.getState().conversations;
    expect(agentStoreConversations.length).toBe(1);
    expect(agentStoreConversations[0].id).toBe(chatResult.current.conversationId);
    expect(agentStoreConversations[0].title).toContain("Sprint 6 Planning");

    // (f) Final summary generated on stop from full raw transcript
    const fullTranscriptText = segments.map((s) => `${s.speaker}: ${s.text}`).join("\n");
    const finalSummary = await result.current.generateFinalSummary(fullTranscriptText);
    expect(finalSummary).toContain("Final Comprehensive Summary");
    expect(finalSummary).toContain("Alice");
  });
});
