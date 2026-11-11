// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { AgentLibraryBoard } from "./AgentLibraryBoard";
import { useAgentStore } from "../useAgentStore";

describe("AgentLibraryBoard", () => {
  beforeEach(() => {
    act(() => {
      useAgentStore.setState({
        projects: [
          { id: "proj_general", name: "General", createdAt: 1000 },
          { id: "proj_fitness", name: "Fitness", createdAt: 2000 },
        ],
        libraryItems: [
          {
            id: "lib-1",
            projectId: "proj_general",
            type: "skill",
            title: "Meeting Action Item Extractor",
            description: "Extract action items from transcript",
            content: "Please extract tasks and owners from transcript.",
            tags: ["Productivity"],
            createdAt: 1000,
            updatedAt: 1000,
          },
          {
            id: "lib-2",
            projectId: "proj_general",
            type: "rule",
            title: "Concise Bullet Output",
            description: "No conversational pleasantries",
            content: "Output strictly bullet points.",
            tags: ["Style"],
            createdAt: 2000,
            updatedAt: 2000,
          },
          {
            id: "lib-3",
            projectId: "proj_fitness",
            type: "prompt",
            title: "Weekly Workout Split",
            description: "Design 4 day upper lower routine",
            content: "Create a 4-day upper/lower strength split.",
            tags: ["Fitness"],
            createdAt: 3000,
            updatedAt: 3000,
          },
        ],
        activeNavSection: "library",
        pendingPromptText: null,
      });
    });
  });

  it("renders library items and filter pills", () => {
    render(<AgentLibraryBoard />);

    expect(screen.getByText("Meeting Action Item Extractor")).toBeTruthy();
    expect(screen.getByText("Concise Bullet Output")).toBeTruthy();
    expect(screen.getByText("Weekly Workout Split")).toBeTruthy();

    expect(screen.getByRole("button", { name: "All Projects" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fitness" })).toBeTruthy();
    expect(screen.getByText("ADD NEW")).toBeTruthy();
  });

  it("filters items by project pill and type pill", () => {
    render(<AgentLibraryBoard />);

    // Filter by Fitness project pill
    const fitnessPill = screen.getByRole("button", { name: "Fitness" });
    fireEvent.click(fitnessPill);

    expect(screen.getByText("Weekly Workout Split")).toBeTruthy();
    expect(screen.queryByText("Meeting Action Item Extractor")).toBeNull();

    // Filter by Rules type pill
    const rulesPill = screen.getByRole("button", { name: /rules/i });
    fireEvent.click(rulesPill);

    // No rules under Fitness project
    expect(
      screen.getByText("No library items found matching your filters."),
    ).toBeTruthy();
  });

  it("integrates single item into chat prompt via 'use in prompt' button", () => {
    render(<AgentLibraryBoard />);

    const useInPromptBtn = screen.getByLabelText(
      "Use Meeting Action Item Extractor in prompt",
    );
    fireEvent.click(useInPromptBtn);

    const store = useAgentStore.getState();
    expect(store.activeNavSection).toBe("chat");
    expect(store.pendingPromptText).toContain(
      "Please extract tasks and owners from transcript.",
    );
  });

  it("selects items and batch integrates them into prompt", () => {
    render(<AgentLibraryBoard />);

    const selectBtn1 = screen.getByLabelText(
      "Select Meeting Action Item Extractor",
    );
    const selectBtn2 = screen.getByLabelText("Select Concise Bullet Output");

    fireEvent.click(selectBtn1);
    fireEvent.click(selectBtn2);

    expect(screen.getByText("2 selected")).toBeTruthy();

    const batchUseBtn = screen.getByTitle("Use selected items in prompt");
    fireEvent.click(batchUseBtn);

    const store = useAgentStore.getState();
    expect(store.activeNavSection).toBe("chat");
    expect(store.pendingPromptText).toContain("Meeting Action Item Extractor");
    expect(store.pendingPromptText).toContain("Concise Bullet Output");
  });

  it("toggles between grid and list views", () => {
    render(<AgentLibraryBoard />);

    const listBtn = screen.getByLabelText("List view");
    fireEvent.click(listBtn);

    // In list view, table list items are displayed
    expect(screen.getByText("Meeting Action Item Extractor")).toBeTruthy();

    const gridBtn = screen.getByLabelText("Grid view");
    fireEvent.click(gridBtn);

    expect(screen.getByText("Meeting Action Item Extractor")).toBeTruthy();
  });
});
