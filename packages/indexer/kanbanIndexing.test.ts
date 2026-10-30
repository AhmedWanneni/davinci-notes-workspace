import { describe, it, expect } from "vitest";
import { parseLinks, parseFrontmatter } from "./index";

describe("Part 4: Indexer and Backlink Verification for Kanban Boards", () => {
  it("treats kanban board notes normally and parses wikilinks from cards as backlinks", () => {
    const boardNoteContent = `---
kanban-plugin: board
title: Sprint Board
tags: [sprint, active]
---

## Backlog
- [ ] Research [[Authentication Architecture]] for v2
- [ ] Review [[API Specs#Endpoints|API Documentation]]

## In Progress
- [ ] Implement sync diffing with [[Sync Engine#^algo-block]]
\tDetailed sub-task referencing [[Database Schema]]

## Done
- [x] Initial design approved in [[Design System]]
`;

    // 1. Frontmatter parsing
    const { frontmatter, content } = parseFrontmatter(boardNoteContent);
    expect(frontmatter["kanban-plugin"]).toBe("board");
    expect(frontmatter.title).toBe("Sprint Board");

    // 2. Wikilink extraction
    const allKnownPaths = [
      "Authentication Architecture.md",
      "API Specs.md",
      "Sync Engine.md",
      "Database Schema.md",
      "Design System.md",
    ];

    const links = parseLinks(content, {
      sourcePath: "Boards/Sprint Board.md",
      notePaths: allKnownPaths,
    });

    const wikilinks = links.filter((link) => link.type === "wikilink");
    expect(wikilinks).toHaveLength(5);

    const targets = wikilinks.map((link) => link.target);
    expect(targets).toContain("Authentication Architecture.md");
    expect(targets).toContain("API Specs.md");
    expect(targets).toContain("Sync Engine.md");
    expect(targets).toContain("Database Schema.md");
    expect(targets).toContain("Design System.md");

    // Check alias preservation
    const aliasedLink = wikilinks.find(
      (link) => link.target === "API Specs.md",
    );
    expect(aliasedLink?.displayText).toBe("API Documentation");

    // Check fragment preservation
    expect(aliasedLink?.heading).toBe("Endpoints");
  });
});
