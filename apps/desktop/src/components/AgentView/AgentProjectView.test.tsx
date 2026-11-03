// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { AgentProjectView } from "./AgentProjectView";
import { useAgentStore } from "./useAgentStore";

describe("AgentProjectView", () => {
  beforeEach(() => {
    act(() => {
      useAgentStore.setState({
        conversations: [
          {
            id: "chat-1",
            title: "Audio transcription tools",
            messages: [],
            createdAt: Date.now() - 34 * 60000,
            updatedAt: Date.now() - 34 * 60000,
            projectId: "proj-gym",
          },
        ],
        projects: [
          {
            id: "proj-gym",
            name: "gym",
            createdAt: 1000,
            sources: ["Context of gym app.md"],
          },
        ],
        activeConversationId: null,
        activeProjectId: "proj-gym",
        projectInstructions: {},
      });
    });
  });

  it("renders project breadcrumbs, prompt card, recents, and context panel", () => {
    const onSend = vi.fn();
    render(<AgentProjectView projectId="proj-gym" onSend={onSend} />);

    expect(screen.getByText("Projects")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "gym", level: 1 })).toBeTruthy();
    expect(
      screen.getByPlaceholderText(/How can I help you today\?/i),
    ).toBeTruthy();
    expect(screen.getByText("Recents")).toBeTruthy();
    expect(screen.getByText("Audio transcription tools")).toBeTruthy();
    expect(screen.getByText(/34 minutes ago/i)).toBeTruthy();

    expect(screen.getByText("Instructions")).toBeTruthy();
    expect(screen.getByText("Memory")).toBeTruthy();
    expect(screen.getByText("Context")).toBeTruthy();
    expect(screen.getByText(/Context of gym app/i)).toBeTruthy();
  });

  it("allows submitting a prompt from project view", () => {
    const onSend = vi.fn();
    render(<AgentProjectView projectId="proj-gym" onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/How can I help you today\?/i);
    fireEvent.change(textarea, {
      target: { value: "Let's work on workout log" },
    });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).toHaveBeenCalledWith("Let's work on workout log");
  });
});
