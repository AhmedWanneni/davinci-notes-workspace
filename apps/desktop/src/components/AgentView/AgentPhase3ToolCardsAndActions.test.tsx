// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentToolCard } from "./AgentToolCard";
import { AgentMessageActions } from "./AgentMessageActions";
import { AgentMessageBubble } from "./AgentMessageBubble";
import type { ChatMessageItem, AgentToolCall } from "./agentTypes";

describe("Phase 3: Tool Cards, Diff Links & Message Actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("Requirement 1 & 2: AgentToolCard shows clean summary, expands details, handles view diff", () => {
    const onViewDiff = vi.fn();
    const toolCall: AgentToolCall = {
      id: "tc_1",
      name: "create_note",
      arguments: { path: "Projects/Roadmap.md", content: "# Roadmap" },
    };

    render(
      <AgentToolCard
        toolCall={toolCall}
        result={{ toolCallId: "tc_1", output: { success: true } }}
        onViewDiff={onViewDiff}
      />,
    );

    expect(screen.getByText('Create note "Projects/Roadmap.md"')).toBeTruthy();

    // View diff button exists for file modification tools
    const diffBtn = screen.getByRole("button", { name: /view diff/i });
    expect(diffBtn).toBeTruthy();
    fireEvent.click(diffBtn);
    expect(onViewDiff).toHaveBeenCalledWith("Projects/Roadmap.md");

    // Toggle card expansion
    const toggleBtn = screen.getByRole("button", {
      name: /create note "projects\/roadmap\.md"/i,
    });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/"success": true/)).toBeTruthy();
  });

  it("Requirement 3: AgentMessageActions handles Copy, Edit, and Regenerate", async () => {
    const onEdit = vi.fn();
    const onRegenerate = vi.fn();

    // User message actions
    const { rerender } = render(
      <AgentMessageActions
        role="user"
        content="Please organize my notes"
        onEdit={onEdit}
      />,
    );

    const editBtn = screen.getByRole("button", { name: /edit message/i });
    expect(editBtn).toBeTruthy();
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalled();

    // Assistant message actions
    rerender(
      <AgentMessageActions
        role="assistant"
        content="I have organized your notes into 3 folders."
        onRegenerate={onRegenerate}
      />,
    );

    const regenBtn = screen.getByRole("button", {
      name: /regenerate response/i,
    });
    expect(regenBtn).toBeTruthy();
    fireEvent.click(regenBtn);
    expect(onRegenerate).toHaveBeenCalled();

    const copyBtn = screen.getByRole("button", { name: /copy markdown/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "I have organized your notes into 3 folders.",
    );
  });

  it("renders tool cards and message actions integrated into AgentMessageBubble", () => {
    const onEditMessage = vi.fn();
    const msg: ChatMessageItem = {
      id: "msg_user_1",
      role: "user",
      content: "Hello agent",
      timestamp: Date.now(),
    };

    render(
      <AgentMessageBubble message={msg} onEditMessage={onEditMessage} />,
    );

    expect(screen.getByText("Hello agent")).toBeTruthy();
    const editBtn = screen.getByRole("button", { name: /edit message/i });
    fireEvent.click(editBtn);
    expect(onEditMessage).toHaveBeenCalledWith("msg_user_1", "Hello agent");
  });
});
