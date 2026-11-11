// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MeetingAgentChatFeed } from "./MeetingAgentChatFeed";
import type { ChatMessageItem } from "../../AgentView/agentTypes";

describe("MeetingAgentChatFeed", () => {
  const mockMessages: ChatMessageItem[] = [
    {
      id: "m_1",
      role: "user",
      content: "What did we decide about the release date?",
      timestamp: Date.now() - 5000,
    },
    {
      id: "m_2",
      role: "assistant",
      content: "The team agreed to release on November 15.",
      timestamp: Date.now() - 3000,
      toolCalls: [{ id: "t1", tool: "search_vault", args: {}, result: "Nov 15" }],
    },
  ];

  it("renders messages and tool execution badges", () => {
    render(
      <MeetingAgentChatFeed
        messages={mockMessages}
        isExecuting={false}
        onAskQuestion={vi.fn()}
        conversationId="conv_meet_123"
      />,
    );

    expect(screen.getByText("What did we decide about the release date?")).toBeTruthy();
    expect(screen.getByText("The team agreed to release on November 15.")).toBeTruthy();
    expect(screen.getByText("Used search_vault")).toBeTruthy();
  });

  it("submits a new user question to the agent", async () => {
    const handleAskQuestion = vi.fn().mockResolvedValue(undefined);
    render(
      <MeetingAgentChatFeed
        messages={[]}
        isExecuting={false}
        onAskQuestion={handleAskQuestion}
        conversationId="conv_meet_123"
      />,
    );

    const input = screen.getByTestId("agent-chat-input");
    fireEvent.change(input, { target: { value: "Who is responsible for QA?" } });
    fireEvent.click(screen.getByTestId("agent-chat-send-btn"));

    await waitFor(() => {
      expect(handleAskQuestion).toHaveBeenCalledWith("Who is responsible for QA?");
    });
  });

  it("shows thinking state when agent is executing", () => {
    render(
      <MeetingAgentChatFeed
        messages={[]}
        isExecuting={true}
        onAskQuestion={vi.fn()}
        conversationId="conv_meet_123"
      />,
    );

    expect(screen.getByText(/Agent searching transcript & thinking…/i)).toBeTruthy();
  });
});
