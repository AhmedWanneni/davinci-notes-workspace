import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";
import { setLaneColor, renameLane, deleteLane } from "./laneOperations";
import { KanbanView } from "./KanbanView";

const BOARD_WITH_TITLE = `---
kanban-plugin: board
---

# Sprint Roadmap

## Backlog
- [ ] Research user flows

## In Progress
- [ ] Implement color picker

## Done
- [x] Initial release
`;

const BOARD_WITH_COLORS = `---
kanban-plugin: board
---

## To Do
- [ ] Task 1

## Doing
- [ ] Task 2

%% kanban:settings
\`\`\`json
{
  "kanban-plugin": "board",
  "lane-colors": {
    "To Do": "#ef4444",
    "Doing": "#3b82f6"
  }
}
\`\`\`
%%
`;

describe("Kanban Column Colors and Title", () => {
  it("renders simple board title from # Title preamble", () => {
    render(
      <KanbanView
        path="vault/Roadmap.md"
        initialContent={BOARD_WITH_TITLE}
        onContentChange={vi.fn()}
      />,
    );

    const titleElement = screen.getByRole("heading", { level: 1 });
    expect(titleElement.textContent).toBe("Sprint Roadmap");
  });

  it("falls back to file path stem when no # Title exists", () => {
    const raw = `---\nkanban-plugin: board\n---\n\n## Lane 1\n- [ ] Task\n`;
    render(
      <KanbanView
        path="work/My Project Board.md"
        initialContent={raw}
        onContentChange={vi.fn()}
      />,
    );

    const titleElement = screen.getByRole("heading", { level: 1 });
    expect(titleElement.textContent).toBe("My Project Board");
  });

  it("parses lane colors from settings block", () => {
    const board = parseBoard(BOARD_WITH_COLORS);
    expect(board.lanes[0].color).toBe("#ef4444");
    expect(board.lanes[1].color).toBe("#3b82f6");
    // Lossless round trip
    expect(serializeBoard(board)).toBe(BOARD_WITH_COLORS);
  });

  it("sets lane color and updates settings block in epilogue", () => {
    const board = parseBoard(BOARD_WITH_TITLE);
    const updated = setLaneColor(board, board.lanes[0].id, "#cd47ab");
    expect(updated.lanes[0].color).toBe("#cd47ab");

    const serialized = serializeBoard(updated);
    expect(serialized).toContain("%%");
    expect(serialized).toContain("kanban:settings");
    expect(serialized).toContain("#cd47ab");
    expect(serialized).toContain("Backlog");

    // Reparse to verify round-trip
    const reparsed = parseBoard(serialized);
    expect(reparsed.lanes[0].color).toBe("#cd47ab");
  });

  it("updates lane color key when a colored lane is renamed", () => {
    const board = parseBoard(BOARD_WITH_COLORS);
    const renamed = renameLane(board, board.lanes[0].id, "Ready");
    expect(renamed.lanes[0].title).toBe("Ready");

    const serialized = serializeBoard(renamed);
    expect(serialized).toContain("## Ready");
    expect(serialized).toContain('"Ready": "#ef4444"');
    expect(serialized).not.toContain('"To Do": "#ef4444"');
  });

  it("removes lane color from settings when lane is deleted", () => {
    const board = parseBoard(BOARD_WITH_COLORS);
    const deleted = deleteLane(board, board.lanes[0].id);
    const serialized = serializeBoard(deleted);
    expect(serialized).not.toContain("## To Do");
    expect(serialized).not.toContain('"To Do"');
  });

  it("allows user to pick a column color via the UI palette button", () => {
    const onContentChange = vi.fn();
    render(
      <KanbanView
        path="board.md"
        initialContent={BOARD_WITH_TITLE}
        onContentChange={onContentChange}
      />,
    );

    const paletteButtons = screen.getAllByTitle("Change column color");
    expect(paletteButtons.length).toBe(3);

    // Click palette on first lane ("Backlog")
    fireEvent.click(paletteButtons[0]);

    // Color picker popover should be visible with swatches
    const purpleSwatch = screen.getByRole("button", { name: "Purple" });
    fireEvent.click(purpleSwatch);

    expect(onContentChange).toHaveBeenCalled();
    const updatedContent = onContentChange.mock.calls[0][1];
    expect(updatedContent).toContain("lane-colors");
    expect(updatedContent).toContain("#cd47ab");
  });
});
