// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentConversationsDrawer } from "./AgentConversationsDrawer";
import type { AgentConversation, AgentProject } from "@app/ai-agent";

describe("AgentConversationsDrawer", () => {
  const mockProjects: AgentProject[] = [
    { id: "proj_finance", name: "Finance", createdAt: 1000 },
    { id: "proj_work", name: "Work", createdAt: 2000 },
  ];

  const mockConversations: AgentConversation[] = [
    {
      id: "conv_1",
      title: "Q3 Budget Planning",
      projectId: "proj_finance",
      createdAt: 1000,
      updatedAt: 1000,
      messages: [{ id: "m1", role: "user", content: "Analyze spend", timestamp: 1000 }],
    },
    {
      id: "conv_2",
      title: "Weekly Status Update",
      projectId: "proj_work",
      createdAt: 2000,
      updatedAt: 2000,
      messages: [{ id: "m2", role: "user", content: "Summarize status", timestamp: 2000 }],
    },
  ];

  it("renders conversation list and filters by project", () => {
    const onSelect = vi.fn();
    render(
      <AgentConversationsDrawer
        isOpen={true}
        onClose={vi.fn()}
        conversations={mockConversations}
        projects={mockProjects}
        activeConversationId="conv_1"
        onSelectConversation={onSelect}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
        onAddProject={vi.fn()}
        onAssignProject={vi.fn()}
      />
    );

    expect(screen.getByText("Conversations")).toBeTruthy();
    expect(screen.getByText("Q3 Budget Planning")).toBeTruthy();
    expect(screen.getByText("Weekly Status Update")).toBeTruthy();

    // Click on Finance project chip
    const chips = screen.getAllByText("Finance");
    fireEvent.click(chips[0]);
    expect(screen.getByText("Q3 Budget Planning")).toBeTruthy();
    expect(screen.queryByText("Weekly Status Update")).toBeNull();

    // Select conversation
    fireEvent.click(screen.getByText("Q3 Budget Planning"));
    expect(onSelect).toHaveBeenCalledWith("conv_1");
  });

  it("triggers new conversation creation", () => {
    const onNew = vi.fn();
    render(
      <AgentConversationsDrawer
        isOpen={true}
        onClose={vi.fn()}
        conversations={mockConversations}
        projects={mockProjects}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={onNew}
        onDeleteConversation={vi.fn()}
        onAddProject={vi.fn()}
        onAssignProject={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /New/i }));
    expect(onNew).toHaveBeenCalled();
  });
});
