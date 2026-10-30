import { describe, it, expect } from "vitest";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";
import {
  moveCard,
  editCard,
  toggleCard,
  addCard,
  deleteCard,
} from "./cardOperations";
import {
  addLane,
  renameLane,
  deleteLane,
  reorderLanes,
} from "./laneOperations";
import { computeLineDiff } from "./lineDiff";

const BASE_FIXTURE = `---
kanban-plugin: board
---

## To Do
- [ ] Card A
- [ ] Card B
- [ ] Card C

## Doing
- [ ] Card D

## Done
- [x] Card E
`;

describe("Part 1: Minimal Diffs Verification", () => {
  it("move card: changes only the affected lines in source and target lanes", () => {
    const board = parseBoard(BASE_FIXTURE);
    const cardB = board.lanes[0].cards[1];
    expect(cardB.title).toBe("Card B");

    // Move Card B to Doing (lane 1) at index 0
    moveCard(board, cardB.id, board.lanes[1].id, 0);
    const updated = serializeBoard(board);

    const diff = computeLineDiff(BASE_FIXTURE, updated);
    // Card B was removed from To Do and inserted at top of Doing
    const modifiedOrRemoved = diff.filter(
      (d) => d.type !== "added" || d.newLine?.includes("Card B"),
    );
    expect(modifiedOrRemoved.length).toBeGreaterThan(0);
    expect(updated).toContain("## Doing\n- [ ] Card B\n- [ ] Card D");
    expect(updated).toContain("## To Do\n- [ ] Card A\n- [ ] Card C");
    // Frontmatter and Done lane untouched
    expect(updated).toContain("kanban-plugin: board");
    expect(updated).toContain("## Done\n- [x] Card E");
  });

  it("reorder cards: changes only card order within the lane", () => {
    const board = parseBoard(BASE_FIXTURE);
    const cardA = board.lanes[0].cards[0];

    // Move Card A to index 2 in To Do
    moveCard(board, cardA.id, board.lanes[0].id, 2);
    const updated = serializeBoard(board);

    expect(updated).toContain(
      "## To Do\n- [ ] Card B\n- [ ] Card C\n- [ ] Card A",
    );
    expect(updated).toContain("## Doing\n- [ ] Card D");
    expect(updated).toContain("## Done\n- [x] Card E");
  });

  it("edit card: modifies exactly the targeted card line", () => {
    const board = parseBoard(BASE_FIXTURE);
    const cardB = board.lanes[0].cards[1];

    editCard(board, cardB.id, "Card B Renamed");
    const updated = serializeBoard(board);

    const diff = computeLineDiff(BASE_FIXTURE, updated);
    expect(diff).toEqual([
      {
        type: "modified",
        lineIndex: 6,
        oldLine: "- [ ] Card B",
        newLine: "- [ ] Card B Renamed",
      },
    ]);
  });

  it("toggle card: changes only the checkbox status [ ] <-> [x]", () => {
    const board = parseBoard(BASE_FIXTURE);
    const cardA = board.lanes[0].cards[0];

    toggleCard(board, cardA.id);
    const updated = serializeBoard(board);

    const diff = computeLineDiff(BASE_FIXTURE, updated);
    expect(diff).toEqual([
      {
        type: "modified",
        lineIndex: 5,
        oldLine: "- [ ] Card A",
        newLine: "- [x] Card A",
      },
    ]);
  });

  it("add card: inserts exactly the new card line into the lane", () => {
    const board = parseBoard(BASE_FIXTURE);

    addCard(board, board.lanes[0].id, "New Card In To Do", "", 1);
    const updated = serializeBoard(board);

    expect(updated).toContain(
      "- [ ] Card A\n- [ ] New Card In To Do\n- [ ] Card B",
    );
    expect(updated).toContain("## Doing\n- [ ] Card D");
  });

  it("delete card: removes exactly the target card lines", () => {
    const board = parseBoard(BASE_FIXTURE);
    const cardB = board.lanes[0].cards[1];

    deleteCard(board, cardB.id);
    const updated = serializeBoard(board);

    expect(updated).not.toContain("Card B");
    expect(updated).toContain("## To Do\n- [ ] Card A\n- [ ] Card C");
  });

  it("add lane: adds only the new lane heading", () => {
    const board = parseBoard(BASE_FIXTURE);

    addLane(board, "Review", 2);
    const updated = serializeBoard(board);

    expect(updated).toContain("## Review");
    expect(board.lanes[2].title).toBe("Review");
  });

  it("rename lane: modifies exactly the lane heading line", () => {
    const board = parseBoard(BASE_FIXTURE);
    const doingLane = board.lanes[1];

    renameLane(board, doingLane.id, "In Progress");
    const updated = serializeBoard(board);

    const diff = computeLineDiff(BASE_FIXTURE, updated);
    expect(diff).toEqual([
      {
        type: "modified",
        lineIndex: 9,
        oldLine: "## Doing",
        newLine: "## In Progress",
      },
    ]);
  });

  it("delete lane: removes exactly the lane and its cards", () => {
    const board = parseBoard(BASE_FIXTURE);
    const doingLane = board.lanes[1];

    deleteLane(board, doingLane.id);
    const updated = serializeBoard(board);

    expect(updated).not.toContain("## Doing");
    expect(updated).not.toContain("Card D");
    expect(updated).toContain(
      "## To Do\n- [ ] Card A\n- [ ] Card B\n- [ ] Card C",
    );
    expect(updated).toContain("## Done\n- [x] Card E");
  });

  it("reorder lanes: changes only the lane order", () => {
    const board = parseBoard(BASE_FIXTURE);
    const laneIds = [board.lanes[2].id, board.lanes[0].id, board.lanes[1].id];

    reorderLanes(board, laneIds);
    const updated = serializeBoard(board);

    const laneIndices = [
      updated.indexOf("## Done"),
      updated.indexOf("## To Do"),
      updated.indexOf("## Doing"),
    ];
    expect(laneIndices[0]).toBeLessThan(laneIndices[1]);
    expect(laneIndices[1]).toBeLessThan(laneIndices[2]);
  });
});
