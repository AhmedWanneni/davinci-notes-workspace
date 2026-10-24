import { describe, it, expect } from "vitest";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";

describe("Part 1: Lossless Round-Trip Verification", () => {
  it("losslessly round-trips empty lanes", () => {
    const text = `---
kanban-plugin: board
---

## To Do

## In Progress

## Done
`;
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(3);
    expect(board.lanes[0].cards).toHaveLength(0);
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips cards with multi-line bodies and nested lists", () => {
    const text = `---
kanban-plugin: board
---

## Complex Tasks
- [ ] Task with multi-line body
\tThis is a detailed paragraph.
\t- nested item 1
\t- nested item 2
\tMore detailed content here.
- [x] Simple completed task
`;
    const board = parseBoard(text);
    expect(board.lanes[0].cards).toHaveLength(2);
    expect(board.lanes[0].cards[0].body).toContain("nested item 1");
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips wikilinks in card titles and bodies", () => {
    const text = `---
kanban-plugin: board
---

## References
- [ ] Read [[Project Overview]] and [[Architecture#Deep Dive|Deep Architecture]]
\tSee also [[Notes/Daily-2026-10-24]]
`;
    const board = parseBoard(text);
    expect(board.lanes[0].cards[0].title).toBe(
      "Read [[Project Overview]] and [[Architecture#Deep Dive|Deep Architecture]]",
    );
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips tags", () => {
    const text = `---
kanban-plugin: board
---

## Tagged Items
- [ ] Implement feature #frontend #urgent #v2.1
- [x] Fix regression #bug/critical
`;
    const board = parseBoard(text);
    expect(board.lanes[0].cards[0].title).toBe(
      "Implement feature #frontend #urgent #v2.1",
    );
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips @{date} tokens", () => {
    const text = `---
kanban-plugin: board
---

## Scheduled
- [ ] Ship release @{2026-10-28} @{15:30}
- [ ] Follow up meeting @{2026-11-01}
`;
    const board = parseBoard(text);
    expect(board.lanes[0].cards[0].title).toContain("@{2026-10-28}");
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips a %% settings comment block", () => {
    const text = `---
kanban-plugin: board
---

## To Do
- [ ] Card 1

%% kanban:settings
\`\`\`json
{
  "kanban-plugin": "board",
  "lane-width": 300,
  "archive-with-date": true
}
\`\`\`
%%
`;
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(1);
    expect(board.epilogueLines.length).toBeGreaterThan(0);
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips an archive section", () => {
    const text = `---
kanban-plugin: board
---

## Active
- [ ] Active card

***

## Archive

- [x] Completed and archived card 1
- [x] Completed and archived card 2
`;
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(1);
    expect(board.epilogueLines.join("\n")).toContain("## Archive");
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips CRLF file line endings", () => {
    const text =
      "---\r\nkanban-plugin: board\r\n---\r\n\r\n## Windows Lane\r\n- [ ] Card CRLF\r\n- [x] Done CRLF\r\n";
    const board = parseBoard(text);
    expect(board.lineEnding).toBe("\r\n");
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips files with no trailing newline", () => {
    const text = `---
kanban-plugin: board
---

## Lane
- [ ] No trailing newline`;
    const board = parseBoard(text);
    expect(board.hasTrailingNewline).toBe(false);
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips extra frontmatter keys and ordering", () => {
    const text = `---
author: Leonardo
kanban-plugin: board
tags: [workflow, local-first]
created: 2026-10-24
custom-key: "special value"
---

## Tasks
- [ ] Preserve all metadata
`;
    const board = parseBoard(text);
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips files with H1 title and H3 subheadings", () => {
    const text = `---
kanban-plugin: board
---

# Project Launch Board
Preamble description note here.

## Backlog

### Urgent Subgroup
- [ ] Fix auth issue

## In Progress
- [ ] Writing tests
`;
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(2);
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips duplicate lane names", () => {
    const text = `---
kanban-plugin: board
---

## Sprint
- [ ] Task A

## Sprint
- [ ] Task B
`;
    const board = parseBoard(text);
    expect(board.lanes).toHaveLength(2);
    expect(board.lanes[0].title).toBe("Sprint");
    expect(board.lanes[1].title).toBe("Sprint");
    expect(board.lanes[0].id).not.toBe(board.lanes[1].id);
    expect(serializeBoard(board)).toBe(text);
  });

  it("losslessly round-trips Unicode and emoji in cards", () => {
    const text = `---
kanban-plugin: board
---

## International 🌍
- [ ] 🚀 Ship v2.0 update 🎯
\t日本語の説明文: タスクの詳細
\tCafé & résumé ⚡️
`;
    const board = parseBoard(text);
    expect(board.lanes[0].cards[0].title).toBe("🚀 Ship v2.0 update 🎯");
    expect(board.lanes[0].cards[0].body).toContain("日本語の説明文");
    expect(serializeBoard(board)).toBe(text);
  });
});
