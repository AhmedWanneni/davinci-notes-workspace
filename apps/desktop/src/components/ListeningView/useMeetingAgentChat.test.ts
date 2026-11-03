// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMeetingAgentChat } from "./useMeetingAgentChat";
import { useAgentStore } from "../AgentView/useAgentStore";
import type { TranscriptSegmentItem } from "./listeningTypes";

const { mockSendMessage } = vi.hoisted(() => ({
  mockSendMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../AgentView/agentStorePersistence", () => ({
  persistToVault: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../AgentView/useAgentExecution", () => ({
  useAgentExecution: vi.fn(() => ({
    messages: [],
    setMessages: vi.fn(),
    sendMessage: mockSendMessage,
    stagedChanges: [],
    isStreaming: false,
    handleAcceptChange: vi.fn(),
    handleRejectChange: vi.fn(),
  })),
}));

vi.mock("./searchMeetingTranscript", () => ({
  searchMeetingTranscript: vi.fn().mockResolvedValue([
    {
      segmentId: "seg-1",
      speaker: "Bob",
      text: "The beta launch date is November 15th.",
      timestampMs: 15000,
      matchScore: 1,
    },
  ]),
}));

describe("useMeetingAgentChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAgentStore.setState({
      conversations: [],
      activeConversationId: null,
    });
  });

  const sampleSegments: TranscriptSegmentItem[] = [
    {
      id: "seg-1",
      speaker: "Bob",
      text: "The beta launch date is November 15th.",
      timestampMs: 15000,
    },
  ];

  it("creates an agent conversation thread and executes prompt with transcript search context", async () => {
    const { result } = renderHook(() =>
      useMeetingAgentChat({
        meetingTitle: "Sprint 42 Sync",
        notePath: "Meetings/Sprint-42.md",
        segments: sampleSegments,
        rollingSummaries: [],
      }),
    );

    await act(async () => {
      await result.current.askQuestion("When is the beta launch?");
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    const sentPrompt = mockSendMessage.mock.calls[0][0];
    expect(sentPrompt).toContain("Sprint 42 Sync");
    expect(sentPrompt).toContain("relevant_raw_transcript_segments");
    expect(sentPrompt).toContain("November 15th");
    expect(result.current.conversationId).toBeDefined();

    // Verify conversation exists in useAgentStore
    const convs = useAgentStore.getState().conversations;
    expect(convs.some((c) => c.title.includes("Sprint 42 Sync"))).toBe(true);
  });
});
