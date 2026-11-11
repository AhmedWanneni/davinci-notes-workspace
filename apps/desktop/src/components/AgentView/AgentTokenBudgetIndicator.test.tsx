// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentTokenBudgetIndicator } from "./AgentTokenBudgetIndicator";
import { useAgentStore } from "./useAgentStore";
import type { ChatMessageItem } from "./agentTypes";

describe("AgentTokenBudgetIndicator", () => {
  beforeEach(() => {
    useAgentStore.setState({
      selectedCliAgent: "codex",
      selectedModel: "gpt-4o",
      conversations: [],
      activeConversationId: null,
    });
  });

  it("renders normal status when context usage is low", () => {
    const messages: ChatMessageItem[] = [
      { id: "1", role: "user", content: "Brief prompt", timestamp: 1 },
    ];

    render(<AgentTokenBudgetIndicator messages={messages} />);
    const indicator = screen.getByTestId("agent-token-budget-indicator");
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute("data-status")).toBe("normal");
  });

  it("renders warning status when context usage is high (>=70%)", () => {
    // 128k context for codex; 75% is ~96k tokens => 365,000 chars
    const bigContent = "a".repeat(365_000);
    const messages: ChatMessageItem[] = [
      { id: "1", role: "assistant", content: bigContent, timestamp: 1 },
    ];

    render(<AgentTokenBudgetIndicator messages={messages} />);
    const indicator = screen.getByTestId("agent-token-budget-indicator");
    expect(indicator.getAttribute("data-status")).toBe("warning");
    expect(screen.getByText(/High tokens/i)).toBeTruthy();
  });

  it("renders critical status when context usage is very high (>=90%)", () => {
    const hugeContent = "a".repeat(460_000);
    const messages: ChatMessageItem[] = [
      { id: "1", role: "assistant", content: hugeContent, timestamp: 1 },
    ];

    render(<AgentTokenBudgetIndicator messages={messages} />);
    const indicator = screen.getByTestId("agent-token-budget-indicator");
    expect(indicator.getAttribute("data-status")).toBe("critical");
    expect(screen.getByText(/Almost out of tokens/i)).toBeTruthy();
  });
});
