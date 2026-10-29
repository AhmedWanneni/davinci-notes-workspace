import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanView } from "./KanbanView";

const INITIAL_BOARD = `---
kanban-plugin: board
---

## To Do
- [ ] Task 1 with [[Link Target|Alias]] and #urgent
- [ ] Task 2

## In Progress
- [ ] Task 3

## Done
- [x] Task 4 completed
`;

describe("Part 2: Kanban View Component", () => {
  it("renders lanes with titles, card counts, and rendered cards", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    expect(screen.getByText("To Do")).toBeDefined();
    expect(screen.getByText("In Progress")).toBeDefined();
    expect(screen.getByText("Done")).toBeDefined();

    // Check rendered wikilink alias and tag
    expect(screen.getByText("Alias")).toBeDefined();
    expect(screen.getByText("#urgent")).toBeDefined();
    expect(screen.getByText("Task 2")).toBeDefined();
    expect(screen.getByText("Task 3")).toBeDefined();
    expect(screen.getByText("Task 4 completed")).toBeDefined();
  });

  it("calls onLinkClick when clicking a wikilink in a card", () => {
    const onLinkClick = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={vi.fn()}
        onLinkClick={onLinkClick}
      />,
    );

    fireEvent.click(screen.getByText("Alias"));
    expect(onLinkClick).toHaveBeenCalledWith("Link Target");
  });

  it("toggles card completion when checkbox is clicked", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(onContentChange).toHaveBeenCalledTimes(1);
    const updatedContent = onContentChange.mock.calls[0][1];
    expect(updatedContent).toContain("- [x] Task 1 with [[Link Target|Alias]] and #urgent");
  });

  it("edits card inline: Enter saves, Esc cancels", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    // Double click Task 2 to edit
    const task2 = screen.getByText("Task 2");
    fireEvent.doubleClick(task2);

    const input = screen.getByDisplayValue("Task 2");
    fireEvent.change(input, { target: { value: "Task 2 Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onContentChange).toHaveBeenCalled();
    const updated = onContentChange.mock.calls[0][1];
    expect(updated).toContain("- [ ] Task 2 Updated");
  });

  it("adds a new card to a lane", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    const addButtons = screen.getAllByText("+ Add a card");
    fireEvent.click(addButtons[0]);

    const input = screen.getByPlaceholderText("Card title...");
    fireEvent.change(input, { target: { value: "Brand New Card" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onContentChange).toHaveBeenCalled();
    const updated = onContentChange.mock.calls[0][1];
    expect(updated).toContain("- [ ] Brand New Card");
  });

  it("deletes a card when delete button is clicked", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Delete card");
    fireEvent.click(deleteButtons[1]); // Delete Task 2

    expect(onContentChange).toHaveBeenCalled();
    const updated = onContentChange.mock.calls[0][1];
    expect(updated).not.toContain("Task 2");
  });

  it("adds a new lane", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    fireEvent.click(screen.getByText("+ Add lane"));
    const input = screen.getByPlaceholderText("Lane title...");
    fireEvent.change(input, { target: { value: "Review" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onContentChange).toHaveBeenCalled();
    const updated = onContentChange.mock.calls[0][1];
    expect(updated).toContain("## Review");
  });

  it("renames a lane", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    const renameButtons = screen.getAllByTitle("Rename lane");
    fireEvent.click(renameButtons[0]);

    const input = screen.getByDisplayValue("To Do");
    fireEvent.change(input, { target: { value: "Backlog" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onContentChange).toHaveBeenCalled();
    const updated = onContentChange.mock.calls[0][1];
    expect(updated).toContain("## Backlog");
  });

  it("deletes a lane with confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={onContentChange}
      />,
    );

    const deleteButtons = screen.getAllByTitle("Delete lane");
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(onContentChange).toHaveBeenCalled();
    const updated = onContentChange.mock.calls[0][1];
    expect(updated).not.toContain("## To Do");
  });

  it("supports keyboard navigation with arrow keys", () => {
    render(
      <KanbanView
        path="board.md"
        initialContent={INITIAL_BOARD}
        onContentChange={vi.fn()}
      />,
    );

    const container = screen.getByLabelText("Kanban board");
    // Arrow down selects first card then next
    fireEvent.keyDown(container, { key: "ArrowDown" });
    fireEvent.keyDown(container, { key: "ArrowDown" });
    // Escape unselects
    fireEvent.keyDown(container, { key: "Escape" });
  });
});
