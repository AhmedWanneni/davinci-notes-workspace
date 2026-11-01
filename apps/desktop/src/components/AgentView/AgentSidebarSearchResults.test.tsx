// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentSidebarSearchResults } from "./AgentSidebarSearchResults";

describe("AgentSidebarSearchResults", () => {
  const conversations = [
    {
      id: "c-1",
      title: "Audio transcription tools",
      projectId: "p-1",
      createdAt: 1000,
      updatedAt: 1000,
      messages: [
        {
          id: "m-1",
          role: "user" as const,
          content: "Looking for Whisper AI tools",
          timestamp: 1000,
        },
      ],
    },
    {
      id: "c-2",
      title: "Android release build",
      projectId: null,
      createdAt: 2000,
      updatedAt: 2000,
      messages: [
        {
          id: "m-2",
          role: "assistant" as const,
          content: "Fixed Syncthing native binary",
          timestamp: 2000,
        },
      ],
    },
  ];

  const projects = [{ id: "p-1", name: "Mobile", createdAt: 1000 }];

  it("finds conversations by title", () => {
    const onSelect = vi.fn();
    render(
      <AgentSidebarSearchResults
        query="Audio"
        conversations={conversations}
        projects={projects}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />,
    );

    expect(screen.getByText("Audio transcription tools")).toBeTruthy();
    expect(screen.getByText("Mobile")).toBeTruthy();
    fireEvent.click(screen.getByText("Audio transcription tools"));
    expect(onSelect).toHaveBeenCalledWith("c-1");
  });

  it("finds conversations by message content with contextual snippet", () => {
    render(
      <AgentSidebarSearchResults
        query="Syncthing"
        conversations={conversations}
        projects={projects}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
      />,
    );

    expect(screen.getByText("Android release build")).toBeTruthy();
    expect(screen.getByText(/Fixed Syncthing native binary/i)).toBeTruthy();
  });

  it("shows empty state when no matches found", () => {
    render(
      <AgentSidebarSearchResults
        query="nonexistent"
        conversations={conversations}
        projects={projects}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
      />,
    );

    expect(screen.getByText(/No chats found matching/i)).toBeTruthy();
  });
});
