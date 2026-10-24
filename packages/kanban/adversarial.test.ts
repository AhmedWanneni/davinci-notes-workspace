import { describe, it, expect } from "vitest";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";
import { isKanbanBoard } from "./isKanbanBoard";

describe("Part 1: Adversarial Inputs Verification", () => {
  it("handles a board with no lanes safely", () => {
    const text = `---
kanban-plugin: board
---

Some introductory text without any H2 headings.
Second paragraph.
`;
    expect(isKanbanBoard(text)).toBe(true);
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(0);
    expect(board.preambleLines.length).toBeGreaterThan(0);
    expect(serializeBoard(board)).toBe(text);
  });

  it("handles an empty file with only frontmatter", () => {
    const text = `---
kanban-plugin: board
---
`;
    expect(isKanbanBoard(text)).toBe(true);
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(0);
    expect(serializeBoard(board)).toBe(text);
  });

  it("handles a card line containing '## ' without mistaking it for a lane", () => {
    const text = `---
kanban-plugin: board
---

## Real Lane
- [ ] Fix issue ## 452 in backend
- [ ] Read section ## Heading for details
\tIndented text discussing ## subheadings
- [x] Finished ## 100
`;
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(1);
    expect(board.lanes[0].title).toBe("Real Lane");
    expect(board.lanes[0].cards).toHaveLength(3);
    expect(board.lanes[0].cards[0].title).toBe("Fix issue ## 452 in backend");
    expect(board.lanes[0].cards[1].title).toBe(
      "Read section ## Heading for details",
    );
    expect(serializeBoard(board)).toBe(text);
  });

  it("handles very long lines without truncation or crash", () => {
    const longTitle = "A".repeat(50_000);
    const text = `---
kanban-plugin: board
---

## Big Lane
- [ ] ${longTitle}
`;
    const board = parseBoard(text);
    expect(board.lanes[0].cards[0].title).toBe(longTitle);
    expect(serializeBoard(board)).toBe(text);
  });

  it("fails safely for malformed frontmatter by not classifying as kanban", () => {
    const brokenYaml = `---
kanban-plugin: [broken unclosed list
some bad yaml:
`;
    expect(isKanbanBoard(brokenYaml)).toBe(false);

    const missingEnd = `---
kanban-plugin: board

## Lane
- [ ] Card
`;
    // Missing closing --- fence
    expect(isKanbanBoard(missingEnd)).toBe(false);
  });

  it("handles a 5,000-card board safely and losslessly", () => {
    const lanesCount = 5;
    const cardsPerLane = 1000;
    const lines = ["---", "kanban-plugin: board", "---", ""];

    for (let l = 0; l < lanesCount; l += 1) {
      lines.push(`## Lane ${l + 1}`);
      for (let c = 0; c < cardsPerLane; c += 1) {
        lines.push(`- [ ] Task ${l}-${c}`);
      }
      lines.push("");
    }

    const largeDoc = lines.join("\n");
    const board = parseBoard(largeDoc);
    expect(board.lanes).toHaveLength(lanesCount);
    expect(board.lanes[0].cards).toHaveLength(cardsPerLane);
    const serialized = serializeBoard(board);
    expect(serialized).toBe(largeDoc);
  });
});
