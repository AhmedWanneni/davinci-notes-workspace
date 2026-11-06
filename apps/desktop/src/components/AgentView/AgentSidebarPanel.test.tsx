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

  it("renders top nav, projects, and recents without header", () => {
    render(<AgentSidebarPanel />);

    // Header with ChatGPT brand is removed
    expect(screen.queryByText("ChatGPT")).toBeNull();

    // Top nav items
    expect(screen.getByText("New chat")).toBeTruthy();
    expect(screen.getAllByText("Search").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.queryByText("Images")).toBeNull();
    expect(screen.getByText("Scheduled")).toBeTruthy();

    // Removed nav items
    expect(screen.queryByText("Plugins")).toBeNull();
    expect(screen.queryByText("Codex")).toBeNull();
    expect(screen.queryByText("Explore")).toBeNull();

    expect(screen.getByText("Projects")).toBeTruthy();
    expect(screen.getByText("gym")).toBeTruthy();
    expect(screen.getByText("Papers daily")).toBeTruthy();

    expect(screen.getByText("Recents")).toBeTruthy();
    expect(screen.getByText("Coursera Free Access Details")).toBeTruthy();
  });

  it("toggles search input when clicking search nav item", () => {
    render(<AgentSidebarPanel />);

    expect(
      screen.queryByPlaceholderText("Search chats & messages..."),
    ).toBeNull();

    const searchNavBtn = screen.getAllByText("Search")[0];
    fireEvent.click(searchNavBtn);

    expect(
      screen.getByPlaceholderText("Search chats & messages..."),
    ).toBeTruthy();
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

  it("clicks + on a project to create a conversation under that project and deletes a nested chat", async () => {
    render(<AgentSidebarPanel />);

    const addChatBtn = screen.getByLabelText("New conversation in gym");
    await act(async () => {
      fireEvent.click(addChatBtn);
    });

    expect(useAgentStore.getState().activeProjectId).toBe("proj-gym");
    const activeConv = useAgentStore
      .getState()
      .conversations.find(
        (c) => c.id === useAgentStore.getState().activeConversationId,
      );
    expect(activeConv).toBeTruthy();
    expect(activeConv?.projectId).toBe("proj-gym");

    const deleteChatBtn = screen.getByLabelText("Delete Gym Workout Plan");
    await act(async () => {
      fireEvent.click(deleteChatBtn);
    });

    expect(
      useAgentStore.getState().conversations.find((c) => c.id === "conv-2"),
    ).toBeUndefined();
  });
});
