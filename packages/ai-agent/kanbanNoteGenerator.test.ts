import { describe, expect, it } from "vitest";
import { generateKanbanMarkdown } from "./kanbanNoteGenerator.js";

describe("kanbanNoteGenerator", () => {
  it("generates default 3-lane kanban board when no lanes provided", () => {
    const md = generateKanbanMarkdown({ title: "Sprint 42" });
    expect(md).toContain("kanban-plugin: board");
    expect(md).toContain("# Sprint 42");
    expect(md).toContain("## To Do");
    expect(md).toContain("## Doing");
    expect(md).toContain("## Done");
  });

  it("generates custom lanes with cards", () => {
    const md = generateKanbanMarkdown({
      title: "Product Roadmap",
      lanes: [
        { name: "Backlog", cards: ["Research competitors", "User interview"] },
        { name: "In Progress", cards: ["Figma mockups"] },
        { name: "Complete", cards: [] },
      ],
    });

    expect(md).toContain(
      "## Backlog\n- [ ] Research competitors\n- [ ] User interview",
    );
    expect(md).toContain("## In Progress\n- [ ] Figma mockups");
    expect(md).toContain("## Complete");
  });
});
