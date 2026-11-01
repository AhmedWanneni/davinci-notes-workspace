// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { AgentSidebarPanel } from "./AgentSidebarPanel";
import { useAgentStore } from "./useAgentStore";

describe("AgentSidebarPanel", () => {
  beforeEach(() => {
    act(() => {
      useAgentStore.setState({
        conversations: [
          {
            id: "conv-1",
            title: "Coursera Free Access Details",
            projectId: null,
            createdAt: 1000,
            updatedAt: 1000,
            messages: [],
          },
          {
            id: "conv-2",
            title: "Gym Workout Plan",
            projectId: "proj-gym",
            createdAt: 2000,
            updatedAt: 2000,
            messages: [],
          },
        ],
        projects: [
          { id: "proj-gym", name: "gym", createdAt: 1000 },
          { id: "proj-papers", name: "Papers daily", createdAt: 2000 },
          { id: "proj-search", name: "Search", createdAt: 3000 },
        ],
        activeConversationId: "conv-1",
        activeProjectId: null,
        activeNavSection: "chat",
        searchQuery: "",
      });
    });
  });

  it("renders header, top nav, projects, and recents", () => {
    render(<AgentSidebarPanel />);

    expect(screen.getByText("ChatGPT")).toBeTruthy();
    expect(screen.getByText("New chat")).toBeTruthy();
    expect(screen.getByText("Images")).toBeTruthy();
    expect(screen.getByText("Scheduled")).toBeTruthy();
    expect(screen.getByText("Library")).toBeTruthy();

    expect(screen.getByText("Projects")).toBeTruthy();
    expect(screen.getByText("gym")).toBeTruthy();
    expect(screen.getByText("Papers daily")).toBeTruthy();
    expect(screen.getByText("Search")).toBeTruthy();

    expect(screen.getByText("Recents")).toBeTruthy();
    expect(screen.getByText("Coursera Free Access Details")).toBeTruthy();
  });

  it("selects a project and displays its nested chats", () => {
    render(<AgentSidebarPanel />);

    const gymBtn = screen.getByText("gym");
    fireEvent.click(gymBtn);

    expect(useAgentStore.getState().activeProjectId).toBe("proj-gym");
    expect(screen.getByText("Gym Workout Plan")).toBeTruthy();
  });

  it("creates a new project via the add button", async () => {
    render(<AgentSidebarPanel />);

    const addBtn = screen.getByLabelText("Add project");
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText("Project name...");
    fireEvent.change(input, { target: { value: "messaging" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("messaging")).toBeTruthy();
  });

  it("clicks + on a project to open project overview and deletes a nested chat", () => {
    render(<AgentSidebarPanel />);

    const addChatBtn = screen.getByLabelText("New conversation in gym");
    fireEvent.click(addChatBtn);

    expect(useAgentStore.getState().activeProjectId).toBe("proj-gym");
    expect(useAgentStore.getState().activeConversationId).toBeNull();

    const deleteChatBtn = screen.getByLabelText("Delete Gym Workout Plan");
    fireEvent.click(deleteChatBtn);

    expect(
      useAgentStore.getState().conversations.find((c) => c.id === "conv-2"),
    ).toBeUndefined();
  });
});
