import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanView } from "./KanbanView";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";
import { moveCard } from "./cardOperations";

describe("Part 3: Write-Back and Conflict Handling", () => {
  it("preserves active in-progress card edit when external change updates the board", () => {
    const initialContent = `---
kanban-plugin: board
---

## To Do
- [ ] Card 1
- [ ] Card 2
`;

    const onContentChange = vi.fn();
    const { rerender } = render(
      <KanbanView
        path="board.md"
        initialContent={initialContent}
        onContentChange={onContentChange}
      />,
    );

    // 1. User starts editing Card 1
    const card1 = screen.getByText("Card 1");
    fireEvent.doubleClick(card1);

    const input = screen.getByDisplayValue("Card 1") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Card 1 In-Progress Draft" } });
    expect(input.value).toBe("Card 1 In-Progress Draft");

    // 2. Simulate external change arriving from Obsidian (e.g. an external user added Card 3)
    const externalContent = `---
kanban-plugin: board
---

## To Do
- [ ] Card 1
- [ ] Card 2
- [ ] Card 3 added by external Obsidian
`;

    rerender(
      <KanbanView
        path="board.md"
        initialContent={externalContent}
        onContentChange={onContentChange}
      />,
    );

    // 3. Assert external card is now present in the DOM
    expect(screen.getByText("Card 3 added by external Obsidian")).toBeDefined();

    // 4. Assert user's in-progress card input is STILL active with the uncommitted draft
    const editInputAfterUpdate = screen.getByDisplayValue("Card 1 In-Progress Draft");
    expect(editInputAfterUpdate).toBeDefined();

    // 5. User completes their edit
    fireEvent.keyDown(editInputAfterUpdate, { key: "Enter" });

    // 6. Assert write-back merged the edit with the external content losslessly
    expect(onContentChange).toHaveBeenCalled();
    const finalContent = onContentChange.mock.calls[0][1];
    expect(finalContent).toContain("- [ ] Card 1 In-Progress Draft");
    expect(finalContent).toContain("- [ ] Card 3 added by external Obsidian");
  });

  it("ensures board view and markdown mode operate on the identical underlying content", () => {
    const doc = `---
kanban-plugin: board
---

## Sprint
- [ ] Item Alpha
- [ ] Item Beta
`;
    // Simulate markdown editor updating text
    const updatedByMarkdown = doc.replace("Item Alpha", "Item Alpha Edited In Markdown");

    // Kanban board parses and reflects markdown update immediately
    const board = parseBoard(updatedByMarkdown);
    expect(board.lanes[0].cards[0].title).toBe("Item Alpha Edited In Markdown");

    // Kanban board moves a card
    moveCard(board, board.lanes[0].cards[0].id, board.lanes[0].id, 1);
    const updatedByBoard = serializeBoard(board);

    // Markdown content now reflects the moved card order
    expect(updatedByBoard).toContain("- [ ] Item Beta\n- [ ] Item Alpha Edited In Markdown");
    expect(updatedByBoard).toContain("kanban-plugin: board");
  });

  it("debounces writes and writes ONLY when content actually changed", () => {
    const content = `---
kanban-plugin: board
---

## Lane
- [ ] Card 1
`;
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={content}
        onContentChange={onContentChange}
      />,
    );

    // Click card to focus
    const card = screen.getByText("Card 1");
    fireEvent.click(card);

    // Double click to edit then cancel with Escape
    fireEvent.doubleClick(card);
    const input = screen.getByDisplayValue("Card 1");
    fireEvent.keyDown(input, { key: "Escape" });

    // No write triggered because content did not change
    expect(onContentChange).not.toHaveBeenCalled();
  });
});
